import test from 'node:test';import assert from 'node:assert/strict';
import {INDUSTRIES,CONTENT_PILLARS,FORMATS,tenantMode,validateRural,generateEditorialTracks,publishingGate,sectorApplicability} from '../verticals.mjs';
import {contextPack,planModel,tokensEstimated} from '../ai-routing.mjs';
const wid='11111111-1111-4111-8111-111111111111';
test('CAPISOL e agro usam núcleo comum sem duplicar tenant',()=>{
 assert.equal(tenantMode({industry_code:'solar'}).industry,'solar');
 assert.equal(tenantMode({industry_code:'agriculture',kind:'rural_producer'}).rural,true);
 assert.equal(tenantMode({industry_code:'commerce'}).rural,false);
 assert.ok(Object.keys(INDUSTRIES).length>=8);
});
test('valida cadastro rural sem numero integral de documento',()=>{
 assert.deepEqual(validateRural('producer',{display_name:'Ana Rural',municipality:'Rio Branco',state_code:'AC',document_last4:'1234'}),[]);
 assert.ok(validateRural('producer',{display_name:'',municipality:'',document_last4:'12345678901'}).includes('identificador_deve_ter_so_4_digitos'));
 assert.ok(validateRural('property',{name:'Fazenda Modelo',municipality:'Rio Branco',producer_id:'1',hectares:-1}).includes('area_invalida'));
});
test('12 pilares e cinco vertentes viram 60 pautas internas sem perfis falsos',()=>{
 const rows=generateEditorialTracks(wid);
 assert.equal(CONTENT_PILLARS.length,12);assert.equal(FORMATS.length,5);assert.equal(rows.length,60);
 assert.equal(new Set(rows.map(x=>x.cluster_no+'|'+x.strand_no)).size,60);
 assert.ok(rows.every(x=>x.platform==='internal'&&!x.public_account_authorized && x.status==='planned'));
 assert.throws(()=>generateEditorialTracks('invalid'),/workspace_invalido/);
});
test('marketing bloqueia publicação automática inclusive se conta for autorizada',()=>{
 const ready=publishingGate({approved:true,accountAuthorized:true,rightsConfirmed:true,platformSupported:true,originalityReviewed:true});
 assert.equal(ready.mayPrepare,true);assert.equal(ready.mayPublishAutomatically,false);
 assert.equal(publishingGate({approved:false}).mayPrepare,false);
});
test('roteador respeita provedor e limites; não consome APIs sem configuração',()=>{
 assert.equal(planModel('development_agent',{enabledProviders:['antigravity']}).provider,'antigravity');
 assert.equal(planModel('legal_draft',{enabledProviders:['openai']}).ok,false);
 assert.equal(planModel('research',{enabledProviders:['google'],tenantScoped:false}).ok,false);
 assert.equal(planModel('marketing_copy',{enabledProviders:['openai'],budgetToken:2000}).canCallApi,false);
});
test('compactar conhecimento prioriza evidência, não aumenta janela de tokens',()=>{
 const p=contextPack([{id:'alto',text:'A'.repeat(200),score:10},{id:'baixo',text:'B'.repeat(800),score:1}],{maxEstimatedTokens:100,maxChunks:2});
 assert.equal(p.chunks.length,1);assert.equal(p.chunks[0].id,'alto');
 assert.ok(p.dropped.includes('baixo'));assert.ok(tokensEstimated('x')>0);
 assert.throws(()=>contextPack([],{maxEstimatedTokens:10}),/limite_de_contexto/);
});
test('SQL exige workspace RLS e não abre cadastro público multiempresa',async()=>{
 const sql=await import('node:fs').then(fs=>fs.readFileSync(new URL('../../docs/sql/office-multiempresa-rural-editorial.sql',import.meta.url),'utf8'));
 assert.match(sql,/alter table public\.capisol_rural_producers enable row level security/);
 assert.match(sql,/foreign key\(workspace_id,producer_id\)/);
 assert.match(sql,/public\.capisol_workspace_role\(workspace_id\)/);
 assert.match(sql,/revoke all on public\.capisol_content_tracks from public,anon,authenticated/);
 assert.ok(!/grant insert on public\.capisol_workspaces to anon/.test(sql));
});

test('72 setores permanecem navegáveis e classificados por ramo',()=>{
 assert.equal(sectorApplicability(23,{industry:'solar'}).level,'core');
 assert.equal(sectorApplicability(23,{industry:'commerce'}).level,'optional');
 assert.equal(sectorApplicability(58,{industry:'agriculture'}).level,'core');
 assert.equal(sectorApplicability(58,{industry:'services'}).level,'optional');
 assert.throws(()=>sectorApplicability(73,{industry:'services'}),/setor_invalido/);
});

import {CHANNELS,validatePublicationDraft} from '../channel-capabilities.mjs';
test('8 canais reais nao sao conectados por simples cadastro de plataforma',()=>{
 assert.equal(Object.keys(CHANNELS).length,8);
 assert.ok(Object.values(CHANNELS).every(c=>c.enabled===false));
});
test('nenhum rascunho é publicado sem OAuth, direitos e revisão',()=>{
 const draft={workspaceId:'tenant-a',platform:'tiktok',text:'Conteúdo da empresa',originalRightsConfirmed:true,humanApproved:true};
 const unauthorized=validatePublicationDraft(draft,{workspaceId:'tenant-b',officialAccount:true,oauthValid:true,apiPermissionApproved:true});
 assert.ok(unauthorized.problems.includes('official_account_not_verified_for_tenant'));
 const allowed=validatePublicationDraft(draft,{workspaceId:'tenant-a',officialAccount:true,oauthValid:true,apiPermissionApproved:true,providerAuditComplete:true});
 assert.equal(allowed.readyForAuthorizedAdapter,true);assert.equal(allowed.hasRealPublisher,false);
});
