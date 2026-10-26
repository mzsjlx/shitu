import {mkdir,mkdtemp,readFile,writeFile,cp,stat,rm,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildPlacePages} from './build-place-pages.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),local=path.join(root,'.local');
await mkdir(local,{recursive:true});
const temp=await mkdtemp(path.join(local,'place-pages-qa-'));
const food=JSON.parse(await readFile(path.join(root,'data/food-records.json'),'utf8')),editorial=JSON.parse(await readFile(path.join(root,'data/place-editorial.json'),'utf8'));
const digest=value=>createHash('sha256').update(value).digest('hex');
const publicBefore=digest(await readFile(path.join(root,'data/food-records.json')));
const report={checkedOn:'2026-10-24',scope:'Independent build boundary checks with isolated synthetic files. No merchant or entrance verification.',checks:[],issues:[]};
const check=(name,passed,details)=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name);};
const writeInput=async data=>{await writeFile(path.join(temp,'data/food-records.json'),JSON.stringify(data));await writeFile(path.join(temp,'data/place-editorial.json'),JSON.stringify(editorial));};
const exists=async file=>{try{return (await stat(file)).isFile();}catch{return false;}};
try{
  await mkdir(path.join(temp,'data'));await mkdir(path.join(temp,'src'));await cp(path.join(root,'src/place-pages.css'),path.join(temp,'src/place-pages.css'));await writeInput(food);
  const files=await buildPlacePages(temp),htmlFile=path.join(temp,'dist/places',food.records[0].id+'.html');
  check('Valid source candidates produce only the expected directory and two detail paths',JSON.stringify(files)===JSON.stringify(['places.html',...food.records.map(r=>'places/'+r.id+'.html')]),{files});
  const injected=structuredClone(food);injected.records[0].name='<img src=x onerror="alert(1)"> & candidate';injected.records[0].sourceName='<script>synthetic()</script>';
  await writeInput(injected);await buildPlacePages(temp);const escaped=await readFile(htmlFile,'utf8');
  check('Source names remain escaped text in headings and metadata',escaped.includes('&lt;img src=x onerror=')&&escaped.includes('&lt;script&gt;synthetic()&lt;/script&gt;')&&!escaped.includes('<img src=x')&&!escaped.includes('<script>synthetic()'));
  for(const [name,mutate]of [
    ['Traversal-like source ID is rejected before replacing existing pages',data=>data.records[0].id='../outside'],
    ['Duplicate source IDs are rejected before replacing existing pages',data=>data.records[1]={...data.records[0]}],
    ['Changed route eligibility requires editorial review before page generation',data=>data.records[0].routeEligible=true]
  ]){
    const before=digest(await readFile(htmlFile)),data=structuredClone(food);mutate(data);await writeInput(data);let error='';try{await buildPlacePages(temp);}catch(e){error=e.message;}
    check(name,!!error&&digest(await readFile(htmlFile))===before,{rejectedWith:error});
  }
  await writeInput(food);const ownOld=path.join(temp,'dist/places/osm-node-999.html'),manual=path.join(temp,'dist/places/manual.html');
  await writeFile(ownOld,'Synthetic stale output');await writeFile(manual,'Retain unrelated file');await buildPlacePages(temp);
  check('Stale cleanup removes only generator-owned numeric pages',!await exists(ownOld)&&await readFile(manual,'utf8')==='Retain unrelated file');
  report.publicDataSHA256=digest(await readFile(path.join(root,'data/food-records.json')));
  check('Build checks leave actual public food data unchanged',report.publicDataSHA256===publicBefore);
}catch(error){report.issues.push(error.message);}
finally{
  const actual=await realpath(temp),base=await realpath(local);
  if(!actual.startsWith(base+path.sep)||!path.basename(actual).startsWith('place-pages-qa-'))throw new Error('Refusing cleanup outside the task-owned test folder');
  await rm(actual,{recursive:true,force:true});
}
report.passed=report.issues.length===0;await writeFile(path.join(root,'PLACE-PAGES-DATA-QA.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,total:report.checks.length,issues:report.issues}));
if(!report.passed)process.exitCode=1;
