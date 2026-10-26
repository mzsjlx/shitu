import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import surroundings from '../data/hongyadong-surroundings.json';
import {HONGYADONG_ORIENTATION} from './hongyadong-model.js';

// Decorative crowns inside a sourced park, plus small authored terrace boxes.
// Neither the distribution, crown size nor planter locations are OSM tree data.
export class LandmarkPlanting {
  constructor(toLocal) {
    this.group=new THREE.Group();this.group.name='Decorative landmark planting';
    this.records=surroundings.decorativeTrees.map((p,i)=>({id:p.id,point:p.coordinates,mode:'terrain',...toLocal(p.coordinates),height:8.4+(i%4)*.65,radius:3.5+(i%3)*.25}));
    for(const [i,u]of [-76,-51,-26,0,26,51,76].entries()){
      const a=HONGYADONG_ORIENTATION,v=-31.1;
      this.records.push({id:'authored-terrace-box-'+i,mode:'platform',x:Math.cos(a)*u+Math.sin(a)*v,z:-Math.sin(a)*u+Math.cos(a)*v,platform:9.6,height:1.65,radius:.9});
    }
    const batches={foliage:[],timber:[]},ranges={foliage:[],timber:[]};
    const counts={foliage:0,timber:0};
    const crownTemplate=new THREE.SphereGeometry(1,10,7),stemTemplate=new THREE.CylinderGeometry(1,1,1,6),boxTemplate=new THREE.BoxGeometry(1,1,1);
    const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),scale=new THREE.Vector3();
    const greens=['#84986f','#97a87c','#6e8761','#a4ad83'];
    const append=(input,size,position,batch,index,color)=>{
      const g=input.index?input.toNonIndexed():input.clone();g.deleteAttribute('uv');
      matrix.compose(v.set(...position),q,scale.set(...size));g.applyMatrix4(matrix);
      const tint=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3);
      for(let n=0;n<colors.length;n+=3){colors[n]=tint.r;colors[n+1]=tint.g;colors[n+2]=tint.b;}
      g.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const start=counts[batch],count=g.attributes.position.count;
      ranges[batch].push({start,count,index});counts[batch]+=count;batches[batch].push(g);
    };
    this.records.forEach((p,i)=>{
      if(p.mode==='terrain'){
        append(stemTemplate,[.25,p.height*.63,.25],[p.x,p.height*.315,p.z],'timber',i,'#8a7657');
        for(const [j,dx,dz,level,r]of [[0,0,0,.69,1],[1,-.7,.2,.76,.78],[2,.7,-.25,.83,.68]]){
          append(crownTemplate,[p.radius*r,p.radius*r*.88,p.radius*r],[p.x+dx,p.height*level,p.z+dz],'foliage',i,greens[(i+j)%greens.length]);
        }
      }else{
        q.setFromAxisAngle(new THREE.Vector3(0,1,0),HONGYADONG_ORIENTATION);
        append(boxTemplate,[2.2,.65,1.05],[p.x,.325,p.z],'timber',i,'#a08d6b');
        for(const dx of [-.55,.55])append(crownTemplate,[.82,.7,.66],[p.x+dx*Math.cos(HONGYADONG_ORIENTATION),1.12,p.z-dx*Math.sin(HONGYADONG_ORIENTATION)],'foliage',i,greens[i%greens.length]);
      }
    });
    for(const g of [crownTemplate,stemTemplate,boxTemplate])g.dispose();
    this.parts=[];
    for(const name of ['timber','foliage']){
      if(!batches[name].length)continue;
      const geometry=mergeGeometries(batches[name],false);for(const g of batches[name])g.dispose();
      const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,side:THREE.DoubleSide});
      const mesh=new THREE.Mesh(geometry,material);mesh.name='Decorative '+name;this.group.add(mesh);
      this.parts.push({mesh,ranges:ranges[name],template:geometry.attributes.position.array.slice()});
    }
    this.bases=[];this.updates=0;
  }
  update(terrain,elevation,sample) {
    let pending=0;
    const bases=this.records.map(p=>{
      if(p.mode==='platform')return p.platform;
      if(!terrain)return 0;
      const h=sample(p.point);if(!Number.isFinite(h)){pending++;return -10000;}
      return h-elevation;
    });
    this.pending=pending;
    if(bases.length===this.bases.length&&bases.every((h,i)=>Math.abs(h-this.bases[i])<.02))return;
    for(const {mesh,ranges,template}of this.parts){
      const positions=mesh.geometry.attributes.position;
      for(const {start,count,index}of ranges)for(let i=start;i<start+count;i++)positions.array[i*3+1]=template[i*3+1]+bases[index];
      positions.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
    }
    this.bases=bases;this.updates++;
  }
  getStats(){return {decorativeParkTrees:this.records.filter(p=>p.mode==='terrain').length,authoredTerracePlanters:7,drawCalls:this.parts.length,pendingTerrain:this.pending||0,updates:this.updates,basis:'Decorative planting inside sourced park; authored terrace boxes. No surveyed tree positions/heights.'};}
  dispose(){for(const {mesh}of this.parts){mesh.geometry.dispose();mesh.material.dispose();}this.group.clear();}
}
