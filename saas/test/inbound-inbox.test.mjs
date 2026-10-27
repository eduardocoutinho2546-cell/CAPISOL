import test from 'node:test';
import assert from 'node:assert/strict';
import {inboundRows,sourceRows,validInboundPhone,PHONE_OFFICIAL} from '../inbound-inbox.mjs';

test('caixa mostra somente site_ com telefone válido que a RPC filtrou por consentimento',()=>{
 const rows=inboundRows({inbound_site:[
  {id:'site_123',fone:'5568992490347',nome:'Teste'},
  {id:'cnae_import_321',fone:'5568992490347',nome:'Contatos públicos'},
  {id:'site_456',fone:'invalid'}
 ]});
 assert.equal(rows.length,1);
 assert.equal(rows[0].id,'site_123');
 assert.equal(validInboundPhone('68 99249-0347'),'5568992490347');
 assert.equal(validInboundPhone('68992490347'),'5568992490347');
 assert.equal(validInboundPhone('00000000000'),null);
 assert.equal(PHONE_OFFICIAL,'5568992490347');
});
test('origenes não são confundidas com pessoas interessadas e ordenam por volume',()=>{
 assert.deepEqual(sourceRows({lead_origins:{Site:2,'Receita Federal':100,Google:10}}),
 [['Receita Federal',100],['Google',10],['Site',2]]);
});
test('sem pedidos: caixa vazia, sem objetos inesperados',()=>{
 assert.deepEqual(inboundRows({}),[]);
 assert.deepEqual(inboundRows(null),[]);
});

test('aceita telefone nacional do formulário com 10 ou 11 dígitos sem alterar origem',()=>{
 const x=inboundRows({inbound_site:[{id:'site_teste',fone:'68992490347'}]});
 assert.equal(x.length,1);
 assert.equal(validInboundPhone(x[0].fone),'5568992490347');
});
