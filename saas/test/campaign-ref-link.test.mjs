import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const site=readFileSync(new URL('../../orcamento/index.html',import.meta.url),'utf8');
const sql=readFileSync(new URL('../../docs/sql/corrigir-duplicacao-atribuicao-20261026.sql',import.meta.url),'utf8');
test('pedido do formulário carrega origem/campanha ao WhatsApp apenas por clique voluntário',()=>{
 assert.match(site,/utm_source/);
 assert.match(site,/utm_campaign/);
 assert.match(site,/ref='\+canal\+'_'\+campanha/);
 assert.match(site,/encodeURIComponent\(msg\)/);
 assert.match(site,/dados\.autContato|autContato:true/);
});
test('única ponte de atribuição: capisol_proposals.lead_ref; limpar apenas camada redundante vazia',()=>{
 assert.match(sql,/ATRIBUICAO_EXPERIMENTAL_COM_DADOS_NAO_DESCARTAR/);
 assert.match(sql,/drop table if exists public\.capisol_atribuicao_propostas/);
 assert.match(sql,/drop function if exists public\.capisol_funil_campanhas/);
 assert.doesNotMatch(sql,/drop.*capisol_attribution_summary/);
 assert.doesNotMatch(sql,/drop.*capisol_proposals/);
});
