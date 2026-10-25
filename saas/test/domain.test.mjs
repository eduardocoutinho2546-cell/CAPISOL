import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {reviewSector,summarize,validateFiscal} from '../domain.mjs';
const sectors=JSON.parse(readFileSync(new URL('../../biblioteca/setores-operacionais.json',import.meta.url))).sectors;
test('all 72 sectors have distinct executable review contracts',()=>{
 assert.equal(sectors.length,72);assert.equal(new Set(sectors.map(x=>x.sector)).size,72);assert.equal(new Set(sectors.map(x=>x.routine)).size,72);
 for(const s of sectors){assert.ok(s.inputs.length>=2);assert.equal(s.steps.length,3);assert.equal(reviewSector(s,{}).ready,false);
 assert.equal(reviewSector(s,Object.fromEntries(s.inputs.map(x=>[x,'evidência']))).ready,true);}
});
test('dashboard separates contracted MRR, pipeline and realized sales',()=>{
 const m=summarize({tasks:[{status:'active',due_date:'2026-01-01'}],subscriptions:[{status:'active',monthly_value:150},{status:'draft',monthly_value:900}],proposals:[{status:'won',price:2000,estimated_cost:1800},{status:'draft',price:1000,estimated_cost:1200}]},'2026-10-25');
 assert.equal(m.mrr,150);assert.equal(m.pipeline,1000);assert.equal(m.contribution,200);assert.equal(m.overdue,1);assert.equal(m.losses,1);
});
test('fiscal preflight rejects cross-company and inconsistent amounts',()=>{
 const errors=validateFiscal({amount:10,description:'Limpeza',payload:{cnpj_prestador:'00000000000000',valor_servico:12}},'66360677000149');
 assert.ok(errors.some(x=>x.includes('CNPJ do prestador')));assert.ok(errors.some(x=>x.includes('Valor do serviço')));
});
