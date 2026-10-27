import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.cjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.txt':'text/plain; charset=utf-8','.mp4':'video/mp4','.pmtiles':'application/vnd.pmtiles','.pbf':'application/x-protobuf'};
const port=Number(process.argv[process.argv.indexOf('--port')+1])||8791;
if(!Number.isInteger(port)||port<8791||port>8799)throw new Error('Invalid local preview port');
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),part=decodeURIComponent(url.pathname);
    if(part==='/__foodcity_health'){
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({app:'foodcity-map-base',version:'0.3.1',root}));return;
    }
    const target=path.resolve(root,'.'+(part==='/'?'/index.html':part));
    if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const info=await stat(target);
    if(!info.isFile()){res.writeHead(404).end();return;}
    const etag='"'+info.size.toString(16)+'-'+Math.trunc(info.mtimeMs).toString(16)+'"';
    const headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Accept-Ranges':'bytes','ETag':etag,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
    if(req.headers['if-match']&&req.headers['if-match']!==etag){res.writeHead(412,headers).end();return;}
    let start=0,end=info.size-1,status=200;
    if(req.headers.range){
      const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if(!range){res.writeHead(416,{...headers,'Content-Range':'bytes */'+info.size}).end();return;}
      start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;
      if(start>=info.size||start>end){res.writeHead(416,{...headers,'Content-Range':'bytes */'+info.size}).end();return;}
      status=206;headers['Content-Range']='bytes '+start+'-'+end+'/'+info.size;
    }
    headers['Content-Length']=end-start+1;
    res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(target,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:500).end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port+'/'));
