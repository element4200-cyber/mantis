import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {handleApi} from '../worker/backend.js';
const root=path.resolve(import.meta.dirname,'../web');
http.createServer(async(req,res)=>{try{if(req.url.startsWith('/api/')){const response=await handleApi(new Request('http://127.0.0.1:4173'+req.url,{headers:req.headers}),process.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return}const pathname=new URL(req.url,'http://localhost').pathname;const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const body=await readFile(target);res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.html')?'text/html':'text/plain');res.end(body)}catch{res.writeHead(404);res.end('Not found')}}).listen(4173,'127.0.0.1',()=>console.log('BuggPad preview: http://127.0.0.1:4173'));
