// Demonstração de apresentação validada em navegador real com arquivos locais.
// Isolada: não faz requisições à API de produção e não escreve no Supabase.
import {createRequire} from 'node:module';
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname);
const requests=[];
const server=http.createServer(async(req,res)=>{
 try{
  let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(file.endsWith('/'))file+='index.html';
  const abs=path.join(root,file);
  if(!abs.startsWith(root+path.sep))throw Error('blocked');
  const body=await fs.readFile(abs);res.setHeader('Content-Type',file.endsWith('.mjs')||file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
  res.end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.env.CAPISOL_CHROMIUM_PATH?{executablePath:process.env.CAPISOL_CHROMIUM_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('request',r=>requests.push(r.url()));
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/saas/demo.html`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:/Fazenda Horizonte/}).waitFor();
 await page.getByText('240', {exact:true}).first().waitFor();
 await page.getByRole('button',{name:'Operação do segmento'}).click();
 await page.getByText('Fertilizante genérico').waitFor();
 const amount=page.locator('[data-qty="sku-0"]');await amount.fill('3');
 await page.locator('[data-do="stock-out"][data-id="sku-0"]').click();
 await page.getByText('Quantidade em estoque: 87').waitFor();
 await page.locator('[data-do="crop"][data-id="crop-0"]').click();
 await page.getByText('Área: 8.5 ha').waitFor();
 await page.getByRole('button',{name:'Catálogo de 240 módulos'}).click();
 await page.getByText('24 núcleos e 240 competências').waitFor();
 await page.getByRole('button',{name:'Expansão geográfica'}).click();
 await page.locator('[data-scale-to="global"]').click();
 await page.getByText(/multimoeda ou multijurisdicao nao homologada/i).waitFor();
 await page.getByRole('button',{name:'Resumo da apresentação'}).click();
 await page.getByText('Fazenda Horizonte — Demonstração').first().waitFor();
 await page.locator('#scenario').selectOption('mechanics');
 await page.getByRole('heading',{name:/AutoCenter Modelo/}).waitFor();
 await page.getByRole('button',{name:'Operação do segmento'}).click();
 await page.getByText('Filtro de óleo').waitFor();
 await page.locator('[data-do="order"]').first().click();
 await page.getByText('Aprovado',{exact:true}).first().waitFor();
 await page.locator('#scenario').selectOption('news_media');
 await page.getByRole('button',{name:'Operação do segmento'}).click();
 await page.locator('[data-do="story"]').first().click();
 await page.getByText(/não publicada/).waitFor();
 await page.locator('#scenario').selectOption('faith_nonprofit');
 await page.getByRole('button',{name:'Operação do segmento'}).click();
 await page.locator('[data-do="event"]').first().click();
 await page.getByText(/nenhum dado externo foi alterado/i).waitFor();
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/tmp/capisol-demonstracao-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'demo ultrapassa largura no celular');
 assert.deepEqual(errors,[]);
 assert.equal(requests.every(url=>url.startsWith(`http://127.0.0.1:${server.address().port}/`)),true,'não pode chamar API externa');
 console.log('PASS DEMO: sete perfis, troca de setores, estoque, cultura, oficina, jornal, igreja, catálogo, escala, celular e zero requisições externas');
}catch(e){console.error('Demo debug:',(await page.locator('main').innerText()).slice(0,1600),errors,requests.slice(-15));throw e;}
finally{await browser.close();server.close();}
