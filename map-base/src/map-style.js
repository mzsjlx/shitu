// Visuals belong to us; geographic geometry stays in the versioned data source.
export const roadName = ['coalesce', ['get', 'name:zh-Hans'], ['get', 'name'], ''];
const kind = ['get', 'kind'];
const detail = ['get', 'kind_detail'];
const line = ['==', ['geometry-type'], 'LineString'];
const width = (stops) => ['interpolate', ['exponential', 1.45], ['zoom'], ...stops];
const namedRoad = ['all', line, ['!=', roadName, '']];
const font = ['sans-serif'];

export function makeStyle(city, tilesURL, bundle) {
  const sources = {
    city: {
      type: 'vector',
      url: 'pmtiles://' + tilesURL,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · <a href="https://protomaps.com/" target="_blank" rel="noreferrer">Protomaps</a>'
    }
  };
  if (city.buildingsDetail) {
    const detailData = bundle?.json?.[city.buildingsDetail] || new URL(city.buildingsDetail, location.href).href;
    sources['buildings-detail'] = {
      type: 'geojson',
      data: detailData
    };
  }
  if (city.demTiles) {
    const demURL = new URL(city.demTiles, location.href).href.replaceAll('%7B', '{').replaceAll('%7D', '}');
    const b = city.bounds;
    const demSource = {
      type: 'raster-dem',
      tiles: [demURL],
      tileSize: 256,
      minzoom: city.demMinZoom,
      maxzoom: city.demMaxZoom,
      encoding: 'terrarium',
      bounds: [b[0] - .03, b[1] - .03, b[2] + .03, b[3] + .03],
      attribution: 'Terrain: <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Mapzen / Tilezen</a>'
    };
    sources.dem = demSource;
    sources['dem-shade'] = { ...demSource, attribution: '' };
  }
  const layers = [
    {id:'canvas',type:'background',paint:{'background-color':'#e8e5db'}},
    {id:'land',type:'fill',source:'city','source-layer':'earth',paint:{'fill-color':'#e8e5db','fill-antialias':false}},
    {id:'woodland',type:'fill',source:'city','source-layer':'landuse',filter:['in',kind,['literal',['forest','wood','nature_reserve','park','garden','grass','scrub','recreation_ground']]],paint:{'fill-color':['match',kind,['forest','wood'],'#a2b18d',['park','garden'],'#b9c6a4','#ccd1b4'],'fill-opacity':.85}},
    {id:'civic-grounds',type:'fill',source:'city','source-layer':'landuse',filter:['in',kind,['literal',['school','university','hospital','pedestrian']]],paint:{'fill-color':['match',kind,'pedestrian','#ded8c9','#dedfd2'],'fill-opacity':.7}},
    {id:'water',type:'fill',source:'city','source-layer':'water',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#91b9b3','fill-antialias':true}},
    {id:'water-lines',type:'line',source:'city','source-layer':'water',filter:line,paint:{'line-color':'#91b9b3','line-width':width([11,.5,16,3,19,10])}},
    ...(city.demTiles ? [{id:'hill-shade',type:'hillshade',source:'dem-shade',paint:{'hillshade-exaggeration':.18,'hillshade-shadow-color':'#7b846e','hillshade-highlight-color':'#fff8e9','hillshade-accent-color':'#a5ac93','hillshade-illumination-direction':310}}] : []),
    {id:'buildings-flat',type:'fill',source:'city','source-layer':'buildings',minzoom:13,filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#d5cebf','fill-outline-color':'#c6beaf','fill-opacity':.72}},
    ...(city.buildingsDetail ? [{
      id: 'buildings-detail-flat',
      type: 'fill',
      source: 'buildings-detail',
      minzoom: 12,
      paint: {
        'fill-color': ['coalesce', ['get', 'flat_color'], ['get', 'color'], '#d0c8b8'],
        'fill-outline-color': '#beaf9c',
        'fill-opacity': 0.76
      }
    }] : []),
  ];
  const classes = [
    {name:'paths',test:['==',kind,'path'],minzoom:14,w:[13,.4,16,1.5,19,4],color:'#c5bbaa'},
    {name:'minor',test:['==',kind,'minor_road'],minzoom:12,w:[12,.5,15,2.5,18,9,20,18],color:'#fcf8ee'},
    {name:'major',test:['==',kind,'major_road'],minzoom:8,w:[10,.6,13,2,16,7,19,23],color:'#fffaf0'},
    {name:'highway',test:['==',kind,'highway'],minzoom:6,w:[10,1,13,3.5,16,10,19,28],color:'#e9d3ae'},
  ];
  for (const group of classes) {
    const filter = ['all',line,group.test,['!=',['get','is_tunnel'],true]];
    layers.push(
      {id:'road-'+group.name+'-edge',type:'line',source:'city','source-layer':'roads',minzoom:group.minzoom,filter,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#bdb7a9','line-width':width(group.w.map((value,i)=>i%2?value+(group.name==='paths'?.5:1.4):value)),'line-opacity':.66}},
      {id:'road-'+group.name,type:'line',source:'city','source-layer':'roads',minzoom:group.minzoom,filter,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':group.color,'line-width':width(group.w)}}
    );
  }
  layers.push(
    {id:'road-tunnels',type:'line',source:'city','source-layer':'roads',minzoom:13,filter:['all',line,['==',['get','is_tunnel'],true],['in',kind,['literal',['major_road','minor_road','highway']]]],paint:{'line-color':'#b6afa0','line-width':width([13,1,16,3,19,9]),'line-dasharray':[2,2],'line-opacity':.65}},
    {id:'railways',type:'line',source:'city','source-layer':'roads',minzoom:13,filter:['all',line,['==',kind,'rail'],['!=',['get','is_tunnel'],true]],paint:{'line-color':'#b4b7a7','line-width':width([13,.6,17,2,20,5]),'line-dasharray':[2,1.8]}},
    {id:'bridge-edges',type:'line',source:'city','source-layer':'roads',minzoom:12,filter:['all',line,['==',['get','is_bridge'],true],['in',kind,['literal',['major_road','minor_road','highway']]]],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#a9a998','line-width':width([12,1.4,15,5,18,16,20,32])}},
    {id:'bridge-roads',type:'line',source:'city','source-layer':'roads',minzoom:12,filter:['all',line,['==',['get','is_bridge'],true],['in',kind,['literal',['major_road','minor_road','highway']]]],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#f5ecdc','line-width':width([12,.8,15,3.5,18,12,20,27])}},
    {id:'buildings-3d',type:'fill-extrusion',source:'city','source-layer':'buildings',minzoom:13,filter:['all',['==',['geometry-type'],'Polygon'],['in',kind,['literal',['building','building_part']]]],paint:{
      'fill-extrusion-color':['step',
        ['coalesce',['get','height'],15],
        '#dad5c8', 16, '#e4dfd3', 25, '#ece7dc', 60, '#f2eee5', 140, '#f9f6ef'
      ],
      'fill-extrusion-height':[
        'case',
        ['>', ['coalesce',['get','height'],0],0],
        ['min',500,['get','height']],
        ['+',
          ['match', detail,
            ['mall', 'commercial', 'retail', 'department_store'], 28,
            ['office', 'hotel'], 36,
            ['apartments', 'residential'], 22,
            ['school', 'kindergarten', 'hospital', 'civic'], 18,
            ['case',
              ['>', ['coalesce', ['get', 'sort_rank'], 400], 420], 25,
              15
            ]
          ],
          ['coalesce',['get','min_height'],0]
        ]
      ],
      'fill-extrusion-base':['max',0,['coalesce',['get','min_height'],0]],
      'fill-extrusion-opacity':1,
      'fill-extrusion-vertical-gradient':true
    }},
    ...(city.buildingsDetail ? [{
      id: 'buildings-detail-3d',
      type: 'fill-extrusion',
      source: 'buildings-detail',
      minzoom: 12,
      paint: {
        'fill-extrusion-color': ['coalesce', ['get', 'color'], '#ece7dc'],
        'fill-extrusion-height': ['coalesce', ['get', 'height'], 15],
        'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
        'fill-extrusion-opacity': 1,
        'fill-extrusion-vertical-gradient': true
      }
    }] : []),
    {id:'selected-road-edge',type:'line',source:'city','source-layer':'roads',filter:['==',roadName,'__none__'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fffaf2','line-width':width([12,5,16,11,19,25]),'line-opacity':.95}},
    {id:'selected-road',type:'line',source:'city','source-layer':'roads',filter:['==',roadName,'__none__'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#f47653','line-width':width([12,2,16,5,19,12])}},
    {id:'road-labels-major',type:'symbol',source:'city','source-layer':'roads',minzoom:13,filter:['all',namedRoad,['in',kind,['literal',['major_road','highway']]]],layout:{'symbol-placement':'line','symbol-spacing':320,'text-field':roadName,'text-font':font,'text-size':width([13,10,16,12.5,19,15]),'text-max-angle':35,'text-letter-spacing':.06,'text-padding':7},paint:{'text-color':'#736c60','text-halo-color':'#fffaf0','text-halo-width':1.8,'text-halo-blur':.7}},
    {id:'road-labels-minor',type:'symbol',source:'city','source-layer':'roads',minzoom:16.2,filter:['all',namedRoad,['in',kind,['literal',['minor_road','path']]]],layout:{'symbol-placement':'line','symbol-spacing':240,'text-field':roadName,'text-font':font,'text-size':11,'text-padding':10,'text-max-angle':35},paint:{'text-color':'#8b8274','text-halo-color':'#fffaf0','text-halo-width':1.5}},
    {id:'water-labels',type:'symbol',source:'city','source-layer':'water',minzoom:11,filter:['all',['has','name'],['==',['geometry-type'],'Polygon']],layout:{'text-field':roadName,'text-font':font,'text-size':width([11,12,15,17,18,21]),'text-letter-spacing':.32,'text-padding':18},paint:{'text-color':'#557d78','text-halo-color':'#a8cac4','text-halo-width':1}},
    {id:'places',type:'symbol',source:'city','source-layer':'places',minzoom:11,filter:['in',kind,['literal',['neighbourhood','macrohood']]],layout:{'text-field':roadName,'text-font':font,'text-size':width([11,12,16,16]),'text-padding':20,'text-letter-spacing':.12},paint:{'text-color':'#8b816d','text-halo-color':'#f5f0e5','text-halo-width':2}},
    {
      id: 'poi-landmarks',
      type: 'symbol',
      source: 'city',
      'source-layer': 'pois',
      minzoom: 13,
      filter: [
        'all',
        ['has', 'name'],
        ['in', kind, ['literal', [
          'park', 'garden', 'attraction', 'viewpoint', 'theme_park',
          'mall', 'supermarket', 'marketplace', 'commercial', 'retail', 'clothes', 'wholesale',
          'restaurant', 'cafe', 'fast_food', 'food', 'bakery',
          'hospital', 'clinic', 'pharmacy',
          'building', 'hotel', 'museum', 'theatre', 'gallery', 'arts_centre', 'station', 'bus_station', 'sports_centre'
        ]]]
      ],
      layout: {
        'visibility': 'none',
        'icon-image': [
          'match', kind,
          ['park', 'garden', 'attraction', 'viewpoint', 'theme_park'], 'poi-park',
          ['restaurant', 'cafe', 'fast_food', 'food', 'bakery'], 'poi-food',
          ['hospital', 'clinic', 'pharmacy'], 'poi-hospital',
          ['mall', 'supermarket', 'marketplace', 'retail', 'clothes', 'wholesale'], 'poi-shop',
          'poi-building'
        ],
        'icon-size': 0.7,
        'icon-anchor': 'left',
        'text-field': roadName,
        'text-font': font,
        'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 16, 12.5, 18, 14],
        'text-anchor': 'left',
        'text-offset': [1.35, 0],
        'text-letter-spacing': 0.05,
        'text-max-width': 10,
        'text-optional': false,
        'icon-optional': false,
        'icon-allow-overlap': false,
        'text-allow-overlap': false,
        'icon-padding': 4,
        'text-padding': 4
      },
      paint: {
        'text-color': '#3e362c',
        'text-halo-color': '#fffbf2',
        'text-halo-width': 2,
        'text-halo-blur': 0.6
      }
    }
  );
  return {
    version:8,
    name:'食途 · 山城暖白',
    metadata:{owner:'FoodCity',geographicData:'Protomaps / OpenStreetMap',mapType:'self-hosted local validation'},
    sources,
    light:{anchor:'map',color:'#fff5e4',intensity:.42,position:[1.35,315,42]},
    layers
  };
}

export const roadHitLayers=['bridge-roads','road-highway','road-major','road-minor','road-paths','road-tunnels'];
export const labelLayers=['road-labels-major','road-labels-minor'];
