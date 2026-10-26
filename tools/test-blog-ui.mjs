import {createServer} from 'node:http';import{readFileSync}from'node:fs';import{chromium}from'playwright';import assert from'node:assert/strict';
const pageCode=readFileSync('blog/index.html');const image=readFileSync('bio/logo.png');
const server=createServer((req,res)=>{if(req.url.startsWith('/blog/')){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(pageCode);}else if(req.url==='/bio/logo.png'){res.writeHead(200,{'content-type':'image/png'});res.end(image)}else{res.writeHead(404);res.end();}});
let browser;try{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+'/blog/';browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
const fixture=[{id:'00000000-0000-4000-8000-000000000001',title:'Como avaliar uma proposta solar',summary:'Conteúdo educativo testado.',body:'Texto original de demonstração sem informações de clientes.',slug:'como-avaliar-uma-proposta-solar',category:'Educação',source_url:'https://www.gov.br/aneel/pt-br/assuntos/geracao-distribuida',approved_at:'2026-10-26T10:00:00Z'}];
await page.route('**/rest/v1/rpc/capisol_blog_feed',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
await page.goto(url);await page.getByText('Como avaliar uma proposta solar').waitFor();await page.getByRole('link',{name:'Ler matéria completa'}).click();
await page.getByRole('heading',{name:'Como avaliar uma proposta solar'}).waitFor();assert.equal(await page.locator('.article .text').textContent(),fixture[0].body);
await page.reload();await page.getByText('Como avaliar uma proposta solar').waitFor();
assert.deepEqual(errs,[]);console.log('Blog publicou apenas fixture aprovada em rota simulada');
await page.unroute('**/rest/v1/rpc/capisol_blog_feed');
await page.route('**/rest/v1/rpc/capisol_blog_feed',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
await page.goto(url);await page.getByText('Ainda não há matérias aprovadas', {exact:false}).waitFor();console.log('Blog vazio: sem publicação falsa');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
