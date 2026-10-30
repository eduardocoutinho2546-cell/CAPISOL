import test from "node:test";
import assert from "node:assert/strict";
import {SETORES,modeloEmpresaHoje} from "./empresa-hoje.mjs";
import {validarPrevia1166,solicitarRevisaoParametro} from "./parametros-editor.mjs";
test("Empresa hoje mostra 15 setores e fonte sem dado",()=>{
 assert.equal(SETORES.length,15);
 const cards=modeloEmpresaHoje([{setor:"financas",indicador:100,fonte:"documento 42",dataFonte:"2026-10-29"}]);
 assert.equal(cards.length,15);
 assert.equal(cards.find(x=>x.setor==="financas").fonte,"documento 42");
 assert.equal(cards.find(x=>x.setor==="estrategia").indicador,"sem dado");
});
test("prévia exige 1166 células e sem preço inventado",()=>{
 assert.throws(()=>validarPrevia1166([{ibge:"1200401",kwh:400}]),/1166/);
 const rows=Array.from({length:1166},(_,i)=>({
  ibge:String(1200000+Math.floor(i/53)),kwh:400+(i%53)*50,
  preco_novo:"sem dado",preco_vigente:"sem dado",margem_6:"sem dado",margem_efetiva:"sem dado"}));
 assert.equal(validarPrevia1166(rows).semDado,1166);
});
test("não grava parâmetro se faltarem cotações reais",async()=>{
 const rows=Array.from({length:1166},(_,i)=>({
  ibge:String(1200000+Math.floor(i/53)),kwh:400+(i%53)*50,
  preco_novo:"sem dado",preco_vigente:"sem dado",margem_6:"sem dado",margem_efetiva:"sem dado"}));
 await assert.rejects(solicitarRevisaoParametro({rpc:()=>{throw Error("não pode chamar");}},
  {p_motivo:"teste",p_fonte:"citação"},rows),/INCOMPLETA/);
});
