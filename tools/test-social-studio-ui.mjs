import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=resolve('.');
const routeFile={'/posts/studio-social.mjs':{path:'posts/studio-social.mjs',mime:'text/javascript'},'/bio/logo.png':{path:'bio/logo.png',mime:'image/png'}};
const server=createServer(async(req,res)=>{
 try{
  const q=new URL(req.url,'http://localhost').pathname;
  if(q==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end('<!doctype html><html lang="pt-BR"><head><title>Estúdio Smoke</title></head><body><main id="ready">Fixture</main></body></html>');return;}
  if(!routeFile[q]){res.writeHead(404);res.end();return}
  const o=routeFile[q];res.writeHead(200,{'content-type':o.mime,'cache-control':'no-store'});res.end(await readFile(join(base,o.path)));
 }catch(e){res.writeHead(500);res.end('Erro');}
});
let browser;
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const {port}=server.address();browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:930,height:900}});
 const pageErrors=[];page.on('pageerror',e=>{pageErrors.push(e.message);console.error('browser error:',e.message);});
 await page.goto('http://127.0.0.1:'+port);
 await page.evaluate(async()=>{
  const m=await import('/posts/studio-social.mjs');
  window.__saved=null;
  m.openStudio({isOwner:true,api:{saveSocial:async(plan,blob,ext)=>{window.__saved={plan,bytes:blob.size,ext};}},reloadPosts:async()=>true});
 });
 await page.locator('input[name=title]').fill('Limpeza de painéis solares');
 await page.locator('textarea[name=idea]').fill('A sujeira pode prejudicar a geração. Fale com a CAPISOL.');
 await page.locator('select[name=mode]').selectOption('motion');
 await page.getByRole('button',{name:/Gerar vídeo e enviar/}).click();
 await page.waitForFunction(()=>window.__saved&&window.__saved.bytes>1000,null,{timeout:40000});
 const result=await page.evaluate(()=>({saved:window.__saved,status:document.querySelector('[role=status]')?.textContent,hasVideo:!!document.querySelector('.capisol-studio video')}));
 assert.deepEqual(pageErrors,[],'não deve haver erros de JavaScript no navegador');
 assert.ok(result.saved.bytes>1000,'vídeo renderizado');
 assert.ok(['webm','mp4'].includes(result.saved.ext));
 assert.match(result.status,/Salvo em Posts prontos/);
 assert.equal(result.saved.plan.title,'Limpeza de painéis solares');
 assert.ok(result.hasVideo,'prévia renderizada');
 console.log(JSON.stringify({status:'passou',bytes:result.saved.bytes,ext:result.saved.ext,mode:result.saved.plan.mode}));
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
