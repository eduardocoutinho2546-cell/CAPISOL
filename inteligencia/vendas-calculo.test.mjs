import test from "node:test";import assert from "node:assert/strict";
import {precoReferencia1000,simularVenda,validarCadastro} from "./vendas-calculo.mjs";
test("R$ 19.000 é gravado separadamente da meta de R$ 18.900",()=>{
 assert.equal(precoReferencia1000,18900);
 const v=simularVenda({precoTabela:18900,valorVendido:19000});
 assert.equal(v.valorVendido,19000);assert.equal(v.precoTabela,18900);
 assert.equal(v.diferenca,100);assert.equal(v.contribuicao,null);
 assert.equal(v.status,"PENDENTE_CUSTOS");
});
test("não fabrica lucro sem custo real e alíquotas",()=>{
 assert.equal(simularVenda({precoTabela:18900,valorVendido:19000,kitReal:13321.45,custosDiretos:2454.4285714}).contribuicao,null);
});
test("margem da venda calculada depois de custos, taxas e reserva; fixo só no rateio",()=>{
 const d={precoTabela:18900,valorVendido:19000,kitReal:13321.45,custosDiretos:2454.4285714,
  comissaoPct:3,tributosPct:6,reservasPct:3,baseTributaria:"servicos",fixoMensal:7638.3333333,vendasPlanejadasMes:5};
 const r=simularVenda(d);
 assert.equal(r.contribuicao,2143.05);assert.equal(r.resultadoAposRateio,615.38);
 assert.equal(r.status,"SIMULACAO_A_CONFERIR");
});
test("5% de comissão reduz margem e deixa valor vendido livre",()=>{
 const r=simularVenda({precoTabela:18900,valorVendido:19000,kitReal:13321.45,custosDiretos:2454.4285714,
 comissaoPct:5,tributosPct:6,reservasPct:3,baseTributaria:"servicos"});
 assert.equal(r.contribuicao,1763.05);
});
test("registro exige confirmação de venda real, sem fechar com dados ausentes",()=>{
 const d={cliente:"Cliente de teste",vendedor:"Vendedor",dataVenda:"2026-10-26",consumoKwh:"1000",valorVendido:"19000",precoTabela:"18900"};
 assert.throws(()=>validarCadastro(d),/CONFIRME/);
 const result=validarCadastro({...d,conferido:true});
 assert.equal(result.valorVendido,19000);assert.equal(result.precoTabela,18900);
 assert.equal(result.diferencaTabela,100);assert.equal(result.situacaoFinanceira,"PENDENTE_CUSTOS");
 assert.equal(result.fiscalHomologado,false);
});
test("não permite kit maior que valor de venda nem custos inválidos",()=>{
 assert.throws(()=>simularVenda({valorVendido:19000,kitReal:21000,custosDiretos:0,comissaoPct:3,tributosPct:6,reservasPct:3,baseTributaria:"servicos"}),/KIT_NAO_PODE/);
});
