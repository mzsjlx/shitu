import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // Expose the exact standalone artifact for browser QA without opening other parent files.
    const standalone=pathname==='/preview.html';
    const target=standalone?path.resolve(root,'../preview.html'):path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!standalone&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}).end(body);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:500).end('Not found');}
});
server.listen(8787,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8787/'));
