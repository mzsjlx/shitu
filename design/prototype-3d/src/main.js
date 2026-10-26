import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Water } from 'three/addons/objects/Water.js';

const host=document.querySelector('#scene');
const canvas=document.querySelector('#city-canvas');
const loading=document.querySelector('#load-status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(pointer: coarse)');
const started=performance.now();
let renderer,scene,camera,controls,model,data,composer,ao,bokeh,water;
let requestId=0,transition=null,foodVisible=true,firstFrame=0,pinSettleTimer=0;
const batches=new Map(),instances=new Map();
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
const Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
const dummy=new THREE.Object3D();
const mats={};
const stats={windows:0,buildings:0,omittedLandmarkPaths:0};

const palette={
  stone:'#b5ac99',ground:'#b5b49c',road:'#989c94',path:'#cbbfa6',sidewalk:'#dcd2be',
  cream0:'#e5dfd3',cream1:'#d8d5cc',cream2:'#eee6d7',cream3:'#dedbd4',cream4:'#d4d0c3',
  roof:'#bfc0b5',window:'#8b9c99',frame:'#c9c7ba',wood:'#654b38',woodLight:'#b78b54',
  tile:'#475958',tileRidge:'#697570',gold:'#b59a6d',wall:'#d5c3a2',bridge:'#b68970',bridgeEdge:'#e0d3ba',
  rail:'#c9c7b9',water:'#689d9a',trunk:'#7c7159',leaf:'#677c56',leafLight:'#889570',
  leafDeep:'#536f51',balcony:'#d9d3c5',shutter:'#a5b0a6',lantern:'#bd6749',rock:'#a59d89',grass:'#949c79',
  warmWindow:'#a37a4e',lamp:'#6f756c',carPaint:'#e9e2d1',carGlass:'#78928d',carRoof:'#c5c5b5'
};
function material(name,extra={}){return mats[name]||(mats[name]=new THREE.MeshStandardMaterial({color:palette[name],roughness:.84,metalness:0,...extra}));}
function rand(seed){let n=(seed*1664525+1013904223)>>>0;n^=n>>>13;return (n>>>0)/4294967296;}
function prepare(g){const geometry=g.index?g.toNonIndexed():g;if(!geometry.attributes.normal)geometry.computeVertexNormals();if(!geometry.attributes.uv)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));return geometry;}
function batch(geometry,name){if(!batches.has(name))batches.set(name,[]);batches.get(name).push(prepare(geometry));}
function box(w,h,d,x,y,z,name,rotation=0){const g=new THREE.BoxGeometry(w,h,d);g.rotateY(rotation);g.translate(x,y,z);batch(g,name);}
function beam(a,b,width,depth,name){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);if(dir.length()<.01)return;const g=new THREE.BoxGeometry(width,dir.length(),depth);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,dir.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());batch(g,name);}
function cylinderBetween(a,b,r,name,sides=6){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const len=dir.length();if(len<.01)return;const g=new THREE.CylinderGeometry(r,r,len,sides);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,dir.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());batch(g,name);}
function instance(name,geometry,pos,scale,quaternion=null,color=null){
  if(!instances.has(name))instances.set(name,{geometry,items:[]});
  dummy.position.set(...pos);dummy.scale.set(...scale);dummy.quaternion.copy(quaternion||new THREE.Quaternion());dummy.updateMatrix();
  instances.get(name).items.push({matrix:dummy.matrix.clone(),color});
}
function flush(){
  for(const [name,geometries] of batches){if(!geometries.length)continue;const merged=mergeGeometries(geometries,false);merged.computeBoundingSphere();const mesh=new THREE.Mesh(merged,material(name));mesh.name=name;mesh.castShadow=!['road','sidewalk','path','ground','water'].includes(name);mesh.receiveShadow=true;model.add(mesh);for(const g of geometries)g.dispose();}
  for(const [name,{geometry,items}] of instances){const mesh=new THREE.InstancedMesh(geometry,material(name),items.length);items.forEach((o,i)=>{mesh.setMatrixAt(i,o.matrix);if(o.color)mesh.setColorAt(i,new THREE.Color(o.color));});mesh.name=name;mesh.castShadow=!['window','frame','shutter'].includes(name);mesh.receiveShadow=true;mesh.computeBoundingSphere();model.add(mesh);}
  batches.clear();instances.clear();
}
function shapeFromRings(rings){const shape=new THREE.Shape(rings[0].map(([x,z])=>new THREE.Vector2(x,-z)));for(const ring of rings.slice(1))shape.holes.push(new THREE.Path(ring.map(([x,z])=>new THREE.Vector2(x,-z))));return shape;}
function extrude(rings,height,base,name){const g=new THREE.ExtrudeGeometry(shapeFromRings(rings),{depth:height,bevelEnabled:false,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,base,0);batch(g,name);}
function heightAt(x,z){const b=data.metadata.bounds,t=data.terrain,fx=THREE.MathUtils.clamp((x-b[0])/(b[2]-b[0])*(t.nx-1),0,t.nx-1.001),fz=THREE.MathUtils.clamp((z-b[1])/(b[3]-b[1])*(t.nz-1),0,t.nz-1.001),ix=Math.floor(fx),iz=Math.floor(fz),dx=fx-ix,dz=fz-iz;return THREE.MathUtils.lerp(THREE.MathUtils.lerp(t.grid[iz][ix],t.grid[iz][ix+1],dx),THREE.MathUtils.lerp(t.grid[iz+1][ix],t.grid[iz+1][ix+1],dx),dz);}
function inside(x,z,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function pointInWater(x,z){return data.water.some(r=>inside(x,z,r[0])&&!r.slice(1).some(h=>inside(x,z,h)));}
const unitBox=new THREE.BoxGeometry(1,1,1),unitPlane=new THREE.PlaneGeometry(1,1);

function waterNormals(){
  const size=256,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*Math.PI*2,v=y/size*Math.PI*2;
    const dx=.09*Math.sin(u*7+v*3+.9*Math.sin(v*5))+.04*Math.sin(u*17-v*11);
    const dy=.08*Math.cos(v*9-u*4+.7*Math.cos(u*3))+.04*Math.cos(v*19+u*13);
    const n=new THREE.Vector3(dx,dy,1).normalize(),i=(y*size+x)*4;
    pixels[i]=(n.x*.5+.5)*255;pixels[i+1]=(n.y*.5+.5)*255;pixels[i+2]=(n.z*.5+.5)*255;pixels[i+3]=255;
  }
  const texture=new THREE.DataTexture(pixels,size,size);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}
function terrain(){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.terrain.positions,3));g.setIndex(data.terrain.indices);g.computeVertexNormals();
  const colors=[],groundColor=new THREE.Color(palette.ground),greenColor=new THREE.Color(palette.grass);
  for(let i=0;i<g.attributes.position.count;i++){
    const x=g.attributes.position.getX(i),z=g.attributes.position.getZ(i);
    if(inside(x,z,data.landmark.orientedBounds))g.attributes.position.setY(i,data.landmark.minGround-1);
    let nearest=60;
    for(const t of data.trees){const dx=x-t[0],dz=z-t[2];if(Math.abs(dx)<nearest&&Math.abs(dz)<nearest)nearest=Math.min(nearest,Math.hypot(dx,dz));}
    const park=data.parks.some(p=>inside(x,z,p.rings[0])&&!p.rings.slice(1).some(r=>inside(x,z,r)));
    const green=park?.95:Math.max(0,1-nearest/37)*.72;
    const c=groundColor.clone().lerp(greenColor,green).multiplyScalar(.96+.08*rand(Math.round(x*17+z*29)));
    colors.push(c.r,c.g,c.b);
  }
  g.computeVertexNormals();
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1}));mesh.name='Sourced terrain';mesh.receiveShadow=true;model.add(mesh);
  material('water',{roughness:.3,metalness:.12});
  const riverGeometry=mergeGeometries(data.water.map(rings=>prepare(new THREE.ShapeGeometry(shapeFromRings(rings)))),false);
  water=new Water(riverGeometry,{textureWidth:512,textureHeight:512,waterNormals:waterNormals(),sunDirection:new THREE.Vector3(-420,750,-520).normalize(),sunColor:'#fff3dc',waterColor:palette.water,distortionScale:1.5,fog:true});
  water.name='water';water.rotation.x=-Math.PI/2;water.position.y=.45;
  const reflect=water.onBeforeRender;
  water.onBeforeRender=function(...args){if(!args[1].overrideMaterial)reflect.apply(this,args);};
  water.userData={note:'Fixed visual river level, procedural ripples, reflected scene. Not current hydrology.'};
  model.add(water);
  for(const rings of data.water){
    const ring=rings[0];for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];const bounds=data.metadata.bounds;if([a,b].some(p=>Math.abs(p[0]-bounds[0])<1||Math.abs(p[0]-bounds[2])<1||Math.abs(p[1]-bounds[1])<1||Math.abs(p[1]-bounds[3])<1))continue;const ya=heightAt(...a),yb=heightAt(...b);if(Math.hypot(a[0]-b[0],a[1]-b[1])>100)continue;const wall=new THREE.BufferGeometry();wall.setAttribute('position',new THREE.Float32BufferAttribute([a[0],.1,a[1],b[0],.1,b[1],b[0],yb,b[1],a[0],.1,a[1],b[0],yb,b[1],a[0],ya,a[1]],3));batch(wall,'stone');}}
}

function buildings(){
  material('window',{roughness:.36,metalness:.18});
  for(const b of data.buildings){
    const name='cream'+(b.id%5),base=b.base+.35,h=b.height;
    extrude(b.rings,h+base-b.minGround,b.minGround,name);stats.buildings++;
    const ring=b.rings[0],center=new THREE.Vector2(...b.center),near=center.length()<490;
    const tower=h>92,modern=tower&&b.id%3!==0,apartment=!modern&&b.id%3!==1;
    const floorH=modern?4.1:3.65,bay=modern?4.4:4.0;
    for(let i=1;i<ring.length;i++){
      const a=new THREE.Vector2(...ring[i-1]),v=new THREE.Vector2(...ring[i]).sub(a),len=v.length();if(len<2)continue;v.normalize();let n=new THREE.Vector2(-v.y,v.x);const mid=a.clone().addScaledVector(v,len/2);if(n.dot(mid.clone().sub(center))<0)n.negate();const q=new THREE.Quaternion().setFromAxisAngle(Y,Math.atan2(n.x,n.y));
      const qEdge=new THREE.Quaternion().setFromAxisAngle(Y,Math.atan2(-v.y,v.x));
      beam([a.x,base+h+.6,a.y],[a.x+v.x*len,base+h+.6,a.y+v.y*len],.65,.8,'roof');
      const facadeBase=b.minGround+.8,floors=Math.floor((base+h-facadeBase-3.5)/floorH),columns=Math.floor((len-1.8)/bay);
      if(columns<1)continue;
      if(modern&&len>9){
        // Grouped vertical bays distinguish towers without changing their sourced footprint.
        for(let c=0;c<=columns;c+=3){
          const p=a.clone().addScaledVector(v,(c+.15)/columns*len).addScaledVector(n,.2);
          instance('balcony',unitBox,[p.x,facadeBase+floors*floorH/2,p.y],[.42,floors*floorH,.5],q);
        }
      }
      for(let f=1;f<=floors;f++){
        const y=facadeBase+f*floorH;
        if(f%(modern?8:4)===0)instance('balcony',unitBox,[mid.x+n.x*.24,y-floorH*.46,mid.y+n.y*.24],[len,.22,.58],qEdge);
        for(let c=0;c<columns;c++){
          const p=a.clone().addScaledVector(v,(c+.5)/columns*len).addScaledVector(n,.16);
          const w=Math.min(modern?3.1:2.35,len/columns*(modern?.78:.59)),hh=modern?3.05:2.05;
          const tint=.82+rand(b.id+c*7+f*31)*.35;
          instance('window',unitPlane,[p.x,y,p.y],[w,hh,1],q,new THREE.Color().setScalar(tint));stats.windows++;
          if(near){
            instance('frame',unitPlane,[p.x+n.x*.045,y,p.y+n.y*.045],[.12,hh,1],q);
            instance('frame',unitPlane,[p.x+n.x*.06,y-hh/2-.12,p.y+n.y*.06],[w+.24,.2,1],q);
            if(apartment&&len>12&&c%3===1&&f>1&&f%2===0){
              instance('balcony',unitBox,[p.x+n.x*.65,y-hh/2-.3,p.y+n.y*.65],[w+.65,.22,1.25],q);
              instance('balcony',unitBox,[p.x+n.x*1.15,y-hh/2+.25,p.y+n.y*1.15],[w+.65,.8,.14],q);
            } else if(!modern&&c%5===2&&f%3===0){
              const pSide=p.clone().addScaledVector(v,w*.64);
              instance('shutter',unitBox,[pSide.x,y-.45,pSide.y],[.6,.65,.4],q);
            }
          }
        }
      }
      if(!tower&&len>16&&near)instance('balcony',unitBox,[mid.x+n.x*.25,base+3.2,mid.y+n.y*.25],[len,.5,.95],qEdge);
    }
    const [cx,cz]=b.center;
    if(inside(cx+4,cz+4,ring)&&inside(cx-4,cz-4,ring)){
      box(8,2.1,7,cx,base+h+1.05,cz,'roof');
      box(4,1,3,cx+1,base+h+2.5,cz,'cream1');
      if(near&&h<100&&b.id%2===0)box(5,.45,4,cx-2,base+h+.3,cz+1,'shutter');
    }
  }
}

function ribbon(points,width,name,raise=0){
  const verts=[];for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],p0=points[Math.max(0,i-1)],p2=points[Math.min(points.length-1,i+2)];const na=new THREE.Vector2(-(b[2]-p0[2]),b[0]-p0[0]).normalize().multiplyScalar(width/2),nb=new THREE.Vector2(-(p2[2]-a[2]),p2[0]-a[0]).normalize().multiplyScalar(width/2);
    const p=[a[0]+na.x,a[1]+raise,a[2]+na.y],q=[a[0]-na.x,a[1]+raise,a[2]-na.y],r=[b[0]+nb.x,b[1]+raise,b[2]+nb.y],s=[b[0]-nb.x,b[1]+raise,b[2]-nb.y];verts.push(...p,...r,...q,...q,...r,...s);
  }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));batch(g,name);
}
let deckHeight=0;
function roads(){
  const br=data.bridge;deckHeight=Math.max(heightAt(...br.south),heightAt(...br.north))+5;
  for(const road of data.roads){
    if(road.access==='no')continue;
    let pts=road.points.map(p=>[...p]);
    const smallPath=['footway','steps','pedestrian','path'].includes(road.type);
    // The source has no reliable level for paths through this multilevel complex.
    // Omit the intersecting paths instead of drawing them as floating bridges.
    if(smallPath&&pts.some(p=>inside(p[0],p[2],data.landmark.rings[0])||
      (Math.abs(p[0]-data.landmark.center[0])<118&&Math.abs(p[2]-data.landmark.center[1])<64))){
      stats.omittedLandmarkPaths++;continue;
    }
    if(road.bridge){const deck=road.name.includes('千厮门')?deckHeight:Math.max(pts[0][1],pts.at(-1)[1])+2;pts=pts.map(p=>[p[0],deck+.4,p[2]]);}
    const foot=['footway','pedestrian','steps','path','cycleway'].includes(road.type),width=({primary:10,secondary:9,tertiary:7,residential:5.5,service:4.2,pedestrian:5,steps:2.4,footway:2.8})[road.type]||4;
    if(!foot)ribbon(pts,width+2.2,'sidewalk',-.05);
    ribbon(pts,width,foot?'path':'road',.1);
    if(['primary','secondary','tertiary'].includes(road.type))for(let i=1;i<pts.length-1;i+=3){const a=pts[i],b=pts[i+1];beam([a[0],a[1]+.14,a[2]],[a[0]+(b[0]-a[0])*.65,a[1]+(b[1]-a[1])*.65+.14,a[2]+(b[2]-a[2])*.65],.15,.2,'path');}
    // Decorative street furniture and vehicles communicate scale; they are not live traffic.
    if(['primary','secondary','tertiary'].includes(road.type)){
      for(let i=2;i<pts.length-1;i+=8){
        const a=pts[i],b=pts[i+1];if(Math.hypot(a[0],a[2])>650)continue;
        const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<.1)continue;
        const q=new THREE.Quaternion().setFromAxisAngle(Y,Math.atan2(-dz,dx)),nx=-dz/len,nz=dx/len;
        if(rand(road.id+i)>.35){
          const offset=width*.22,x=a[0]+nx*offset,z=a[2]+nz*offset,y=a[1]+.2;
          instance('carPaint',unitBox,[x,y+.5,z],[4.4,.85,1.8],q,new THREE.Color().setScalar(.82+.2*rand(road.id)));
          instance('carGlass',unitBox,[x,y+1.18,z],[2.5,.65,1.55],q);
          instance('carRoof',unitBox,[x,y+1.55,z],[1.7,.12,1.56],q);
        }
        if(road.bridge)continue;
        const offset=width/2+.6,x=a[0]+nx*offset,z=a[2]+nz*offset;
        if(pointInWater(x,z)||data.buildings.some(b=>inside(x,z,b.rings[0])))continue;
        const y=heightAt(x,z);
        instance('lamp',unitBox,[x,y+2.8,z],[.16,5.6,.16]);
        instance('lamp',unitBox,[x-nx*.7,y+5.6,z-nz*.7],[.2,.16,1.5],q);
        instance('bridgeEdge',unitBox,[x-nx*1.3,y+5.55,z-nz*1.3],[.5,.15,.7],q);
      }
    }
  }
}

function curvedRoof(w,d,h,x,y,z,angle){
  const positions=[],indices=[],nx=24,nz=16,halfW=w/2,halfD=d/2,ridge=Math.max(0,halfW-halfD*.75);
  const profile=(u,v)=>{
    const across=Math.abs(v)/halfD,hip=Math.max(0,(Math.abs(u)-ridge)/(halfW-ridge));
    const t=Math.min(1,Math.max(across,hip));
    const corner=Math.pow(Math.abs(u)/halfW,12)*Math.pow(across,6);
    return h*Math.pow(1-t,1.32)+.6*Math.pow(t,8)+1.35*corner;
  };
  const local=(u,v,yy)=>[x+Math.cos(angle)*u+Math.sin(angle)*v,y+yy,z-Math.sin(angle)*u+Math.cos(angle)*v];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const xx=(i/nx-.5)*w,zz=(j/nz-.5)*d;
    positions.push(xx,profile(xx,zz),zz);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.rotateY(angle);g.translate(x,y,z);batch(g,'tile');
  // Eave thickness and curved trim follow the roof, including all four raised corners.
  for(const sign of [-1,1])for(let k=0;k<24;k++){
    const u0=-halfW+w*k/24,u1=-halfW+w*(k+1)/24,v=sign*halfD;
    beam(local(u0,v,profile(u0,v)-.18),local(u1,v,profile(u1,v)-.18),.38,.45,'wood');
    const v0=-halfD+d*k/24,v1=-halfD+d*(k+1)/24,u=sign*halfW;
    beam(local(u,v0,profile(u,v0)-.18),local(u,v1,profile(u,v1)-.18),.38,.45,'wood');
  }
  // Fine raised tile seams provide relief at close range; no image is baked into the model.
  for(let u=-halfW+.6;u<halfW;u+=.95)for(const sign of [-1,1]){
    for(let k=0;k<8;k++){
      const v0=sign*halfD*k/8,v1=sign*halfD*(k+1)/8;
      const a=local(u-.075,v0,profile(u-.075,v0)+.08),b=local(u+.075,v0,profile(u+.075,v0)+.08);
      const c=local(u-.075,v1,profile(u-.075,v1)+.08),d=local(u+.075,v1,profile(u+.075,v1)+.08);
      const seam=new THREE.BufferGeometry();
      seam.setAttribute('position',new THREE.Float32BufferAttribute(sign>0?[...a,...c,...b,...b,...c,...d]:[...a,...b,...c,...b,...d,...c],3));
      batch(seam,'tileRidge');
    }
  }
  beam(local(-ridge,0,h+.14),local(ridge,0,h+.14),.35,.45,'tileRidge');
  for(const sign of [-1,1]){
    beam(local(sign*ridge,0,h+.14),local(sign*(ridge+1.3),0,h+1.15),.27,.3,'tileRidge');
    for(const side of [-1,1])for(let k=0;k<10;k++){
      const t0=k/10,t1=(k+1)/10,u0=sign*(ridge+(halfW-ridge)*t0),u1=sign*(ridge+(halfW-ridge)*t1),v0=side*halfD*t0,v1=side*halfD*t1;
      cylinderBetween(local(u0,v0,profile(u0,v0)+.14),local(u1,v1,profile(u1,v1)+.14),.16,'tileRidge',5);
    }
  }
}

function hongyadong(){
  const l=data.landmark,rect=l.orientedBounds,cx=l.center[0],cz=l.center[1];let longest=[1,0,0];
  for(let i=1;i<rect.length;i++){const dx=rect[i][0]-rect[i-1][0],dz=rect[i][1]-rect[i-1][1],len=Math.hypot(dx,dz);if(len>longest[2])longest=[dx,dz,len];}
  if(longest[0]<0){longest[0]*=-1;longest[1]*=-1;}
  const angle=Math.atan2(-longest[1],longest[0]);
  const world=(u,v,y)=>[cx+Math.cos(angle)*u+Math.sin(angle)*v,y,cz-Math.sin(angle)*u+Math.cos(angle)*v];
  const localBox=(w,h,d,u,v,y,name)=>box(w,h,d,...world(u,v,y),name,angle);
  const localBeam=(a,b,w,d,name)=>beam(world(a[0],a[2],a[1]),world(b[0],b[2],b[1]),w,d,name);
  const front=l.minGround+1,floorH=4.3;
  const lanternGeo=new THREE.SphereGeometry(1,7,5);
  const balcony=(u,v,y,w)=>{
    localBox(w+1,.32,2.5,u,v+1.05,y,'wood');
    localBeam([u-w/2,y+1.05,v-.12],[u+w/2,y+1.05,v-.12],.17,.18,'woodLight');
    localBeam([u-w/2,y+.35,v-.12],[u+w/2,y+.35,v-.12],.14,.14,'wood');
    for(let k=0;k<=Math.floor(w/1.1);k++)localBox(.13,1.05,.14,u-w/2+k*w/Math.floor(w/1.1),v-.12,y+.53,'wood');
  };
  const pavilion=(u,v,w,d,base,levels,roofH=5.4)=>{
    // Recessed fronts create an actual open gallery with columns and diagonal brackets.
    localBox(w,levels*floorH,d-3,u,v+1.5,base+levels*floorH/2,'wall');
    const bays=Math.max(2,Math.round(w/4.2)),bay=w/bays,frontV=v-d/2;
    for(let f=0;f<levels;f++){
      const fy=base+f*floorH;
      localBox(w+.8,.45,d+.9,u,v,fy,'wood');
      balcony(u,frontV-.5,fy,w);
      for(let j=0;j<=bays;j++){
        const pu=u-w/2+j*bay;
        localBox(.42,floorH,.42,pu,frontV+.25,fy+floorH/2,'wood');
        localBeam([pu,fy+floorH-1.2,frontV+.3],[pu,fy+floorH-.3,frontV-1.1],.2,.25,'wood');
        if(j<bays){
          const wu=pu+bay/2;
          localBox(bay-1.0,2.65,.2,wu,frontV+3.05,fy+2.25,'warmWindow');
          for(const offset of [-.65,0,.65])localBox(.1,2.65,.26,wu+offset,frontV+2.91,fy+2.25,'wood');
          localBox(bay-.9,.15,.28,wu,frontV+2.91,fy+2.25,'wood');
          if(f%2===1&&j%2===0){
            const p=world(wu,frontV-.35,fy+3.2);
            instance('lantern',lanternGeo,p,[.38,.52,.38]);
          }
        }
      }
      // Continuous narrow awnings join adjacent bays while the main roofs vary in height.
      if(f>0)curvedRoof(w+2,4.5,1.0,...world(u,frontV+.3,fy+2.95),angle);
      for(const side of [-1,1]){
        localBox(.35,floorH,d, u+side*w/2,v,fy+floorH/2,'wood');
        for(let j=0;j<Math.floor(d/4);j++){
          const sv=v-d/2+2+j*4;
          localBox(.25,2.1,2.2,u+side*(w/2+.05),sv,fy+2.3,'warmWindow');
        }
      }
    }
    const roofY=base+levels*floorH;
    localBox(w+.9,.65,d+1,u,v,roofY,'wood');
    curvedRoof(w+4,d+4,roofH,...world(u,v,roofY+.1),angle);
  };
  // Connected podiums step into the cliff; the superstructure is an artistic approximation.
  for(const [v,top,depth,width] of [[-21,front+8.6,22,189],[0,front+21.5,25,184],[22,front+38.7,24,171]]){
    localBox(width,top-l.minGround,depth,0,v,(top+l.minGround)/2,'stone');
  }
  // A lower open colonnade breaks up the river-facing retaining wall.
  for(let u=-90;u<=90;u+=6){
    localBox(.9,8.2,1.2,u,-32.2,front+4.1,'wood');
    localBeam([u,front+7.8,-32.2],[u+2,front+6,-32.2],.4,.4,'wood');
    if(u<90)localBox(4.7,5.8,.3,u+3,-32,front+3.5,'wood');
  }
  // Overlapping wings, offset rooflines and a central upper pavilion replace the former grid.
  const wings=[
    [-72,-21,39,18,front+8.6,3,5.4],[-29,-24,44,20,front+8.6,4,6.4],
    [17,-19,45,18,front+8.6,3,5.8],[63,-17,43,20,front+12.9,3,5.4],
    [-69,0,40,20,front+21.5,4,6.0],[-24,1,45,21,front+25.8,3,6.4],
    [23,2,45,20,front+21.5,5,6.3],[65,6,35,20,front+25.8,3,5.8],
    [-58,23,46,19,front+38.7,3,6.0],[-9,24,47,19,front+38.7,4,7.1],
    [41,25,44,19,front+38.7,3,6.2]
  ];
  for(const args of wings)pavilion(...args);
  pavilion(-9,24,22,13,front+38.7+floorH*4+6.5,1,4.8);
  // Side stairs and connecting gallery decks are model details, not published walking paths.
  for(const side of [-1,1])for(let s=0;s<38;s++){
    localBox(4.2,.65,1.25,side*91,-29+s*1.46,front+8+s*.8,'stone');
  }
  for(const [u,v,y,w] of [[-48,-8,front+21.5,18],[0,13,front+38.7,144],[43,-7,front+25.8,16]])balcony(u,v,y,w);
}

function bridge(){
  const b=data.bridge,s=new THREE.Vector2(...b.south),n=new THREE.Vector2(...b.north),axis=n.clone().sub(s),length=axis.length();axis.normalize();const cross=new THREE.Vector2(-axis.y,axis.x);
  const point=(u,v,y)=>[s.x+axis.x*u+cross.x*v,y,s.y+axis.y*u+cross.y*v];
  extrude([b.footprint],2,deckHeight-2,'bridgeEdge');
  for(const v of [-12,12]){
    beam(point(0,v,deckHeight-6),point(length,v,deckHeight-6),1,1,'bridge');
    beam(point(0,v,deckHeight+1.6),point(length,v,deckHeight+1.6),.4,.4,'rail');
    for(let u=0;u<length-14;u+=14){beam(point(u,v,deckHeight-6),point(u+14,v,deckHeight-1),.5,.5,'bridge');beam(point(u,v,deckHeight-1),point(u+14,v,deckHeight-6),.5,.5,'bridge');beam(point(u,v,deckHeight),point(u,v,deckHeight+1.5),.25,.25,'rail');}
  }
  const towerStations=[length*.235,length*.235+312];
  for(const u of towerStations){
    for(const sign of [-1,1]){
      const shape=new THREE.Shape(),px=offset=>u+sign*offset;
      shape.moveTo(px(6),1);shape.lineTo(px(10),1);
      shape.quadraticCurveTo(px(19),deckHeight+16,px(15),deckHeight+34);
      shape.quadraticCurveTo(px(9),deckHeight+64,px(3),deckHeight+78);
      shape.lineTo(px(.8),deckHeight+78);
      shape.quadraticCurveTo(px(5),deckHeight+60,px(10),deckHeight+32);
      shape.quadraticCurveTo(px(12),deckHeight+18,px(6),1);
      const tower=new THREE.ExtrudeGeometry(shape,{depth:6,bevelEnabled:true,bevelSize:.35,bevelThickness:.35,bevelSegments:2,steps:1,curveSegments:10});
      tower.translate(0,0,-3);tower.rotateY(Math.atan2(-axis.y,axis.x));tower.translate(s.x,0,s.y);batch(tower,'bridge');
    }
    beam(point(u-2,0,deckHeight+77),point(u+2,0,deckHeight+77),2,5.8,'bridge');
    for(let span=22;span<=145;span+=14)for(const sign of [-1,1])cylinderBetween(point(u,0,deckHeight+69-span*.04),point(u+sign*span,0,deckHeight+1.2),.25,'bridgeEdge',5);
  }
  for(const u of [40,length-35])for(const v of [-8,8])beam(point(u,v,0),point(u,v,deckHeight-3),3,3,'stone');
}

function trees(){
  const makeCrown=seed=>{
    const raw=new THREE.IcosahedronGeometry(1,1);raw.deleteAttribute('normal');raw.deleteAttribute('uv');
    const g=mergeVertices(raw),p=g.attributes.position;raw.dispose();
    for(let j=0;j<p.count;j++){
      const x=p.getX(j),y=p.getY(j),z=p.getZ(j);
      const r=1+.17*Math.sin(x*9+seed)*Math.cos(z*8-seed)+.12*Math.sin(y*11+z*5+seed);
      p.setXYZ(j,x*r,y*r,z*r);
    }
    g.computeVertexNormals();return g;
  };
  const crowns=[makeCrown(1.4),makeCrown(4.8),makeCrown(8.1)],names=['leaf','leafLight','leafDeep'];
  const trunk=new THREE.CylinderGeometry(.18,.3,1,5);
  for(let i=0;i<data.trees.length;i++){
    const [x,y,z,sourceHeight]=data.trees[i],h=sourceHeight*(1.35+.35*rand(i*63)),r=h*.33,angle=rand(i*77)*Math.PI*2;
    instance('trunk',trunk,[x,y+h*.34,z],[h*.18,h*.68,h*.18]);
    const distance=Math.hypot(x,z),near=distance<650,clumps=distance<430?6:near?4:2;
    for(let k=0;k<clumps;k++){
      const a=angle+k*Math.PI*.763,spread=k===5?.13:.62,scale=.66+rand(i*17+k)*.27,kind=(i+k)%3;
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.2*Math.sin(i+k),a,.22*Math.cos(i)));
      instance(names[kind],crowns[kind],[x+Math.cos(a)*r*spread,y+h*(k===5?.86:.64)+Math.sin(a)*h*.07,z+Math.sin(a)*r*spread],[r*scale,r*(.68+rand(i+k)*.32),r*scale],q,new THREE.Color().setScalar(.84+rand(i*13+k)*.3));
    }
    if(near&&i%3!==0){
      const kind=i%3;
      for(let k=0;k<3;k++){
        const a=angle+k*2.4,xx=x+Math.cos(a)*r*.8,zz=z+Math.sin(a)*r*.8;
        instance(names[kind],crowns[kind],[xx,heightAt(xx,zz)+.8,zz],[1.7+rand(i+k),1.0,1.6+rand(i*2+k)],null,new THREE.Color().setScalar(.85));
      }
    }
  }
}
function boats(){
  const candidates=[[-275,-250],[380,-480],[-600,-150],[-60,-240]];
  for(let i=0;i<candidates.length;i++){
    const [x,z]=candidates[i];if(!pointInWater(x,z))continue;const angle=.7+i*.35;
    const outline=[[-2.7,-7],[-2.7,5],[-1.8,8],[0,10],[1.8,8],[2.7,5],[2.7,-7],[-2.7,-7]].map(([u,v])=>[x+Math.cos(angle)*u+Math.sin(angle)*v,z-Math.sin(angle)*u+Math.cos(angle)*v]);
    extrude([outline],1.8,.6,'cream2');
    box(4,2.6,10,x,3.2,z,'cream2',angle);box(4.1,1.2,7,x,3.8,z,'window',angle);box(4.8,.6,11,x,5,z,'cream2',angle);
  }
}

const pins=[];
function makePins(){
  const choices=[{id:'hotpot',name:'山城火锅',x:16,z:-13,photo:50,raised:91},{id:'noodle',name:'巷口小面',x:-240,z:140,photo:0,raised:null}];
  for(const item of choices){
    const element=document.createElement('div');element.className='food-pin';element.dataset.id=item.id;
    const button=document.createElement('button');button.className='food-bubble';button.setAttribute('aria-label','查看'+item.name+'概念卡片');
    const photo=document.createElement('div');photo.className='food-photo';photo.style.setProperty('--photo-x',item.photo+'%');const title=document.createElement('strong');title.textContent=item.name;const glyph=document.createElement('span');glyph.className='small-play';glyph.textContent='▷';glyph.setAttribute('aria-hidden','true');button.append(photo,title,glyph);element.append(button);document.querySelector('#pins').append(element);
    const anchor=new THREE.Vector3(item.x,item.raised??heightAt(item.x,item.z)+22,item.z);
    pins.push({element,anchor,item});
    button.addEventListener('click',()=>{document.querySelector('#food-detail-title').textContent=item.name;document.querySelector('#food-detail-photo').style.setProperty('--photo-x',item.photo+'%');openPanel('food-detail');});
  }
}
let lastOcclusionCheck=0;
function updatePins(force=false){
  const w=host.clientWidth,h=host.clientHeight,canRay=force||performance.now()-lastOcclusionCheck>150;
  for(const pin of pins){
    const p=pin.anchor.clone().project(camera),x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;const cardW=coarse.matches||w<700?127:166,cardH=w<700?127:157;
    let hidden=!foodVisible||p.z>1||p.z<0||x<cardW/2+8||x>w-cardW/2-8||y<cardH+40||y>h-130;
    if(canRay&&!hidden){const direction=pin.anchor.clone().sub(camera.position);const distance=direction.length();raycaster.set(camera.position,direction.normalize());raycaster.far=distance-8;const hits=raycaster.intersectObjects(model.children.filter(o=>!o.isInstancedMesh&&o.name!=='water'),false);pin.blocked=hits.length>0;}
    hidden ||= !!pin.blocked;
    pin.element.dataset.occluded=String(hidden);pin.element.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
  }
  const visible=pins.filter(p=>p.element.dataset.occluded==='false');if(visible.length>1){const a=visible[0].element.firstChild.getBoundingClientRect(),b=visible[1].element.firstChild.getBoundingClientRect();if(a.left<b.right+10&&a.right>b.left-10&&a.top<b.bottom+10&&a.bottom>b.top-10)visible[1].element.dataset.occluded='true';}
  if(canRay)lastOcclusionCheck=performance.now();
}
function requestRender(){
  if(!requestId)requestId=requestAnimationFrame(frame);
  clearTimeout(pinSettleTimer);pinSettleTimer=setTimeout(()=>updatePins(true),180);
}
function keepCameraAboveCity(){
  const x=camera.position.x,z=camera.position.z;
  let minimum=heightAt(x,z)+24;
  for(const b of data.buildings)if(inside(x,z,b.rings[0]))minimum=Math.max(minimum,b.base+b.height+80);
  if(camera.position.y<minimum)camera.position.y=minimum;
}
function frame(now){
  requestId=0;
  if(transition){const t=Math.min(1,(now-transition.start)/transition.duration),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);if(t===1)transition=null;else requestRender();}
  controls.update();keepCameraAboveCity();camera.lookAt(controls.target);camera.updateMatrixWorld();
  bokeh.uniforms.focus.value=camera.position.distanceTo(controls.target);
  bokeh.enabled=!coarse.matches&&host.clientWidth>=900&&camera.position.y<1000;
  renderer.info.reset();composer.render();updatePins();if(!firstFrame){firstFrame=performance.now()-started;loading.remove();}
}
function moveCamera(to,target,duration=850){transition={start:performance.now(),duration:reduced.matches?1:duration,from:camera.position.clone(),to:new THREE.Vector3(...to),fromTarget:controls.target.clone(),toTarget:new THREE.Vector3(...target)};requestRender();}
function setView(kind){document.querySelector('#view-river').classList.toggle('is-active',kind==='river');document.querySelector('#view-top').classList.toggle('is-active',kind==='top');document.querySelector('#view-river').setAttribute('aria-pressed',String(kind==='river'));document.querySelector('#view-top').setAttribute('aria-pressed',String(kind==='top'));if(kind==='top')moveCamera([100,1600,90],[0,45,-40]);else moveCamera([-280,330,-430],[20,65,35]);}
function orbit(angle){const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(Y,angle);moveCamera(delta.add(controls.target).toArray(),controls.target.toArray(),600);}
function zoom(factor){const delta=camera.position.clone().sub(controls.target);const next=THREE.MathUtils.clamp(delta.length()*factor,controls.minDistance,controls.maxDistance);moveCamera(delta.setLength(next).add(controls.target).toArray(),controls.target.toArray(),400);}
let returnFocus=null;
function openPanel(id){returnFocus=document.activeElement;for(const p of document.querySelectorAll('.floating-panel'))p.hidden=p.id!==id;host.dataset.modal='true';document.querySelector('#'+id+' .close').focus({preventScroll:true});}
function closePanels(){for(const p of document.querySelectorAll('.floating-panel'))p.hidden=true;host.dataset.modal='false';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
function wireUI(){
  document.querySelector('#food-toggle').addEventListener('click',event=>{foodVisible=!foodVisible;event.currentTarget.setAttribute('aria-pressed',String(foodVisible));requestRender();});
  document.querySelector('#view-river').addEventListener('click',()=>setView('river'));document.querySelector('#view-top').addEventListener('click',()=>setView('top'));
  document.querySelector('#rotate-left').addEventListener('click',()=>orbit(-Math.PI/6));document.querySelector('#rotate-right').addEventListener('click',()=>orbit(Math.PI/6));document.querySelector('#zoom-in').addEventListener('click',()=>zoom(.8));document.querySelector('#zoom-out').addEventListener('click',()=>zoom(1.25));
  document.querySelector('#source-open').addEventListener('click',()=>openPanel('source-panel'));document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closePanels));document.querySelector('#detail-close').addEventListener('click',closePanels);document.addEventListener('keydown',event=>{if(event.key==='Escape')closePanels();});
  const m=data.metadata;document.querySelector('#data-coverage').textContent=`这块场景包含 ${m.buildings} 栋建筑：${m.heightBasis.height} 栋有高度记录，${m.heightBasis.levels} 栋按层数推算，其余 ${m.heightBasis.estimated} 栋使用估算高度。`;
  const ro=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);composer.setSize(w,h);ao.setSize(Math.round(w*.7),Math.round(h*.7));camera.aspect=w/h;camera.updateProjectionMatrix();updatePins(true);requestRender();});ro.observe(host);
}

async function init(){
  if(window.__CITY_STUDY_DATA__)data=window.__CITY_STUDY_DATA__;
  else {const response=await fetch('./data/city.json');if(!response.ok)throw new Error('城市数据未能加载');data=await response.json();}
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,coarse.matches?1.5:1.8));renderer.setSize(host.clientWidth,host.clientHeight,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
  scene=new THREE.Scene();scene.background=new THREE.Color('#e9e9df');scene.fog=new THREE.Fog('#e9e9df',1200,2900);
  camera=new THREE.PerspectiveCamera(38,host.clientWidth/host.clientHeight,2,6500);camera.position.set(-280,330,-430);
  controls=new OrbitControls(camera,canvas);controls.target.set(20,65,35);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=260;controls.maxDistance=2450;controls.maxPolarAngle=Math.PI*.445;controls.minPolarAngle=.08;controls.rotateSpeed=.55;controls.zoomSpeed=.8;controls.panSpeed=.6;controls.addEventListener('change',requestRender);controls.addEventListener('start',()=>{transition=null;});
  scene.add(new THREE.HemisphereLight('#e8f0ee','#ac997f',1.35));const sun=new THREE.DirectionalLight('#ffedce',3.4);sun.position.set(-420,750,-520);sun.target.position.set(0,35,0);sun.castShadow=true;sun.shadow.mapSize.set(coarse.matches?2048:4096,coarse.matches?2048:4096);Object.assign(sun.shadow.camera,{left:-850,right:850,top:850,bottom:-850,near:1,far:2500});sun.shadow.normalBias=.35;sun.shadow.bias=-.00004;sun.shadow.radius=4;scene.add(sun,sun.target);
  const target=new THREE.WebGLRenderTarget(host.clientWidth,host.clientHeight,{type:THREE.HalfFloatType,samples:coarse.matches?0:2});
  composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
  ao=new GTAOPass(scene,camera,host.clientWidth*.7,host.clientHeight*.7);
  ao.updateGtaoMaterial({radius:10,distanceExponent:2,thickness:2,scale:.8,samples:12});
  ao.updatePdMaterial({radius:5,samples:12});ao.blendIntensity=.75;
  composer.addPass(ao);
  bokeh=new BokehPass(scene,camera,{focus:600,aperture:.000023,maxblur:.0045});
  composer.addPass(bokeh);composer.addPass(new OutputPass());renderer.info.autoReset=false;
  model=new THREE.Group();model.name='FoodCity_Chongqing_Hongyadong_Study';model.userData={...data.metadata,artRevision:'0.2',dataLicense:'ODbL 1.0',sources:['https://www.openstreetmap.org/copyright','https://registry.opendata.aws/terrain-tiles/'],style:'Custom approximate architecture and decorative planting; not navigation or survey grade.'};scene.add(model);
  terrain();roads();buildings();hongyadong();bridge();trees();boats();flush();model.updateMatrixWorld(true);makePins();wireUI();controls.update();requestRender();
  window.cityStudy={ready:true,metadata:data.metadata,getStats:()=>({three:THREE.REVISION,firstFrameMs:Math.round(firstFrame),...stats,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,position:camera.position.toArray(),target:controls.target.toArray(),pins:pins.map(p=>({id:p.item.id,anchor:p.anchor.toArray(),hidden:p.element.dataset.occluded==='true'}))}),setView,orbit,render:requestRender,
    exportScene:async()=>{
      const copy=model.clone(true);copy.getObjectByName('water').material=material('water');
      const binary=await new GLTFExporter().parseAsync(copy,{binary:true,onlyVisible:true});
      const parsed=await new GLTFLoader().parseAsync(binary,'');let meshes=0,instanced=0;
      parsed.scene.traverse(o=>{if(o.isMesh)meshes++;if(o.isInstancedMesh)instanced+=o.count;});
      const bounds=new THREE.Box3().setFromObject(parsed.scene);
      const blob=new Blob([binary],{type:'model/gltf-binary'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='chongqing-hongyadong-study.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
      return {bytes:binary.byteLength,roundTrip:{meshes,instances:instanced,min:bounds.min.toArray(),max:bounds.max.toArray()}};
    },
    scene,camera,controls,model
  };
}
init().catch(error=>{console.error(error);loading.textContent='三维场景未能加载，请刷新重试。';loading.setAttribute('role','alert');});
