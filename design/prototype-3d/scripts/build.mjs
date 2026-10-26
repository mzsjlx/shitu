import { build } from 'esbuild';
import { mkdir, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await mkdir(path.join(root,'dist','assets'),{recursive:true});
await build({entryPoints:[path.join(root,'src','main.js')],outfile:path.join(root,'dist','app.js'),bundle:true,minify:true,format:'esm',target:['es2022'],sourcemap:true});
for(const name of ['index.html','styles.css'])await copyFile(path.join(root,'src',name),path.join(root,'dist',name));
await copyFile(path.join(root,'..','concepts','food-thumbnails-v2.jpg'),path.join(root,'dist','assets','food-thumbnails.jpg'));
await copyFile(path.join(root,'node_modules','three','LICENSE'),path.join(root,'dist','THREE-LICENSE.txt'));
await copyFile(path.join(root,'data','quality-report.json'),path.join(root,'dist','data','quality-report.json'));
const html=await readFile(path.join(root,'src','index.html'),'utf8');
const photo=(await readFile(path.join(root,'dist','assets','food-thumbnails.jpg'))).toString('base64');
const css=(await readFile(path.join(root,'src','styles.css'),'utf8')).replace("./assets/food-thumbnails.jpg",'data:image/jpeg;base64,'+photo);
const js=(await readFile(path.join(root,'dist','app.js'),'utf8')).replace(/\/\/# sourceMappingURL=.*$/m,'');
const data=JSON.stringify(JSON.parse(await readFile(path.join(root,'dist','data','city.json'),'utf8'))).replace(/</g,'\\u003c');
const license=await readFile(path.join(root,'node_modules','three','LICENSE'),'utf8');
// A callback keeps replacement tokens such as "$&" in bundled library code literal.
const portable=html.replace('<link rel="stylesheet" href="./styles.css">',()=>`<style>${css}</style>`)
  .replace('<script type="module" src="./app.js"></script>',()=>`<!-- Three.js license:\n${license}\n--><script>window.__CITY_STUDY_DATA__=${data};</script>\n<script type="module">\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>`);
await writeFile(path.join(root,'preview.html'),portable);
console.log('Built local 3D study in dist/');
