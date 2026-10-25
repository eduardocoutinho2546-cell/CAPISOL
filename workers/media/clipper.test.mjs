import test from 'node:test';import assert from 'node:assert/strict';
import {renderPlan,processMedia} from './clipper.mjs';
const spec={source:'brutos/entrevista.mp4',root:'/srv/capisol/media',outputRoot:'/srv/capisol/exports',rightsConfirmed:true};
test('cortes validos em tres perfis sem executar',()=>{
 for(const profile of ['reels','square','youtube']){
  const plan=renderPlan({...spec,profile});
  assert.equal(plan.command,'ffmpeg');assert.ok(plan.args.includes('-vf'));
  assert.equal(processMedia(plan).executed,false);assert.equal(plan.profile,profile);
 }
});
test('nunca atravessar diretorio e nao operar sem direitos',()=>{
 assert.throws(()=>renderPlan({...spec,profile:'reels',source:'../../etc/passwd'}),/fora_da_pasta/);
 assert.throws(()=>renderPlan({...spec,profile:'reels',rightsConfirmed:false}),/direitos/);
 assert.throws(()=>renderPlan({...spec,profile:'reels',durationSec:1000000}),/janela/);
});
test('execucao exige aprovacao explicita de operador',()=>{
 const plan=renderPlan({...spec,profile:'reels'});
 assert.throws(()=>processMedia(plan,{execute:true}),/execucao_sem_aprovacao/);
});
