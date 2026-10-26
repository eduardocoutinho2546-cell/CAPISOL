import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODULES,MODULE_FAMILIES,SCALE_LEVELS,CATALOG_SUMMARY,getModule,listForIndustry,scaleCheck,readiness} from '../module-registry.mjs';
import {tenantMode,INDUSTRIES} from '../verticals.mjs';
test('240 módulos individualizados em 24 núcleos reais de especificação',()=>{
 assert.equal(MODULE_FAMILIES.length,24);
 assert.equal(MODULES.length,240);
 assert.equal(CATALOG_SUMMARY.moduleCount,240);
 assert.equal(new Set(MODULES.map(x=>x.id)).size,240);
 assert.equal(new Set(MODULES.map(x=>x.key)).size,240);
 assert.ok(MODULE_FAMILIES.every(f=>f.count===10));
 for(const m of MODULES){
  assert.ok(m.name.length>4);
  assert.ok(m.requiredRoles.length>0);
  assert.equal(m.status,'specified');
  assert.equal(m.automated,false);
  assert.equal(m.implementation,'not_connected');
  assert.equal(m.scope,'workspace');
  assert.equal(m.requiresEvidence,true);
 }
});
test('módulos cobrem agro, oficina, jornal, igreja, comércio e logística',()=>{
 for(const vertical of ['agriculture','mechanics','news_media','faith_nonprofit','commerce','logistics']){
  const list=listForIndustry(vertical);
  assert.ok(list.length>=10,vertical);
  assert.ok(list.some(m=>m.vertical===vertical));
 }
 assert.equal(getModule('crop.01').name,'Planejamento de safra');
 assert.equal(getModule('mechanics.01').name,'Recepção e triagem');
 assert.equal(getModule('faith.01').name,'Agenda de cultos e eventos');
 assert.equal(getModule('does_not_exist'),null);
 assert.equal(tenantMode({industry_code:'mechanics'}).industry,'mechanics');
 assert.ok(Object.hasOwn(INDUSTRIES,'news_media'));
});
test('escalas são dez e não declaram global pronto por seleção',()=>{
 assert.equal(SCALE_LEVELS.length,10);
 assert.deepEqual(SCALE_LEVELS.map(s=>s.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(scaleCheck('global').ready,false);
 assert.ok(scaleCheck('global').pending.includes('operacao_multimoeda_ou_multijurisdicao_nao_homologada'));
 assert.equal(scaleCheck('city_branches',{tenantRlsVerified:true,branches:1,localTaxRules:true}).ready,false);
 assert.equal(scaleCheck('city_branches',{tenantRlsVerified:true,branches:3,localTaxRules:true}).ready,true);
 assert.throws(()=>scaleCheck('multiverse'),/escala_invalida/);
});
test('capacidade só fica operacional com todos os sete resultados demonstrados',()=>{
 const m=getModule('inventory.01');
 assert.equal(readiness(m).operational,false);
 assert.deepEqual(readiness(m).missing,['owner','source','permissions','tests','integrated','realExecution','reviewed']);
 const r=readiness(m,{owner:true,source:true,permissions:true,tests:true,integrated:true,realExecution:true,reviewed:true});
 assert.equal(r.operational,true);
 assert.throws(()=>readiness({id:'wrong'}),/modulo_desconhecido/);
});
test('migration real protege operações por workspace, sem INSERT direto em ledger',()=>{
 const sql=readFileSync(new URL('../../docs/sql/office-modulos-multissetor-operacionais.sql',import.meta.url),'utf8');
 for(const t of ['capisol_org_units','capisol_stock_items','capisol_stock_moves','capisol_crop_cycles','capisol_crop_observations','capisol_work_orders','capisol_newsroom_stories','capisol_community_events']){
  assert.match(sql,new RegExp('alter table public\\.'+t+' enable row level security;'));
 }
 assert.match(sql,/foreign key\(workspace_id,org_unit_id\)/);
 assert.match(sql,/foreign key\(workspace_id,property_id\)/);
 assert.match(sql,/revoke all on public\.capisol_stock_moves from public,anon,authenticated/);
 assert.ok(!/grant insert on public\.capisol_stock_moves to authenticated/i.test(sql));
 assert.match(sql,/insufficient_stock/);
 assert.match(sql,/request_id_conflict/);
 assert.match(sql,/p_request uuid/);
});
test('agrônomo e veterinário exigidos no núcleo, não algoritmos autônomos',()=>{
 const c=MODULE_FAMILIES.find(x=>x.id==='crop');
 const l=MODULE_FAMILIES.find(x=>x.id==='livestock');
 assert.ok(c.roles.includes('Engenheiro agrônomo'));
 assert.ok(l.roles.includes('Médico veterinário'));
 assert.ok(MODULES.filter(x=>['health','tax','crop','livestock'].includes(x.family)).every(x=>x.risk==='professional_review'));
});
