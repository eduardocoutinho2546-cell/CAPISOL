// CAPISOL: resultado por venda. Histórico de preços/tributos nunca alterado por novos kits.
const finite=(v)=>v!==""&&v!==null&&v!==undefined&&Number.isFinite(Number(v));
const number=v=>Number(v);
export const precoReferencia1000=18900;
export function simularVenda(d){
 const vendido=number(d.valorVendido);
 if(!finite(d.valorVendido)||vendido<=0)throw Error("VALOR_VENDIDO_OBRIGATORIO");
 const base=finite(d.precoTabela)&&number(d.precoTabela)>0?number(d.precoTabela):null;
 const diferenca=base===null?null:+(vendido-base).toFixed(2);
 const saida={valorVendido:vendido,precoTabela:base,diferenca,status:"PENDENTE_CUSTOS",contribuicao:null,resultadoAposRateio:null};
 if(!["kitReal","custosDiretos","comissaoPct","tributosPct","reservasPct"].every(k=>finite(d[k])))return saida;
 const kit=number(d.kitReal),diretos=number(d.custosDiretos),comissao=number(d.comissaoPct),tributos=number(d.tributosPct),reserva=number(d.reservasPct);
 if(kit<=0||diretos<0||[comissao,tributos,reserva].some(x=>x<0||x>40))throw Error("PREMISSAS_FINANCEIRAS_INVALIDAS");
 if(kit>=vendido)throw Error("KIT_NAO_PODE_SUPERAR_O_PRECO_VENDIDO");
 if(!["servicos","total"].includes(d.baseTributaria))return saida;
 const services=vendido-kit;
 const comissaoValor=vendido*comissao/100;
 const tributosValor=(d.baseTributaria==="total"?vendido:services)*tributos/100;
 const reservaValor=services*reserva/100;
 const contribuicao=+(vendido-kit-diretos-comissaoValor-tributosValor-reservaValor).toFixed(2);
 saida.status="SIMULACAO_A_CONFERIR";
 Object.assign(saida,{kit,diretos,services,comissaoValor:+comissaoValor.toFixed(2),tributosValor:+tributosValor.toFixed(2),reservaValor:+reservaValor.toFixed(2),contribuicao});
 if(finite(d.fixoMensal)&&finite(d.vendasPlanejadasMes)&&number(d.vendasPlanejadasMes)>0&&number(d.fixoMensal)>=0)
  saida.resultadoAposRateio=+(contribuicao-number(d.fixoMensal)/number(d.vendasPlanejadasMes)).toFixed(2);
 return saida;
}
export function validarCadastro(d){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.dataVenda||""))throw Error("DATA_INVALIDA");
 if(String(d.cliente||"").trim().length<2||String(d.cliente||"").length>100)throw Error("CLIENTE_OBRIGATORIO");
 if(String(d.vendedor||"").trim().length<2||String(d.vendedor||"").length>70)throw Error("VENDEDOR_OBRIGATORIO");
 if(!finite(d.consumoKwh)||Number(d.consumoKwh)<100||Number(d.consumoKwh)>20000)throw Error("CONSUMO_INVALIDO");
 if(d.conferido!==true)throw Error("CONFIRME_QUE_A_VENDA_OCORREU");
 const total=simularVenda(d);
 return {...d,cliente:d.cliente.trim(),vendedor:d.vendedor.trim(),dataVenda:d.dataVenda,consumoKwh:Number(d.consumoKwh),precoTabela:total.precoTabela,valorVendido:total.valorVendido,
  diferencaTabela:total.diferenca,contribuicaoSimulada:total.contribuicao,resultadoRateadoSimulado:total.resultadoAposRateio,
  situacaoFinanceira:total.status,statusComercial:"vendida",origem:"lancamento_manual",fiscalHomologado:false,registradoEm:new Date().toISOString()};
}
