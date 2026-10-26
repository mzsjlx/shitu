// A restrained, antialiased masonry treatment on authored vertical plinths.
// Procedural shading only: no photo texture, external asset or geographic claim.
export function addStoneCoursing(material,orientation) {
  const c=Math.cos(orientation).toFixed(9),s=Math.sin(orientation).toFixed(9);
  material.onBeforeCompile=shader=>{
    const declarations='varying vec2 vStoneCoord;\nvarying float vStoneWall;\n';
    shader.vertexShader=declarations+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 stoneP=vec3(${c}*position.x-${s}*position.z,position.y,${s}*position.x+${c}*position.z);
      vec3 stoneN=vec3(${c}*normal.x-${s}*normal.z,normal.y,${s}*normal.x+${c}*normal.z);
      vStoneCoord=vec2(abs(stoneN.x)>.5?stoneP.z:stoneP.x,stoneP.y);
      vStoneWall=1.0-abs(normal.y);`);
    shader.fragmentShader=declarations+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float course=floor((vStoneCoord.y+.2)/1.25);
      vec2 p=vStoneCoord+vec2(mod(course,2.0)*1.7,.2);
      vec2 cell=mod(p,vec2(3.4,1.25));
      vec2 edge=min(cell,vec2(3.4,1.25)-cell);
      vec2 aa=max(fwidth(vStoneCoord),vec2(.02));
      vec2 seam=1.0-smoothstep(vec2(.025),vec2(.045)+aa,edge);
      float fade=1.0-smoothstep(.4,1.5,max(aa.x,aa.y));
      float grain=fract(sin(dot(vec2(floor(p.x/3.4),course),vec2(127.1,311.7)))*43758.5453);
      diffuseColor.rgb*=1.0+vStoneWall*fade*(-.025+.05*grain-.12*max(seam.x,seam.y));`);
  };
  material.customProgramCacheKey=()=> 'hongyadong-stone-coursing-v1';
}
