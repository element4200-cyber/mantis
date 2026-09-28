import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),web=path.join(root,'web');
const files={};
async function collect(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())await collect(p);else{const route='/'+path.relative(web,p).replaceAll('\\','/');files[route]=await readFile(p,'utf8')}}}
await collect(web);
const settings=await readFile(path.join(root,'worker/settings.js'),'utf8');
const backend=(await readFile(path.join(root,'worker/backend.js'),'utf8')).replace(/^import .*settings\.js';\r?\n/, '');
const source=settings+'\n'+backend+'\nconst ASSETS='+JSON.stringify(files)+';\nexport default {async fetch(request,env={}) {const url=new URL(request.url);if(url.pathname.startsWith("/api/"))return handleApi(request,env);if(url.pathname==="/admin.html")return new Response("Not found",{status:404});if(url.pathname==="/admin"){const denied=await authorizeAdminPage(request,env);if(denied)return denied;}const route=url.pathname==="/admin"?"/admin.html":url.pathname==="/"?"/index.html":url.pathname;const content=ASSETS[route];if(content===undefined)return new Response("Not found",{status:404});const mime=route.endsWith(".css")?"text/css":route.endsWith(".js")?"text/javascript":route.endsWith(".html")?"text/html":"text/plain";return new Response(content,{headers:{"Content-Type":mime+"; charset=utf-8","Vary":"Cookie","Cache-Control":route==="/admin.html"?"no-store":route.startsWith("/vendor/")?"public,max-age=31536000":"no-cache","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin"}})}};\n';
await mkdir(path.join(root,'dist/server'),{recursive:true});await mkdir(path.join(root,'dist/.openai'),{recursive:true});await writeFile(path.join(root,'worker/index.js'),source);await writeFile(path.join(root,'dist/server/index.js'),source);await writeFile(path.join(root,'dist/.openai/hosting.json'),await readFile(path.join(root,'.openai/hosting.json')));console.log('Built BuggPad Worker with '+Object.keys(files).length+' embedded assets.');

await cp(path.join(root,'drizzle'),path.join(root,'dist/drizzle'),{recursive:true});
