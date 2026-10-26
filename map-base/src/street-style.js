// Widths below illustrate a street, not measured kerbs or surveyed markings.
const opacity=['interpolate',['linear'],['zoom'],16.9,0,17.4,.65,18.1,1];
const metresToPixels=z=>512*Math.pow(2,z)/(40075016.686*Math.cos(29.565*Math.PI/180));
const metric=value=>['interpolate',['exponential',2],['zoom'],16,['*',value,metresToPixels(16)],19,['*',value,metresToPixels(19)]];
const kind=(...types)=>['in',['get','type'],['literal',types]];
const line=(id,filter,paint,layout={})=>({id,type:'line',source:'street-detail',minzoom:16.9,filter,layout:{'line-cap':'round','line-join':'round',...layout},paint:{'line-opacity':opacity,...paint}});
export function streetLayers(){
  return [
    line('street-road-edge',['==',['get','illustrated'],true],{'line-color':'#858b84','line-width':metric(['+',['get','modelWidthM'],.8])},{'line-cap':'butt'}),
    line('street-road-surface',['==',['get','illustrated'],true],{'line-color':'#969e97','line-width':metric(['get','modelWidthM'])},{'line-cap':'butt'}),
    line('street-lanes',kind('lane-separator'),{'line-color':'#fff9e8','line-width':['interpolate',['linear'],['zoom'],17,1,19,2.1],'line-offset':metric(['get','offsetM']),'line-dasharray':[4,5]},{'line-cap':'butt'}),
    line('street-walk-edge',kind('sidewalk','pedestrian','footpath','steps'),{'line-color':'#b5a78c','line-width':['interpolate',['exponential',2],['zoom'],17,3.5,19,13]}),
    line('street-walk',kind('sidewalk','pedestrian','footpath','steps'),{'line-color':['match',['get','type'],'sidewalk','#fff9e8','pedestrian','#f5e8cc','steps','#ddc7a3','#eee4d0'],'line-width':['interpolate',['exponential',2],['zoom'],17,2,19,9]}),
    line('street-steps',kind('steps'),{'line-color':'#927957','line-width':['interpolate',['exponential',2],['zoom'],17,2.5,19,10],'line-dasharray':[.25,1.1]},{'line-cap':'butt'}),
    // A crossing path does not imply zebra paint. Unknown markings use a route symbol.
    line('street-crossing',kind('crossing'),{'line-color':'#af7452','line-width':['interpolate',['linear'],['zoom'],17,2,19,4],'line-dasharray':[1,1.5]}),
    line('street-zebra',['all',kind('crossing'),['==',['get','explicitlyZebra'],true]],{'line-color':'#fffaf0','line-width':['interpolate',['exponential',2],['zoom'],17,4,19,17],'line-dasharray':[.25,.4]},{'line-cap':'butt'}),
    {id:'street-names',type:'symbol',source:'street-detail',minzoom:17.25,filter:['all',kind('raw-road','pedestrian'),['!=',['get','name'],'']],layout:{'symbol-placement':'line','symbol-spacing':350,'text-field':['get','name'],'text-font':['sans-serif'],'text-size':12,'text-padding':15},paint:{'text-color':'#4e5b52','text-halo-color':'#fff9e8','text-halo-width':2,'text-opacity':opacity}},
    line('street-selected',['==',['get','osmId'],-1],{'line-color':'#f37451','line-width':['interpolate',['linear'],['zoom'],17,4,19,8]})
  ];
}
export const streetHitLayers=['street-walk','street-crossing','street-road-surface'];
