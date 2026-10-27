import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
test('saúde da Meta só é consultada em clique autorizado, sem envio automático',()=>{
 assert.match(app,/renderWhatsAppReadiness/);
 assert.match(app,/functions\/v1\/whatsapp-diagnostico/);
 assert.match(app,/button\.addEventListener\('click'/);
 assert.match(app,/getSession\(\)/);
 assert.match(app,/Envio real homologado: não/);
 assert.doesNotMatch(app,/result\.token/);
});
test('formulário transfere referência da campanha quando o cliente inicia o WhatsApp',()=>{
 const form=readFileSync(new URL('../../orcamento/index.html',import.meta.url),'utf8');
 assert.match(form,/dados\.utm_source/);
 assert.match(form,/dados\.utm_campaign/);
 assert.match(form,/ref='\+canal/);
 assert.match(form,/encodeURIComponent\(msg\)/);
});
