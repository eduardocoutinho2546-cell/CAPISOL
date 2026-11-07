import test from 'node:test';
import assert from 'node:assert/strict';
import {idEncaminhamento,vendaElegivel,criarCartaoAdministrativo,resumirVendas,FONTE_CARTAO} from '../inteligencia/fluxo-core.mjs';
const sale={id:'VS_123e4567-e89b-12d3-a456-426614174000',data:{cliente:'Cliente de Teste',valorVendido:22500,statusComercial:'vendida',conferido:true}};
test('ID determinístico evita cartões diferentes na repetição',()=>{
 assert.equal(idEncaminhamento(sale.id),idEncaminhamento(sale.id));
 assert.throws(()=>idEncaminhamento('nao-vale'));
});
test('não encaminha cotação, venda sem confirmação ou valor inválido',()=>{
 assert.equal(vendaElegivel({...sale,data:{...sale.data,statusComercial:'rascunho'}}),false);
 assert.equal(vendaElegivel({...sale,data:{...sale.data,conferido:false}}),false);
 assert.equal(vendaElegivel({...sale,data:{...sale.data,valorVendido:0}}),false);
 assert.throws(()=>criarCartaoAdministrativo({...sale,data:{...sale.data,conferido:false}},'uid'));
});
test('cartão operacional não registra financeiro automaticamente',()=>{
 const c=criarCartaoAdministrativo(sale,'uid','2026-11-07T00:00:00.000Z');
 assert.equal(c.col,'leads');assert.equal(c.data.funil,'operacional');
 assert.equal(c.data.etapa,'A fazer');assert.equal(c.data.fonte,FONTE_CARTAO);
 assert.equal(c.data.refVenda,sale.id);assert.equal(c.data.criadoPor,'uid');
 assert.ok(!('valor' in c.data));assert.ok(!('recebido' in c.data));
});
test('fila identifica pendências sem duplicar as já encaminhadas',()=>{
 assert.deepEqual(resumirVendas([sale],[idEncaminhamento(sale.id)]),{pendentes:0,encaminhadas:1,invalidas:0,total:1});
 assert.deepEqual(resumirVendas([sale],[]),{pendentes:1,encaminhadas:0,invalidas:0,total:1});
});
