import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPlan,makePost,verifyFile} from './studio-social.mjs';
test('motion de instrução gera plano próprio sem promessas inventadas',()=>{
 const plan=buildPlan({title:'Limpeza de painéis solares',idea:'A sujeira pode afetar a geração. Peça uma vistoria técnica.',mode:'motion',profile:'reels'});
 assert.equal(plan.duration,12);assert.equal(plan.size.height,960);
 assert.equal(plan.caption.includes('A sujeira'),true);
 assert.equal(plan.reference,'');
 assert.doesNotMatch(plan.caption,/conta zerada|garantida/i);
});
test('link válido gera briefing honesto, não finge ler página',()=>{
 const p=buildPlan({title:'Ideia para Reels',reference:'https://www.youtube.com/watch?v=abc',mode:'motion'});
 assert.equal(p.reference,'https://www.youtube.com/watch?v=abc');
 assert.match(p.warning,/não foi analisado/);
 assert.equal(p.frames[0],'Ideia para Reels');
});
test('recusa esquema perigoso, traversal e links locais',()=>{
 for(const u of ['http://example.com','javascript:alert(1)','https://localhost/interno','https://127.0.0.1/test','https://user:pass@example.com']){
   assert.throws(()=>buildPlan({title:'Teste de conteúdo',reference:u}),/endereço|HTTPS/i);
 }
});
test('vídeo enviado exige direitos e formato aceito',()=>{
 assert.throws(()=>buildPlan({title:'Depoimento',idea:'Fale da CAPISOL',mode:'fala',hasVideo:true,rights:false}),/usar o vídeo/i);
 assert.throws(()=>buildPlan({title:'Depoimento',idea:'Fale da CAPISOL',mode:'fala',hasVideo:false}),/gravação/i);
 assert.throws(()=>verifyFile({type:'application/pdf',size:100}),/MP4/);
 assert.throws(()=>verifyFile({type:'video/mp4',size:90*1024*1024}),/80 MB/);
 assert.doesNotThrow(()=>verifyFile({type:'video/webm',size:24000}));
});
test('post gerado fica para aprovar com vídeo privado e checklist',()=>{
 const p=buildPlan({title:'Conheça a CAPISOL',idea:'Veja como funciona',mode:'motion'});
 const id='932af54a-420f-414d-a6b5-4f1c3fe964ba';
 const post=makePost(p,id,'posts-social/'+id+'/final.webm');
 assert.equal(post.status,'Para aprovar');assert.equal(post.marca.every(m=>m[1]===false),true);
 assert.equal(post.video,'posts-social/'+id+'/final.webm');
 assert.equal(post.geracao.revisaoHumana,true);
 assert.throws(()=>makePost(p,id,'../caminho.webm'),/Caminho/);
});
test('integração do estúdio aparece nos scripts existentes',()=>{
 const ui=fs.readFileSync(new URL('./posts-ia-ui.js',import.meta.url),'utf8'),bridge=fs.readFileSync(new URL('./posts-ia-bridge.js',import.meta.url),'utf8');
 assert.match(ui,/data-poia-studio/);assert.match(ui,/data-socialpath/);
 assert.match(bridge,/saveSocial:/);assert.match(bridge,/signMedia:/);
 assert.ok(bridge.includes("from('arquivos').upload"));
 assert.ok(bridge.includes("from('docs').insert"));
});
