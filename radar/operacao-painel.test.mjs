import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('Painel de operacao le evidencias reais com login e RLS',()=>{
 const src=readFileSync(new URL('../operacao/index.html',import.meta.url),'utf8');
 assert.match(src,/auth\.getUser\(\)/);
 assert.match(src,/from\('capisol_flow_audit_state'\)/);
 assert.match(src,/order\('workflow_id'/);
 assert.doesNotMatch(src,/service_role|sk-[A-Za-z0-9]{18,}/);
 assert.match(src,/textContent/);
 assert.doesNotMatch(src,/\.innerHTML\s*=/);
 assert.match(src,/A rotina de auditoria/);
});
test('JavaScript do painel e sintaticamente valido',()=>{
 const html=readFileSync(new URL('../operacao/index.html',import.meta.url),'utf8');
 const start=html.lastIndexOf('<script>'),end=html.lastIndexOf('</script>');
 assert.ok(start>=0&&end>start);
 const tmp=mkdtempSync(join(tmpdir(),'capisol-operacao-'));
 try{const f=join(tmp,'app.js');writeFileSync(f,html.slice(start+8,end));const x=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});assert.equal(x.status,0,x.stderr)}
 finally{rmSync(tmp,{recursive:true,force:true})}
});