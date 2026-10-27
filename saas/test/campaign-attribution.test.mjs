import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campaignRows} from '../campaign-attribution.mjs';

test('campanha report só recebe valores confirmados pelo banco',()=>{
 const rows=campaignRows({campanhas:[{origem:'google_business_profile',campanha:'planejamento',recebidos:2,propostas:1,vendas:0,faturamento:0},{origem:'instagram',campanha:'ig_video',recebidos:1,propostas:1,vendas:1,faturamento:18000}]});
 assert.equal(rows.length,2);
 assert.equal(rows[0].faturamento,0);
 assert.equal(rows[1].vendas,1);
 assert.equal(rows[1].faturamento,18000);
 assert.deepEqual(campaignRows({}),[]);
});
test('planilha de contatos importados nunca é declarada lead inbound no relatório',()=>{
 const sql=readFileSync(new URL('../../docs/sql/funil-campanhas-propostas-20261026.sql',import.meta.url),'utf8');
 assert.match(sql,/d\.data->>'origem'='Site' and d\.data->>'autContato'='true'/);
 assert.match(sql,/WhatsApp \(API oficial\)/);
 assert.match(sql,/p\.status='won'/);
 assert.match(sql,/from public\.docs d/);
 assert.match(sql,/foreign key\(lead_col,lead_id\) references public\.docs\(col,id\)/);
 assert.match(sql,/proposta_id uuid primary key/);
 assert.match(sql,/capisol_workspace_role/);
 assert.match(sql,/capisol_proposals p where p\.id=proposta_id and p\.workspace_id=workspace_id/);
});
test('formulário preserva campanha ao clicar WhatsApp e telefone nacional aparece na inbox',()=>{
 const html=readFileSync(new URL('../../orcamento/index.html',import.meta.url),'utf8');
 const sql=readFileSync(new URL('../../docs/sql/office-inbox-fone-br-20261026.sql',import.meta.url),'utf8');
 assert.match(html,/ref='\+canal\+'_'\+referencia/);
 assert.match(html,/utm_source/);
 assert.match(sql,/between 10 and 13/);
});
