// Use original OSM node IDs, never display-tile coordinate stitching.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./prepare-food-road-network.py',import.meta.url));
const result=spawnSync(process.env.FOODCITY_PYTHON || 'python',[script,'--city','chengdu','--pbf','map-base/.local/sichuan-261110.osm.pbf','--source-date','2026-11-10','--url','https://download.geofabrik.de/asia/china/sichuan.html',...process.argv.slice(2)],{stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status ?? 1;
