import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import handler from './api/interpret.js';
const repositoryRoot=fileURLToPath(new URL('.',import.meta.url));
const root=process.argv.includes('--static-only')?resolve(repositoryRoot,'_site'):repositoryRoot;
const base=(process.env.BASE_PATH||'').replace(/\/$/,'');
const port=Number(process.env.PORT||4176);
const privateCloud=process.argv.includes('--private-cloud')&&!process.argv.includes('--static-only')&&process.env.PENGUIN_ENABLE_CLOUD==='true';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8'};
function apiResponse(res){return {setHeader:(name,value)=>res.setHeader(name,value),status(code){res.statusCode=code;return this;},json(value){res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));return this;},end(){res.end();return this;}};}
http.createServer(async(req,res)=>{
 try{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(base){if(path===base){res.writeHead(302,{Location:base+'/'});res.end();return;}if(!path.startsWith(base+'/')){res.writeHead(404);res.end('Not found');return;}path=path.slice(base.length);}
  if(path==='/runtime-config.js'){res.setHeader('Content-Type',types['.js']);res.setHeader('Cache-Control','no-store');res.end(`window.PENGUIN_RUNTIME = Object.freeze({ cloudEnabled: ${privateCloud} });\n`);return;}
  if(path==='/api/interpret'){
   if(!privateCloud){apiResponse(res).status(503).json({error:'离线合成演示未启用个人模型。'});return;}
   let text='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>16384){apiResponse(res).status(413).json({error:'合成输入过长。'});return;}text+=chunk;}
   req.body=text;await handler(req,apiResponse(res));return;
  }
  if(path.startsWith('/api/')||path.split('/').some(v=>v.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
  let file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(resolve(root)+sep)||!types[extname(file)]){res.writeHead(404);res.end('Not found');return;}
  if(!(await stat(file)).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type',types[extname(file)]);res.end(await readFile(file));
 }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Penguin synthetic preview: http://127.0.0.1:${port}${base}/ (${privateCloud?'explicit private provider mode':'offline'})`));
