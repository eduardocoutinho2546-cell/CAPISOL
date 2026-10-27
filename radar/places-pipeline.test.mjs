import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('Places nunca envia diretamente para o funil',()=>{
 const html=fs.readFileSync(new URL('../prospectar/index.html',import.meta.url),'utf8');
 assert.match(html,/col:'places_consultas'/);
 assert.doesNotMatch(html,/insert\(\{col:'leads'/);
 assert.match(html,/Importação em massa desativada/);
 assert.match(html,/PENDENTE_SEGUNDA_FONTE/);
});
test('verificacao dupla usa sessao autenticada e nao copia dados Google',()=>{
 const html=fs.readFileSync(new URL('./verificar.html',import.meta.url),'utf8');
 assert.match(html,/auth\.getUser/);
 assert.match(html,/functions\.invoke\('google-places'/);
 assert.match(html,/normalizarDuplaValidacao/);
 assert.match(html,/consultouNestaSessao/);
 const marker='<script type="module">';
 const start=html.indexOf(marker),end=html.lastIndexOf('</script>');
 assert.ok(start>=0&&end>start);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'capisol-places-'));
 try{
  const f=path.join(dir,'ui.mjs');fs.writeFileSync(f,html.slice(start+marker.length,end));
  const result=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
