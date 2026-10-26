import test from "node:test";import assert from "node:assert/strict";
import {FIXO_HISTORICO_V10,selecionarMercado,avaliarPreco,pisoComercial,orientarPreco} from "./mercado-motor.mjs";
const hoje="2026-10-26";
const sample=(company,price,date="2026-10-25",kwh=1000)=>({data:{empresa:company,preco:price,consumoKwh:kwh,cidade:"Rio Branco",dataPesquisa:date,fonte:"https://example.com/validado",instaladoCompleto:true,onGrid:true,temBateria:false,mesmaModalidade:true}});
test("exige três concorrentes diferentes e dados comparáveis; dados de teste não são preços de mercado",()=>{
 assert.equal(selecionarMercado([sample("A",18000),sample("B",19000)],{hoje}).mediana,null);
 const result=selecionarMercado([sample("A",18000),sample("B",19000),sample("C",21000),sample("B",19500)],{hoje});
 assert.equal(result.amostras,3);assert.equal(result.mediana,19500);
 assert.equal(selecionarMercado([sample("A",18000),sample("B",19000),sample("C",21000)],{hoje,kwh:2000}).amostras,0);
});
test("exclui preços velhos, fora da cidade e sem escopo turnkey",()=>{
 const old=sample("A",10000,"2026-08-01");
 const far=sample("B",11000);far.data.cidade="São Paulo";
 const kit=sample("C",12000);kit.data.instaladoCompleto=false;
 assert.equal(selecionarMercado([old,far,kit],{hoje}).amostras,0);
});
const cost={kit:13321.45,obra:2454.4285714,comissaoPct:5,impostoPct:6,riscoPct:3,baseFiscal:"propria",fixoMensal:FIXO_HISTORICO_V10,contribuicaoMesJaRealizada:0};
test("cenários com 5% comissão e despesas v10.2 mostram caixa a cobrir, não lucro fictício",()=>{
 const a=avaliarPreco({...cost,preco:18500}),b=avaliarPreco({...cost,preco:19000});
 assert.equal(a.contribuicao,1333.05);assert.equal(a.vendasNecessarias,9);
 assert.equal(b.contribuicao,1763.05);assert.equal(b.vendasNecessarias,7);
 assert.equal(b.custoFixoDiario,392.67);
 assert.equal(b.lucroGerencial,-10016.95);
});
test("piso comercial considera base tributária serviços e permite comparar com mercado",()=>{
 const floor=pisoComercial({...cost,contribuicaoMinima:2500});
 assert.ok(floor>19000 && floor<22000);
 const verified=selecionarMercado([sample("A",18500),sample("B",19000),sample("C",19500)],{hoje});
 assert.equal(orientarPreco(verified,floor).estado,"MERCADO_ABAIXO_DO_PISO");
 assert.equal(orientarPreco(verified,null).estado,"AGUARDANDO_CUSTOS_REAIS");
});
test("ausência de kit/fiscal não calcula lucro, mesmo se tabela de mercado aparecer",()=>{
 const r=avaliarPreco({preco:19000,fixoMensal:11780,comissaoPct:5});
 assert.equal(r.contribuicao,null);assert.equal(r.vendasNecessarias,null);
});
