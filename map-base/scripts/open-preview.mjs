import {spawn} from 'node:child_process';
import {mkdir,open} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function probe(port){
  try{
    const r=await fetch('http://127.0.0.1:'+port+'/__foodcity_health',{signal:AbortSignal.timeout(600)});
    const data=await r.json();
    return data.app==='foodcity-map-base'&&data.version==='0.3.1'&&path.resolve(data.root)===path.join(root,'dist')?'ours':'occupied';
  }catch(error){return error.cause?.code==='ECONNREFUSED'?'free':'occupied';}
}
let chosen;
await mkdir(path.join(root,'.local'),{recursive:true});
for(let port=8791;port<=8799;port++){
  const status=await probe(port);
  if(status==='ours'){chosen=port;break;}
  if(status!=='free')continue;
  const log=await open(path.join(root,'.local','preview-'+port+'.log'),'a');
  const child=spawn(process.execPath,[path.join(root,'scripts/serve.mjs'),'--port',String(port)],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',log.fd,log.fd]});
  let launchError;
  child.once('error',error=>{launchError=error;});
  child.unref();await log.close();
  for(let attempt=0;attempt<30;attempt++){
    if(launchError)throw launchError;
    if(await probe(port)==='ours'){chosen=port;break;}
    await sleep(100);
  }
  if(chosen)break;
}
if(!chosen)throw new Error('无法启动本地预览，请检查 8791–8799 端口。');
const url='http://127.0.0.1:'+chosen+'/?view=food';
console.log('食途地图已启动：'+url);
if(!process.argv.includes('--no-open')){
  if(process.platform==='win32'){
    const browser=spawn('powershell.exe',['-NoProfile','-Command',"Start-Process '"+url+"'"],{windowsHide:true,stdio:'ignore'});
    browser.once('error',error=>console.error('请手动打开 '+url+'：'+error.message));browser.unref();
  }else console.log('请在浏览器中打开上方地址。');
}
