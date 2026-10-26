import * as THREE from 'three';
import {createHongyadongModel} from './hongyadong-model.js';
import landmark from '../data/hongyadong-landmark.json';

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
    this.groundSamples=[[106.5745498603,29.5650955583],[106.5752283149,29.5653127615],[106.5759067695,29.5655299647]];
  }
  onAdd(map,gl) {
    this.map=map;this.gl=gl;
    this.camera=new THREE.Camera();this.scene=new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight('#fff5df','#aaa58c',2.1));
    const sun=new THREE.DirectionalLight('#fff2d7',2.8);sun.position.set(-160,240,-180);this.scene.add(sun);
    this.rotation=new THREE.Matrix4().makeRotationX(Math.PI/2);
    this.localToMercator=new THREE.Matrix4();this.projection=new THREE.Matrix4();
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
    // Mercator Y is reflected in projection, rather than in matrixWorld.
    group.traverse(mesh=>{if(mesh.isMesh)mesh.material.side=THREE.DoubleSide;});
    this.renderer=new THREE.WebGLRenderer({canvas:this.map.getCanvas(),context:this.gl,antialias:true});
    this.renderer.autoClear=false;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.1;
  }
  render(gl,args) {
    this.rendered=false;
    if(!this.allowed||this.error||this.map.getZoom()<landmark.renderReplacement.minimumMapZoom){this.replaceBuilding(false);return;}
    const terrain=!!this.map.getTerrain();
    const samples=terrain?this.groundSamples.map(p=>this.map.queryTerrainElevation(p)):[];
    if(terrain&&samples.some(h=>!Number.isFinite(h))){this.replaceBuilding(false);return;}
    const elevation=terrain?Math.min(...samples)+.5:0;
    this.elevation=elevation;this.sampleElevations=samples;
    try {
      if(!this.renderer)this.prepare();
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
      groundSampleElevations:this.sampleElevations,groundBasis:'Minimum of three river-front DEM samples + 0.5m; flat mode uses 0m',
      sourceWay:landmark.source.osmId,artisticApproximation:true,model:this.modelStats,lastRender:this.lastRender};
  }
  onRemove() {
    // MapLibre also calls onRemove while destroying its lost-context style.
    // Mutating that half-destroyed style would interrupt source restoration.
    if(!this.gl.isContextLost())this.replaceBuilding(false);
    this.replacing=false;this.rendered=false;
    this.group?.traverse(mesh=>{if(mesh.isMesh){mesh.geometry.dispose();mesh.material.dispose();}});
    this.renderer?.dispose(); // Never forceContextLoss: MapLibre owns the context.
    this.scene?.clear();this.group=null;this.renderer=null;
  }
}
