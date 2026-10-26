import test from 'node:test';import assert from 'node:assert/strict';
import {DEMO_SCENARIOS,seedDemo,applyDemoAction,demoIndicators,industryCatalogue,scaleRequirements,MODULES,SCALE_LEVELS} from '../demo-model.mjs';
test('sete cenários sintéticos, catálogo 240, escalas 10',()=>{
 assert.equal(DEMO_SCENARIOS.length,7);assert.equal(MODULES.length,240);assert.equal(SCALE_LEVELS.length,10);
 assert.equal(new Set(DEMO_SCENARIOS.map(s=>s.id)).size,7);
 assert.ok(DEMO_SCENARIOS.every(s=>s.company.includes('Demonstração')||s.company.includes('Exemplo')));
 for(const s of DEMO_SCENARIOS){const data=seedDemo(s.id);assert.ok(industryCatalogue(s.id).pertinent>0);assert.equal(data.id,s.id);}
 assert.throws(()=>seedDemo('inexistente'),/cenario_desconhecido/);
});
test('estoque, saídas e erro não alteram estado original',()=>{
 const first=seedDemo('mechanics'),sku=first.stock[0],entered=applyDemoAction(first,{type:'stock',id:sku.id,direction:'in',qty:5});
 assert.equal(entered.stock[0].qty,sku.qty+5);assert.equal(first.stock[0].qty,sku.qty);
 const second=applyDemoAction(entered,{type:'stock',id:sku.id,direction:'out',qty:3});
 assert.equal(second.stock[0].qty,sku.qty+2);
 assert.throws(()=>applyDemoAction(second,{type:'stock',id:sku.id,direction:'out',qty:999999}),/estoque_insuficiente/);
 assert.throws(()=>applyDemoAction(second,{type:'stock',id:sku.id,direction:'in',qty:-2}),/quantidade_invalida/);
 assert.throws(()=>applyDemoAction(second,{type:'stock',id:'wrong',direction:'in',qty:1}),/produto_inexistente/);
});
test('safra avançada e documento fictício não criam recomendação agrícola',()=>{
 const first=seedDemo('agriculture'),x=first.crops[0],next=applyDemoAction(first,{type:'crop',id:x.id});
 assert.equal(next.crops[0].stage,'crescimento');assert.ok(next.history[0].detail.includes('não é recomendação'));
 const later=applyDemoAction(next,{type:'crop',id:x.id});assert.equal(later.crops[0].stage,'colheita');
});
test('jornal e igreja só mudam estados de exemplo',()=>{
 let newsroom=seedDemo('news_media');
 const first=newsroom.stories[0].status;
 newsroom=applyDemoAction(newsroom,{type:'story',id:newsroom.stories[0].id});
 assert.notEqual(newsroom.stories[0].status,first);assert.ok(newsroom.history[0].detail.includes('não publicada'));
 let church=seedDemo('faith_nonprofit');
 church=applyDemoAction(church,{type:'event',id:church.events[0].id});assert.equal(church.events[0].status,'approved');
});
test('caixa é simulado, não transação',()=>{
 const initial=seedDemo('commerce'),next=applyDemoAction(initial,{type:'cash',direction:'in',amount:100});
 assert.equal(demoIndicators(next).balance,demoIndicators(initial).balance+100);
 assert.throws(()=>applyDemoAction(next,{type:'cash',direction:'in',amount:1.5}),/valor_invalido/);
});
test('escala global não é apresentada como homologada',()=>{
 const check=scaleRequirements('global');assert.equal(check.ready,false);
 assert.ok(check.pending.length>0);assert.ok(check.pending.includes('operacao_multimoeda_ou_multijurisdicao_nao_homologada'));
});
