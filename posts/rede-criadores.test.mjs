import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const html=readFileSync(new URL('../social-rede/index.html',import.meta.url),'utf8');
test('Painel exige login, lê rede e dados reais do Supabase',()=>{
 assert.match(html,/auth\.getUser\(\)/);
 assert.match(html,/capisol_social_network_nodes/);
 assert.match(html,/capisol_social_distribution/);
 assert.match(html,/rows\.length!==147/);
 assert.match(html,/permission_attested:true/);
 assert.match(html,/status:'verified'/);
 assert.match(html,/stage:'draft'/);
 assert.match(html,/stage:'published'/);
 assert.match(html,/evidence_url/);
 assert.match(html,/utm_campaign/);
 assert.doesNotMatch(html,/service_role|api[_-]?secret\s*=/i);
});
test('Script do painel passa node --check',()=>{
 const start=html.lastIndexOf('<script>'),end=html.lastIndexOf('</script>');
 assert.ok(start>=0&&end>start);
 const dir=mkdtempSync(join(tmpdir(),'rede147-'));
 try{const file=join(dir,'ui.js');writeFileSync(file,html.slice(start+'<script>'.length,end));
  const s=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(s.status,0,s.stderr)}
 finally{rmSync(dir,{recursive:true,force:true})}
});
test('Social Media principal aponta ao gestor 147',()=>{
 const ui=readFileSync(new URL('./posts-ia-ui.js',import.meta.url),'utf8');
 assert.match(ui,/Rede de criadores · 147 posições/);
 assert.match(ui,/CAPISOL\/social-rede\//);
});
