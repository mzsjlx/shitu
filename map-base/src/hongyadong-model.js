import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Extracted from curvedRoof()/hongyadong() in design/prototype-3d/src/main.js.
// This is the original hand-authored landmark only, not the old city/terrain GLB.
// Metres: +X east, +Y up, +Z south. Origin is the sourced footprint centroid.
export const HONGYADONG_ORIENTATION = 0.35267948549534883;

const palette = {
  stone:'#b5ac99', wood:'#654b38', woodLight:'#b78b54', wall:'#d5c3a2',
  warmWindow:'#a37a4e', tile:'#475958', tileRidge:'#697570', lantern:'#bd6749'
};
const floorH = 4.3;

/**
 * Construct the existing Hongyadong artwork in its own local metre frame.
 * Every generated geometry/material is owned by the returned group; dispose
 * both in the renderer's normal traversal when removing the custom layer.
 * No network requests, images, random heights, surrounding city or terrain.
 */
export function createHongyadongModel() {
  const started = performance.now();
  const group = new THREE.Group();
  group.name = 'Hongyadong · original procedural artwork';
  group.userData = {
    landmarkId:'hongyadong', source:'design/prototype-3d/src/main.js',
    coordinateSystem:'local metres: X east, Y up, Z south; minGround = 0',
    modelBasis:'Artistic approximation; footprint georeferenced from OSM way/939578294'
  };
  const arrays = new Map(), batches = new Map();
  const up = new THREE.Vector3(0,1,0), direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion(), normal = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const boxTemplate = template(new THREE.BoxGeometry(1,1,1));
  const lanternTemplate = template(new THREE.SphereGeometry(1,7,5));
  const cylinderTemplate = template(new THREE.CylinderGeometry(1,1,1,5));
  let windows = 0, roofs = 0, boxes = 0, lanterns = 0;

  function template(input) {
    const geometry = input.index ? input.toNonIndexed() : input;
    const result = {position:geometry.attributes.position.array,normal:geometry.attributes.normal.array};
    geometry.dispose();
    if (input !== geometry) input.dispose();
    return result;
  }
  function bucket(name) {
    if (!arrays.has(name)) arrays.set(name,{position:[],normal:[]});
    return arrays.get(name);
  }
  // Reuse three compact templates rather than constructing thousands of BoxGeometries.
  function stamp(shape,sx,sy,sz,x,y,z,name,rotation=null) {
    const target = bucket(name), p = shape.position, n = shape.normal;
    for (let i=0;i<p.length;i+=3) {
      vertex.set(p[i]*sx,p[i+1]*sy,p[i+2]*sz);
      normal.set(n[i]/sx,n[i+1]/sy,n[i+2]/sz).normalize();
      if (rotation) { vertex.applyQuaternion(rotation); normal.applyQuaternion(rotation); }
      target.position.push(vertex.x+x,vertex.y+y,vertex.z+z);
      target.normal.push(normal.x,normal.y,normal.z);
    }
  }
  function box(w,h,d,x,y,z,name) {
    stamp(boxTemplate,w,h,d,x,y,z,name); boxes++;
  }
  function beam(a,b,width,depth,name) {
    direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const length = direction.length();
    if (length < .01) return;
    quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/length));
    stamp(boxTemplate,width,length,depth,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,name,quaternion);
  }
  function cylinderBetween(a,b,radius,name) {
    direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const length = direction.length();
    if (length < .01) return;
    quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/length));
    stamp(cylinderTemplate,radius,length,radius,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,name,quaternion);
  }
  function batch(geometry,name) {
    // A common non-indexed position/normal layout lets the final material merge
    // preserve the smooth roof normals and the crisp timber edges together.
    const prepared = geometry.index ? geometry.toNonIndexed() : geometry;
    if (prepared !== geometry) geometry.dispose();
    prepared.deleteAttribute('uv');
    if (!batches.has(name)) batches.set(name,[]);
    batches.get(name).push(prepared);
  }

  // Same nonlinear hipped profile and corner lift as the original custom art.
  // Mesh/seam sampling is reduced for the map, while the silhouette is retained.
  function curvedRoof(w,d,h,x,y,z,awning=false) {
    const positions=[],indices=[],nx=awning?12:20,nz=awning?6:12;
    const halfW=w/2,halfD=d/2,ridge=Math.max(0,halfW-halfD*.75);
    const profile=(u,v)=>{
      const across=Math.abs(v)/halfD,hip=Math.max(0,(Math.abs(u)-ridge)/(halfW-ridge));
      const t=Math.min(1,Math.max(across,hip));
      const corner=Math.pow(Math.abs(u)/halfW,12)*Math.pow(across,6);
      return h*Math.pow(1-t,1.32)+.6*Math.pow(t,8)+1.35*corner;
    };
    const local=(u,v,yy)=>[x+u,y+yy,z+v];
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const u=(i/nx-.5)*w,v=(j/nz-.5)*d;
      positions.push(u+x,profile(u,v)+y,v+z);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const a=j*(nx+1)+i;
      indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();batch(geometry,'tile');roofs++;
    const trimSegments=awning?6:12;
    for(const sign of [-1,1])for(let k=0;k<trimSegments;k++){
      const u0=-halfW+w*k/trimSegments,u1=-halfW+w*(k+1)/trimSegments,v=sign*halfD;
      beam(local(u0,v,profile(u0,v)-.18),local(u1,v,profile(u1,v)-.18),.38,.45,'wood');
      const v0=-halfD+d*k/trimSegments,v1=-halfD+d*(k+1)/trimSegments,u=sign*halfW;
      beam(local(u,v0,profile(u,v0)-.18),local(u,v1,profile(u,v1)-.18),.38,.45,'wood');
    }
    // Raised tile seams are geometry, not a photo texture. Awnings use fewer seams.
    const seams=bucket('tileRidge');
    for(let u=-halfW+.8;u<halfW;u+=awning?3.8:1.9)for(const sign of [-1,1]){
      const subdivisions=awning?2:4;
      for(let k=0;k<subdivisions;k++){
        const v0=sign*halfD*k/subdivisions,v1=sign*halfD*(k+1)/subdivisions;
        const a=local(u-.075,v0,profile(u-.075,v0)+.08),b=local(u+.075,v0,profile(u+.075,v0)+.08);
        const c=local(u-.075,v1,profile(u-.075,v1)+.08),e=local(u+.075,v1,profile(u+.075,v1)+.08);
        const points=sign>0?[a,c,b,b,c,e]:[a,b,c,b,e,c];
        for(let i=0;i<points.length;i+=3){
          direction.set(points[i+1][0]-points[i][0],points[i+1][1]-points[i][1],points[i+1][2]-points[i][2]);
          normal.set(points[i+2][0]-points[i][0],points[i+2][1]-points[i][1],points[i+2][2]-points[i][2]);
          normal.crossVectors(direction,normal).normalize();
          for(const p of points.slice(i,i+3)){
            seams.position.push(...p);seams.normal.push(normal.x,normal.y,normal.z);
          }
        }
      }
    }
    beam(local(-ridge,0,h+.14),local(ridge,0,h+.14),.35,.45,'tileRidge');
    for(const sign of [-1,1]){
      beam(local(sign*ridge,0,h+.14),local(sign*(ridge+1.3),0,h+1.15),.27,.3,'tileRidge');
      if(awning)continue;
      for(const side of [-1,1])for(let k=0;k<6;k++){
        const t0=k/6,t1=(k+1)/6,u0=sign*(ridge+(halfW-ridge)*t0),u1=sign*(ridge+(halfW-ridge)*t1),v0=side*halfD*t0,v1=side*halfD*t1;
        cylinderBetween(local(u0,v0,profile(u0,v0)+.14),local(u1,v1,profile(u1,v1)+.14),.16,'tileRidge');
      }
    }
  }
  function balcony(u,v,y,w) {
    box(w+1,.32,2.5,u,y,v+1.05,'wood');
    beam([u-w/2,y+1.05,v-.12],[u+w/2,y+1.05,v-.12],.17,.18,'woodLight');
    beam([u-w/2,y+.35,v-.12],[u+w/2,y+.35,v-.12],.14,.14,'wood');
    const divisions=Math.floor(w/1.4);
    for(let k=0;k<=divisions;k++)box(.13,1.05,.14,u-w/2+k*w/divisions,y+.53,v-.12,'wood');
  }
  function pavilion(u,v,w,d,base,levels,roofH=5.4) {
    box(w,levels*floorH,d-3,u,base+levels*floorH/2,v+1.5,'wall');
    const bays=Math.max(2,Math.round(w/4.2)),bay=w/bays,frontV=v-d/2;
    for(let f=0;f<levels;f++){
      const fy=base+f*floorH;
      box(w+.8,.45,d+.9,u,fy,v,'wood');balcony(u,frontV-.5,fy,w);
      for(let j=0;j<=bays;j++){
        const pu=u-w/2+j*bay;
        box(.42,floorH,.42,pu,fy+floorH/2,frontV+.25,'wood');
        beam([pu,fy+floorH-1.2,frontV+.3],[pu,fy+floorH-.3,frontV-1.1],.2,.25,'wood');
        if(j<bays){
          const wu=pu+bay/2;
          box(bay-1,2.65,.2,wu,fy+2.25,frontV+3.05,'warmWindow');windows++;
          for(const offset of [-.65,0,.65])box(.1,2.65,.26,wu+offset,fy+2.25,frontV+2.91,'wood');
          box(bay-.9,.15,.28,wu,fy+2.25,frontV+2.91,'wood');
          if(f%2===1&&j%2===0){stamp(lanternTemplate,.38,.52,.38,wu,fy+3.2,frontV-.35,'lantern');lanterns++;}
        }
      }
      if(f>0)curvedRoof(w+2,4.5,1,u,fy+2.95,frontV+.3,true);
      for(const side of [-1,1]){
        box(.35,floorH,d,u+side*w/2,fy+floorH/2,v,'wood');
        for(let j=0;j<Math.floor(d/4);j++){
          const sv=v-d/2+2+j*4;
          box(.25,2.1,2.2,u+side*(w/2+.05),fy+2.3,sv,'warmWindow');windows++;
        }
      }
    }
    const roofY=base+levels*floorH;
    box(w+.9,.65,d+1,u,roofY,v,'wood');curvedRoof(w+4,d+4,roofH,u,roofY+.1,v);
  }

  // Original connected podiums and open colonnade; ground is rebased to zero.
  const front=1;
  for(const [v,top,depth,width] of [[-21,front+8.6,22,189],[0,front+21.5,25,184],[22,front+38.7,24,171]]){
    box(width,top,depth,0,top/2,v,'stone');
  }
  for(let u=-90;u<=90;u+=6){
    box(.9,8.2,1.2,u,front+4.1,-32.2,'wood');
    beam([u,front+7.8,-32.2],[u+2,front+6,-32.2],.4,.4,'wood');
    if(u<90)box(4.7,5.8,.3,u+3,front+3.5,-32,'wood');
  }
  const wings=[
    [-72,-21,39,18,front+8.6,3,5.4],[-29,-24,44,20,front+8.6,4,6.4],
    [17,-19,45,18,front+8.6,3,5.8],[63,-17,43,20,front+12.9,3,5.4],
    [-69,0,40,20,front+21.5,4,6],[-24,1,45,21,front+25.8,3,6.4],
    [23,2,45,20,front+21.5,5,6.3],[65,6,35,20,front+25.8,3,5.8],
    [-58,23,46,19,front+38.7,3,6],[-9,24,47,19,front+38.7,4,7.1],
    [41,25,44,19,front+38.7,3,6.2]
  ];
  for(const args of wings)pavilion(...args);
  pavilion(-9,24,22,13,front+38.7+floorH*4+6.5,1,4.8);
  for(const side of [-1,1])for(let s=0;s<38;s++)box(4.2,.65,1.25,side*91,front+8+s*.8,-29+s*1.46,'stone');
  for(const [u,v,y,w] of [[-48,-8,front+21.5,18],[0,13,front+38.7,144],[43,-7,front+25.8,16]])balcony(u,v,y,w);

  for(const [name,attributes] of arrays){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(attributes.position,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(attributes.normal,3));
    batch(geometry,name);
  }
  let triangles=0,vertices=0,geometryBytes=0,maxVertexDistance=0,finite=true;
  for(const [name,geometries] of batches){
    const geometry=mergeGeometries(geometries,false);
    for(const part of geometries)part.dispose();
    geometry.rotateY(HONGYADONG_ORIENTATION);
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const material=new THREE.MeshStandardMaterial({
      color:palette[name],roughness:.84,metalness:0,
      ...(name==='warmWindow'?{emissive:palette.warmWindow,emissiveIntensity:.16}:{}),
      ...(name==='lantern'?{emissive:palette.lantern,emissiveIntensity:.12}:{})
    });
    const mesh=new THREE.Mesh(geometry,material);mesh.name=`Hongyadong · ${name}`;
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    const positions=geometry.attributes.position;
    vertices+=positions.count;triangles+=positions.count/3;
    for(const attribute of Object.values(geometry.attributes))geometryBytes+=attribute.array.byteLength;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
      finite=finite&&Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z);
      maxVertexDistance=Math.max(maxVertexDistance,Math.hypot(x,y,z));
    }
  }
  const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
  const stats={
    triangles,vertices,drawCalls:group.children.length,materials:group.children.length,
    geometryBytes,pavilions:wings.length+1,mainWings:wings.length,roofs,windows,lanterns,boxes,
    finite,maxVertexDistance,minGround:bounds.min.y,
    bounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray()},
    coordinateSystem:'X east, Y up, Z south; metres',
    orientationRadians:HONGYADONG_ORIENTATION,generationMs:performance.now()-started
  };
  group.userData.stats=stats;
  return {group,stats};
}
