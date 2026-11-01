import argparse,hashlib,json,tempfile,shutil,os
from pathlib import Path
import osmium

parser=argparse.ArgumentParser();parser.add_argument('--pbf',required=True);args=parser.parse_args()
expected=json.loads(Path('data/cities/changsha/location-anchors.json').read_text(encoding='utf8'))
source=Path(args.pbf);sha=hashlib.sha256(source.read_bytes()).hexdigest();assert sha==expected['sourceSHA256']
temporary=tempfile.NamedTemporaryFile(prefix='shitu-cs-source-check-',suffix='.osm.pbf',delete=False);temporary.close();shutil.copyfile(source,temporary.name)
targets={};checks=[]
for a in expected['anchors']:targets.setdefault((a['kind'].replace('osm-',''),a['id']),[]).append(a)
for o in osmium.FileProcessor(temporary.name).with_locations().with_filter(osmium.filter.KeyFilter('name','name:zh')):
 kind='node' if o.is_node() else 'way' if o.is_way() else 'relation'
 if (kind,o.id) not in targets:continue
 for a in targets.pop((kind,o.id)):
  if kind=='node':point=[o.location.lon,o.location.lat]
  else:
   node=next(n for n in o.nodes if n.ref==a['nodeId']);point=[node.location.lon,node.location.lat]
  assert point==a['coordinates'];assert o.tags.get('name')==a['name'];checks.append({'id':a['id'],'kind':a['kind'],'name':a['name'],'passed':True})
os.unlink(temporary.name);assert not targets
report={'verifiedOn':'2026-11-01','sourceDate':expected['sourceDate'],'sourceSHA256':sha,'scope':'Independently reread original PBF objects and selected source-node coordinates; does not verify storefronts or current opening status.','checks':checks,'passed':True}
Path('CHANGSHA-LOCATION-SOURCE-QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'passed':True,'anchors':len(checks)}))
