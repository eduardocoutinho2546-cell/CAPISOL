import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RADAR_STAGES,RADAR_CLASSIFICATIONS,groupRadar,filterRadar,reviewInput} from '../partner-radar.mjs';
test('estágios sem parceiro automático, com fontes públicas',()=>{
 const doc=JSON.parse(readFileSync(new URL('../../data/radar-prestadores-ac-ro-20261026.json',import.meta.url),'utf8'));
 assert.equal(doc.entries.length,14);
 assert.ok(doc.entries.every(x=>x.relationship_confirmed===false&&x.qualification==='pendente'&&x.contact_status==='nao_contatado'));
 assert.ok(doc.entries.every(x=>/^https:\/\//.test(x.source_url)&&x.source_checked_at==='2026-10-26'));
 assert.ok(doc.entries.every(x=>['AC','RO'].includes(x.uf)&&Object.hasOwn(RADAR_CLASSIFICATIONS,x.classification)));
});
test('contabilização separa candidatos de contratos',()=>{
 const rows=[{uf:'AC',stage:'identificado',relationship_confirmed:false,qualified:false},{uf:'RO',stage:'contatado',relationship_confirmed:false,qualified:false},
 {uf:'RO',stage:'descartado',relationship_confirmed:false,qualified:false}];
 const result=groupRadar(rows);assert.equal(result.total,3);assert.equal(result.ac,1);assert.equal(result.ro,2);
 assert.equal(result.contacted,1);assert.equal(result.approved,0);assert.equal(result.pending,2);
});
test('filtro regional e de serviço não toca banco',()=>{
 const doc=JSON.parse(readFileSync(new URL('../../data/radar-prestadores-ac-ro-20261026.json',import.meta.url),'utf8'));
 const rows=doc.entries.map(x=>({...x,stage:'identificado'}));
 assert.equal(filterRadar(rows,{uf:'AC'}).length,5);assert.equal(filterRadar(rows,{uf:'RO'}).length,9);
 assert.ok(filterRadar(rows,{query:'limpeza'}).length>=1);
 assert.equal(filterRadar(rows,{stage:'contatado'}).length,0);
 assert.throws(()=>filterRadar(rows,{uf:'SP'}),/estado_invalido/);
});
test('revisão exige observação e etapa válida',()=>{
 assert.deepEqual(reviewInput({stage:'em_analise',reason:'Solicitar documento técnico'}),{stage:'em_analise',reason:'Solicitar documento técnico'});
 assert.throws(()=>reviewInput({stage:'homologado',reason:'cinco'}),/Etapa inválida/);
 assert.throws(()=>reviewInput({stage:'contatado',reason:'x'}),/evidência/);
});
