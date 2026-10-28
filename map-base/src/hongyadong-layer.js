import * as THREE from 'three';
import {createHongyadongModel} from './hongyadong-model.js';
import landmark from '../data/hongyadong-landmark.json';
import {LandmarkPlanting} from './landmark-planting.js';

// MapLibre 6 supplies a full-precision Mercator mainMatrix. Keep authored
// vertices in local metres, never in Float32 world coordinates. Share depth.
export class HongyadongLayer {
  constructor(MercatorCoordinate,{onError=()=>{}}={}) {
    this.id='hongyadong-model';this.type='custom';this.renderingMode='3d';
    this.MercatorCoordinate=MercatorCoordinate;this.onError=onError;
    this.allowed=true;this.error=null;this.draws=0;this.elevation=null;
    this.data=landmark;
    this.origin=[landmark.centroid.lon,landmark.centroid.lat];
    // Points inside the sourced footprint along the river-facing plinth.
    this.groundSamples=landmark.groundFit.sampleLonLat;
  }
  onAdd(map,gl) {
    this.map=map;this.gl=gl;
    this.camera=new THREE.Camera();this.scene=new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight('#fff8ea','#a3aa94',1.8));
    const sun=new THREE.DirectionalLight('#fff0d3',2.6);sun.position.set(-160,240,-180);this.scene.add(sun);
    this.rotation=new THREE.Matrix4().makeRotationX(Math.PI/2);
    this.localToMercator=new THREE.Matrix4();this.projection=new THREE.Matrix4();
    this.flatOrigin=this.MercatorCoordinate.fromLngLat(this.origin,0);
    this.metreScale=this.flatOrigin.meterInMercatorCoordinateUnits();
    this.buildingFilter??=map.getFilter('buildings-3d');this.replacing=false;
    // A context-restored style snapshot may retain the replacement filter.
    map.setFilter('buildings-3d',this.buildingFilter);
  }
  setAppearance(allowed) {
    if(this.allowed===allowed)return;
    this.allowed=allowed;this.map?.triggerRepaint();
  }
  prepare() {
    const {group,stats}=createHongyadongModel();
    this.group=group;this.modelStats=stats;this.scene.add(group);
    const stone=group.children.find(mesh=>mesh.name==='Hongyadong · stone');
    const positions=stone.geometry.attributes.position;
    this.foundation={mesh:stone,original:positions.array.slice(),vertices:[]};
    for(let i=0;i<positions.count;i++)if(Math.abs(positions.getY(i))<1e-6)this.foundation.vertices.push(i);
    this.planting=new LandmarkPlanting(point=>this.toLocal(point));this.scene.add(this.planting.group);
    // Mercator Y is reflected in projection, rather than in matrixWorld.
    group.traverse(mesh=>{if(mesh.isMesh)mesh.material.side=THREE.DoubleSide;});
    this.renderer=new THREE.WebGLRenderer({canvas:this.map.getCanvas(),context:this.gl,antialias:true});
    this.renderer.autoClear=false;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.04;
  }
  toLocal(point){const p=this.MercatorCoordinate.fromLngLat(point,0);return {x:(p.x-this.flatOrigin.x)/this.metreScale,z:(p.y-this.flatOrigin.y)/this.metreScale};}
  toLngLat(x,z){return new this.MercatorCoordinate(this.flatOrigin.x+x*this.metreScale,this.flatOrigin.y+z*this.metreScale,0).toLngLat().toArray();}
  fitFoundation(terrain,elevation) {
    const f=this.foundation,positions=f.mesh.geometry.attributes.position,values=[];
    for(const i of f.vertices){
      const h=terrain?this.map.queryTerrainElevation(this.toLngLat(f.original[i*3],f.original[i*3+2])):0;
      values.push(terrain&&Number.isFinite(h)?Math.min(0,h-elevation-landmark.groundFit.foundationEmbedMetres):0);
    }
    if(f.values&&values.every((h,i)=>Math.abs(h-f.values[i])<.02))return;
    f.vertices.forEach((i,j)=>positions.setY(i,values[j]));positions.needsUpdate=true;
    f.mesh.geometry.computeBoundingBox();f.mesh.geometry.computeBoundingSphere();f.values=values;
  }
  render(gl,args) {
    this.rendered=false;
    if(!this.allowed||this.error||this.map.getZoom()<landmark.renderReplacement.minimumMapZoom){this.replaceBuilding(false);return;}
    const terrain=!!this.map.getTerrain();
    const samples=terrain?this.groundSamples.map(p=>this.map.queryTerrainElevation(p)):[];
    if(terrain&&samples.some(h=>!Number.isFinite(h))){this.replaceBuilding(false);return;}
    const elevation=terrain?Math.max(...samples)-landmark.groundFit.authoredFrontPlatformHeightMetres+landmark.groundFit.platformClearanceMetres:0;
    this.elevation=elevation;this.sampleElevations=samples;
    try {
      if(!this.renderer)this.prepare();
      this.fitFoundation(terrain,elevation);
      this.planting.update(terrain,elevation,p=>this.map.queryTerrainElevation(p));
      const anchor=this.MercatorCoordinate.fromLngLat(this.origin,elevation);
      const scale=anchor.meterInMercatorCoordinateUnits();
      this.localToMercator.makeTranslation(anchor.x,anchor.y,anchor.z)
        .scale(new THREE.Vector3(scale,-scale,scale)).multiply(this.rotation);
      this.projection.fromArray(args.defaultProjectionData.mainMatrix);
      this.camera.projectionMatrix.copy(this.projection).multiply(this.localToMercator);
      this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
      this.renderer.resetState();
      this.renderer.render(this.scene,this.camera);
      this.draws++;this.rendered=true;
      this.replaceBuilding(true);
      this.lastRender={calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles};
      // Static artwork: the map owns the render loop. No perpetual repaint.
    } catch(error) {
      this.error=error.message;this.onError(error);
      this.replaceBuilding(false);
    } finally {
      this.renderer?.resetState();
    }
  }
  replaceBuilding(value) {
    if(value===this.replacing)return;
    this.replacing=value;
    if(this.map.getLayer('buildings-3d'))this.map.setFilter('buildings-3d',value?
      ['all',this.buildingFilter,['!=',['id'],landmark.renderReplacement.featureId]]:this.buildingFilter);
  }
  getStats() {
    return {id:this.id,allowed:this.allowed,prepared:!!this.group,rendered:!!this.rendered,
      error:this.error,draws:this.draws,replacingSourceBuilding:this.replacing,origin:[...this.origin],elevationMetres:this.elevation,
      groundSampleElevations:this.sampleElevations,groundBasis:landmark.groundFit.anchorPolicy,
      siteFit:{frontPlatformHeightMetres:landmark.groundFit.authoredFrontPlatformHeightMetres,clearanceMetres:landmark.groundFit.platformClearanceMetres,foundationVertices:this.foundation?.vertices.length||0,lowestFoundationMetres:this.foundation?.values?Math.min(...this.foundation.values):0},planting:this.planting?.getStats(),
      sourceWay:landmark.source.osmId,artisticApproximation:true,model:this.modelStats,lastRender:this.lastRender};
  }
  onRemove() {
    // MapLibre also calls onRemove while destroying its lost-context style.
    // Mutating that half-destroyed style would interrupt source restoration.
    if(!this.gl.isContextLost())this.replaceBuilding(false);
    this.replacing=false;this.rendered=false;
    this.group?.traverse(mesh=>{if(mesh.isMesh){mesh.geometry.dispose();mesh.material.dispose();}});
    this.planting?.dispose();this.planting=null;this.foundation=null;
    this.renderer?.dispose(); // Never forceContextLoss: MapLibre owns the context.
    this.scene?.clear();this.group=null;this.renderer=null;
  }
}
