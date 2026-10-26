import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Water } from 'three/addons/objects/Water.js';

const host=document.querySelector('#scene');
const canvas=document.querySelector('#city-canvas');
const loading=document.querySelector('#load-status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(pointer: coarse)');
const started=performance.now();
let renderer,scene,camera,controls,model,data,composer,ao,water;
let requestId=0,transition=null,foodVisible=true,firstFrame=0,pinSettleTimer=0;
const batches=new Map(),instances=new Map();
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
const Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
const dummy=new THREE.Object3D();
const mats={};
const stats={windows:0,buildings:0};

const palette={
  stone:'#c0b59e',ground:'#b3b79b',road:'#898c83',path:'#ccbea4',sidewalk:'#d8cbb5',
  cream0:'#e4ddce',cream1:'#d8d2c3',cream2:'#f0e8d9',cream3:'#ded8ce',cream4:'#cfcbbb',
  roof:'#b7b5aa',window:'#65716b',frame:'#bab8a9',wood:'#806044',woodLight:'#b18a55',
  tile:'#526363',gold:'#c8a86a',wall:'#e6d9bd',bridge:'#af795f',bridgeEdge:'#dbc5a7',
  rail:'#c5bda9',water:'#6b9a9a',trunk:'#867555',leaf:'#718765',leafLight:'#8c9a72'
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
  for(const [name,{geometry,items}] of instances){const mesh=new THREE.InstancedMesh(geometry,material(name),items.length);items.forEach((o,i)=>{mesh.setMatrixAt(i,o.matrix);if(o.color)mesh.setColorAt(i,new THREE.Color(o.color));});mesh.name=name;mesh.castShadow=!['window','frame'].includes(name);mesh.receiveShadow=true;mesh.computeBoundingSphere();model.add(mesh);}
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
  const colors=[];for(let i=0;i<g.attributes.position.count;i++){const x=g.attributes.position.getX(i),z=g.attributes.position.getZ(i);if(inside(x,z,data.landmark.rings[0]))g.attributes.position.setY(i,data.landmark.minGround-1);const c=new THREE.Color(palette.ground).multiplyScalar(.94+.12*rand(Math.round(x*17+z*29)));colors.push(c.r,c.g,c.b);}g.computeVertexNormals();
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1}));mesh.name='Sourced terrain';mesh.receiveShadow=true;model.add(mesh);
  material('water',{roughness:.3,metalness:.12});
  const riverGeometry=mergeGeometries(data.water.map(rings=>prepare(new THREE.ShapeGeometry(shapeFromRings(rings)))),false);
  water=new Water(riverGeometry,{textureWidth:512,textureHeight:512,waterNormals:waterNormals(),sunDirection:new THREE.Vector3(-500,1100,-500).normalize(),sunColor:'#fff2db',waterColor:palette.water,distortionScale:2.8,fog:true});
  water.name='water';water.rotation.x=-Math.PI/2;water.position.y=.45;
  const reflect=water.onBeforeRender;
  water.onBeforeRender=function(...args){if(!args[1].overrideMaterial)reflect.apply(this,args);};
  water.userData={note:'Fixed visual river level, procedural ripples, reflected scene. Not current hydrology.'};
  model.add(water);
  for(const rings of data.water){
    const ring=rings[0];for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];const bounds=data.metadata.bounds;if([a,b].some(p=>Math.abs(p[0]-bounds[0])<1||Math.abs(p[0]-bounds[2])<1||Math.abs(p[1]-bounds[1])<1||Math.abs(p[1]-bounds[3])<1))continue;const ya=heightAt(...a),yb=heightAt(...b);if(Math.hypot(a[0]-b[0],a[1]-b[1])>100)continue;const wall=new THREE.BufferGeometry();wall.setAttribute('position',new THREE.Float32BufferAttribute([a[0],.1,a[1],b[0],.1,b[1],b[0],yb,b[1],a[0],.1,a[1],b[0],yb,b[1],a[0],ya,a[1]],3));batch(wall,'stone');}}
}

function buildings(){
  material('window',{roughness:.38,metalness:.12});
  for(const b of data.buildings){
    const name='cream'+(b.id%5),base=b.base+.35,h=b.height;
    extrude(b.rings,h+base-b.minGround,b.minGround,name);stats.buildings++;
    const ring=b.rings[0],center=new THREE.Vector2(...b.center);
    for(let i=1;i<ring.length;i++){
      const a=new THREE.Vector2(...ring[i-1]),v=new THREE.Vector2(...ring[i]).sub(a),len=v.length();if(len<2)continue;v.normalize();let n=new THREE.Vector2(-v.y,v.x);const mid=a.clone().addScaledVector(v,len/2);if(n.dot(mid.clone().sub(center))<0)n.negate();const q=new THREE.Quaternion().setFromAxisAngle(Y,Math.atan2(n.x,n.y));
      beam([a.x,base+h+.6,a.y],[a.x+v.x*len,base+h+.6,a.y+v.y*len],.8,.8,'roof');
      const facadeBase=b.minGround+.4,floors=Math.floor((base+h-facadeBase-4)/3.55),columns=Math.floor((len-2)/3.5);
      if(columns<1)continue;
      for(let f=1;f<=floors;f++){
        const y=facadeBase+f*3.55;
        if(f%3===0){const qEdge=new THREE.Quaternion().setFromAxisAngle(Y,Math.atan2(-v.y,v.x));instance('roof',unitBox,[mid.x+n.x*.18,y-1.3,mid.y+n.y*.18],[len,.18,.38],qEdge);}
        for(let c=0;c<columns;c++){
          const t=(c+.5)/columns,lenT=t*len,p=a.clone().addScaledVector(v,lenT).addScaledVector(n,.14),w=Math.min(2.3,len/columns*.66),hh=1.95;
          instance('frame',unitPlane,[p.x,y,p.y],[w+.35,hh+.3,1],q);
          instance('window',unitPlane,[p.x+n.x*.045,y,p.y+n.y*.045],[w,hh,1],q,new THREE.Color().setScalar(.75+rand(b.id+c*7+f*31)*.6));stats.windows++;
        }
      }
    }
    const [cx,cz]=b.center;
    if(inside(cx+4,cz+4,ring)&&inside(cx-4,cz-4,ring)){
      box(8,2.1,7,cx,base+h+1.05,cz,'roof');
      box(4,1,3,cx+1,base+h+2.5,cz,'cream1');
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
    if(['footway','steps','pedestrian'].includes(road.type)&&pts.some(p=>inside(p[0],p[2],data.landmark.rings[0])))continue;
    if(road.bridge){const deck=road.name.includes('千厮门')?deckHeight:Math.max(pts[0][1],pts.at(-1)[1])+2;pts=pts.map(p=>[p[0],deck+.4,p[2]]);}
    const foot=['footway','pedestrian','steps','path','cycleway'].includes(road.type),width=({primary:10,secondary:9,tertiary:7,residential:5.5,service:4.2,pedestrian:5,steps:2.4,footway:2.8})[road.type]||4;
    if(!foot)ribbon(pts,width+2.2,'sidewalk',-.05);
    ribbon(pts,width,foot?'path':'road',.1);
    if(['primary','secondary','tertiary'].includes(road.type))for(let i=1;i<pts.length-1;i+=3){const a=pts[i],b=pts[i+1];beam([a[0],a[1]+.14,a[2]],[a[0]+(b[0]-a[0])*.65,a[1]+(b[1]-a[1])*.65+.14,a[2]+(b[2]-a[2])*.65],.15,.2,'path');}
  }
}

function curvedRoof(w,d,h,x,y,z,angle){
  const positions=[],indices=[],nx=16,nz=10;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const xx=(i/nx-.5)*w,zz=(j/nz-.5)*d,hip=Math.max(0,(Math.abs(xx)-(w-d)/2)/(d/2)),t=THREE.MathUtils.clamp(Math.max(Math.abs(zz)/(d/2),hip),0,1),yy=h*Math.pow(1-t,1.35)+1.2*Math.pow(t,7)+.75*Math.pow(Math.abs(xx)/(w/2),10);
    positions.push(xx,yy,zz);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.rotateY(angle);g.translate(x,y,z);batch(g,'tile');
  const local=(u,v,yy)=>[x+Math.cos(angle)*u+Math.sin(angle)*v,y+yy,z-Math.sin(angle)*u+Math.cos(angle)*v];
  for(const v of [-d/2,d/2])beam(local(-w/2,v,.63),local(w/2,v,.63),.55,.65,'gold');
  beam(local(-(w-d)/2,0,h+.08),local((w-d)/2,0,h+.08),.55,.7,'gold');
}

function hongyadong(){
  const l=data.landmark,rect=l.orientedBounds,cx=l.center[0],cz=l.center[1];let longest=[1,0,0];
  for(let i=1;i<rect.length;i++){const dx=rect[i][0]-rect[i-1][0],dz=rect[i][1]-rect[i-1][1],len=Math.hypot(dx,dz);if(len>longest[2])longest=[dx,dz,len];}
  if(longest[0]<0){longest[0]*=-1;longest[1]*=-1;}
  const angle=Math.atan2(-longest[1],longest[0]);
  const world=(u,v,y)=>[cx+Math.cos(angle)*u+Math.sin(angle)*v,y,cz-Math.sin(angle)*u+Math.cos(angle)*v];
  const localBox=(w,h,d,u,v,y,name)=>box(w,h,d,...world(u,v,y),name,angle);
  const localBeam=(a,b,w,d,name)=>beam(world(a[0],a[2],a[1]),world(b[0],b[2],b[1]),w,d,name);
  const front=l.minGround+1;
  for(const [row,count,step,depth,base,floors] of [[0,7,27,22,front,3],[1,6,30,23,front+20,3],[2,5,35,21,front+41,3]]){
    const v=-23+row*23;
    localBox(193,base-l.minGround+2,depth,0,v,(base+l.minGround)/2,'stone');
    for(let i=0;i<count;i++){
      const u=(i-(count-1)/2)*step,w=step-7,levels=floors+(i%3===1?1:0)-(i%3===2?1:0),floorH=4.1,h=levels*floorH;
      localBox(w,h,depth-3,u,v,base+h/2,'wall');
      for(let f=0;f<=levels;f++){
        const fy=base+f*floorH;
        localBox(w+1,.65,depth+1,u,v,fy,'wood');
        if(f>0){
          localBeam([u-w/2,fy+1.1,v-depth/2-.7],[u+w/2,fy+1.1,v-depth/2-.7],.22,.22,'gold');
          for(let post=0;post<=Math.floor(w/2);post++){
            const pu=u-w/2+post*w/Math.floor(w/2);
            localBox(.22,1.1,.24,pu,v-depth/2-.7,fy+.55,'wood');
          }
          if(f<levels){const eave=world(u,v-depth/2+.6,fy+.12);curvedRoof(w+2,5,1.15,...eave,angle);}
        }
        if(f<levels){
          for(let column=0;column<=Math.floor(w/4);column++){
            const pu=u-w/2+column*w/Math.floor(w/4);
            localBox(.45,floorH,.45,pu,v-depth/2,fy+floorH/2,'wood');
            if(column<Math.floor(w/4)){
              localBox(2.5,2.55,.2,pu+1.85,v-depth/2+.5,fy+2.2,'woodLight');
              localBox(.14,2.5,.25,pu+1.85,v-depth/2+.35,fy+2.2,'wood');
              localBox(2.55,.18,.25,pu+1.85,v-depth/2+.35,fy+2.2,'wood');
            }
          }
        }
      }
      const p=world(u,v,base+h+.5);curvedRoof(w+4,depth+5,7.2,...p,angle);
      if((i+row)%3===0){
        localBox(w*.42,3.2,depth*.4,u,v+2,base+h+7.4,'woodLight');
        const pp=world(u,v+2,base+h+9);curvedRoof(w*.58,depth*.7,4.3,...pp,angle);
      }
    }
  }
  // Small stepped connections, within the sourced landmark footprint.
  for(let s=0;s<22;s++)localBox(4.4,1.05,1.1,-82,-25+s*1.02,front+s*.9,'stone');
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
      beam(point(u+sign*8,0,1),point(u+sign*13,0,deckHeight+24),5,7,'bridge');
      beam(point(u+sign*13,0,deckHeight+24),point(u+sign*3.5,0,deckHeight+71),4,6,'bridge');
    }
    beam(point(u-3.5,0,deckHeight+71),point(u+3.5,0,deckHeight+71),3,6,'bridge');
    for(let span=22;span<=145;span+=14)for(const sign of [-1,1])cylinderBetween(point(u,0,deckHeight+63-span*.04),point(u+sign*span,0,deckHeight+1.2),.32,'bridgeEdge',5);
  }
  for(const u of [40,length-35])for(const v of [-8,8])beam(point(u,v,0),point(u,v,deckHeight-3),3,3,'stone');
}

function trees(){
  const canopy=new THREE.IcosahedronGeometry(1,1),trunk=new THREE.CylinderGeometry(.17,.26,1,5);
  for(let i=0;i<data.trees.length;i++){
    const [x,y,z,sourceHeight]=data.trees[i],h=sourceHeight*1.45,r=h*.34,angle=rand(i*77)*Math.PI*2;
    instance('trunk',trunk,[x,y+h*.32,z],[h*.16,h*.65,h*.16]);
    for(let k=0;k<3;k++){const a=angle+k*Math.PI*2/3;instance(k===1?'leafLight':'leaf',canopy,[x+Math.cos(a)*r*.43,y+h*.64+k*.36,z+Math.sin(a)*r*.43],[r*.8,r*(1+.12*k),r*.85],null,new THREE.Color().setScalar(.82+rand(i*13+k)*.32));}
  }
}
function boats(){
  const candidates=[[-275,-250],[380,-480],[-600,-150]];
  for(let i=0;i<candidates.length;i++){const [x,z]=candidates[i];if(!pointInWater(x,z))continue;const angle=.7+i*.35;box(5,1.6,18,x,1.4,z,'cream2',angle);box(4,2.6,10,x,3.2,z,'cream2',angle);box(4.1,1.2,7,x,3.8,z,'window',angle);box(4.8,.6,11,x,5,z,'cream2',angle);}
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
  controls.update();keepCameraAboveCity();camera.lookAt(controls.target);camera.updateMatrixWorld();renderer.info.reset();composer.render();updatePins();if(!firstFrame){firstFrame=performance.now()-started;loading.remove();}
}
function moveCamera(to,target,duration=850){transition={start:performance.now(),duration:reduced.matches?1:duration,from:camera.position.clone(),to:new THREE.Vector3(...to),fromTarget:controls.target.clone(),toTarget:new THREE.Vector3(...target)};requestRender();}
function setView(kind){document.querySelector('#view-river').classList.toggle('is-active',kind==='river');document.querySelector('#view-top').classList.toggle('is-active',kind==='top');document.querySelector('#view-river').setAttribute('aria-pressed',String(kind==='river'));document.querySelector('#view-top').setAttribute('aria-pressed',String(kind==='top'));if(kind==='top')moveCamera([100,1600,90],[0,45,-40]);else moveCamera([-280,330,-430],[20,65,35]);}
function orbit(angle){const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(Y,angle);moveCamera(delta.add(controls.target).toArray(),controls.target.toArray(),600);}
function zoom(factor){const delta=camera.position.clone().sub(controls.target);const next=THREE.MathUtils.clamp(delta.length()*factor,controls.minDistance,controls.maxDistance);moveCamera(delta.setLength(next).add(controls.target).toArray(),controls.target.toArray(),400);}
let returnFocus=null;
function openPanel(id){returnFocus=document.activeElement;for(const p of document.querySelectorAll('.floating-panel'))p.hidden=p.id!==id;host.dataset.modal='true';document.querySelector('#'+id+' .close').focus();}
function closePanels(){for(const p of document.querySelectorAll('.floating-panel'))p.hidden=true;host.dataset.modal='false';if(returnFocus?.isConnected)returnFocus.focus();}
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
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,coarse.matches?1.5:1.8));renderer.setSize(host.clientWidth,host.clientHeight,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
  scene=new THREE.Scene();scene.background=new THREE.Color('#e7e7dc');scene.fog=new THREE.Fog('#e7e7dc',1600,3100);
  camera=new THREE.PerspectiveCamera(38,host.clientWidth/host.clientHeight,2,6500);camera.position.set(-280,330,-430);
  controls=new OrbitControls(camera,canvas);controls.target.set(20,65,35);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=260;controls.maxDistance=2450;controls.maxPolarAngle=Math.PI*.445;controls.minPolarAngle=.08;controls.rotateSpeed=.55;controls.zoomSpeed=.8;controls.panSpeed=.6;controls.addEventListener('change',requestRender);controls.addEventListener('start',()=>{transition=null;});
  scene.add(new THREE.HemisphereLight('#edf4f3','#b3a588',2));const sun=new THREE.DirectionalLight('#ffe6c7',2.8);sun.position.set(-500,1100,-500);sun.target.position.set(0,30,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1000,right:1000,top:1000,bottom:-1000,near:1,far:2600});sun.shadow.normalBias=.7;sun.shadow.bias=-.00008;sun.shadow.radius=3;scene.add(sun,sun.target);
  const target=new THREE.WebGLRenderTarget(host.clientWidth,host.clientHeight,{type:THREE.HalfFloatType,samples:coarse.matches?0:2});
  composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
  ao=new GTAOPass(scene,camera,host.clientWidth*.7,host.clientHeight*.7);
  ao.updateGtaoMaterial({radius:10,distanceExponent:2,thickness:2,scale:.8,samples:12});
  ao.updatePdMaterial({radius:5,samples:12});ao.blendIntensity=.75;
  composer.addPass(ao);composer.addPass(new OutputPass());renderer.info.autoReset=false;
  model=new THREE.Group();model.name='FoodCity_Chongqing_Hongyadong_Study';model.userData={...data.metadata,dataLicense:'ODbL 1.0',sources:['https://www.openstreetmap.org/copyright','https://registry.opendata.aws/terrain-tiles/'],style:'Custom approximate architecture; not navigation or survey grade.'};scene.add(model);
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
