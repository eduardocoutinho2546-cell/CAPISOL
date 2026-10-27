import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('qualificação: proposta exige lead consentido, sem usar prospecção importada',()=>{
 const sql=source('docs/sql/capisol_atribuicao_lead_proposta_20261026.sql');
 assert.match(sql,/capisol_check_proposal_lead/);
 assert.match(sql,/autContato/);
 assert.match(sql,/iniciou a conversa/);
 assert.match(sql,/CREATE TRIGGER capisol_proposals_lead_guard/);
 assert.match(sql,/ATTRIBUTION_ACCESS_DENIED/);
 assert.match(sql,/capisol_workspace_role/);
});
test('funil: apenas won entra como receita declarada de proposta, separado de dinheiro recebido',()=>{
 const sql=source('docs/sql/capisol_atribuicao_lead_proposta_20261026.sql');
 assert.match(sql,/FILTER\(WHERE p\.status='won'\)/);
 assert.match(sql,/nao equivale a valor recebido em conta/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.capisol_attribution_summary/);
});
test('tela: exibe origem, campanha e ligação opcional entre lead e proposta',()=>{
 const app=source('saas/app.mjs');
 const inbox=source('saas/inbound-inbox.mjs');
 assert.match(app,/data\.attribution/);
 assert.match(app,/\['lead_ref','Pedido de origem/);
 assert.match(inbox,/Campanhas → pedidos → propostas → vendas/);
});
test('caixa de entrada não descarta telefone DDD nacional',()=>{
 assert.match(source('docs/sql/capisol_inbox_telefone_nacional_20261026.sql'),/between 10 and 13/);
});
