import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const page=readFileSync(new URL('../social-metas/index.html',import.meta.url),'utf8');
test('painel depende de sessao e metas reais do banco',()=>{
 assert.match(page,/auth\.getUser\(\)/);
 assert.match(page,/capisol_organic_goals/);
 assert.match(page,/capisol_organic_content_queue/);
 assert.match(page,/capisol_organic_sales/);
 assert.match(page,/https:\/\/eduardocoutinho2546-cell\.github\.io\/CAPISOL\/orcamento\//);
 assert.match(page,/utm_source/);
 assert.doesNotMatch(page,/service_role|WHATSAPP_TOKEN|sk-[a-zA-Z0-9]{20,}/);
});
test('não simula publicação nem disparo de WhatsApp no navegador',()=>{
 assert.doesNotMatch(page,/\.innerHTML\s*=/);
 assert.doesNotMatch(page,/api\.whatsapp|sendMessage\(|messages\/send/);
 assert.match(page,/prova de aceite/i);
 assert.match(page,/vendas? (não |n[aã]o |sem)/i);
});
test('script do painel tem sintaxe JavaScript válida',()=>{
 const start=page.lastIndexOf('<script>'),end=page.lastIndexOf('</script>');
 assert.ok(start>=0&&end>start);
 const dir=mkdtempSync(join(tmpdir(),'social-metas-'));
 try{const path=join(dir,'ui.js');writeFileSync(path,page.slice(start+8,end));
  const out=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  assert.equal(out.status,0,out.stderr)}
 finally{rmSync(dir,{recursive:true,force:true})}
});
test('navegação social vincula metas e os seis canais',()=>{
 const social=readFileSync(new URL('../social-rede/index.html',import.meta.url),'utf8');
 assert.match(social,/social-metas\//);
 for(const ch of ['instagram','facebook','tiktok','whatsapp','google','youtube'])assert.match(page,new RegExp(ch));
});