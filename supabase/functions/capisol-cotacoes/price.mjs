// Simulação determinística, SEM parecer de tributação ou concessão de desconto.
const N=(x,name)=>{const n=Number(x);if(!Number.isFinite(n)||n<0)throw Error("campo_invalido_"+name);return n};
const R=(n)=>Math.round((n+Number.EPSILON)*100)/100;
export function simular({preco,kit,engenharia,insumos,instalacao,deslocamento,comissaoPct,impostoPct,stonePct=0,risco=0,desconto=0,pisoMargem=0,configuracaoTributariaAprovada=false,cotacaoValidada=false}){
 const entries={preco,kit,engenharia,insumos,instalacao,deslocamento,comissaoPct,impostoPct,stonePct,risco,desconto,pisoMargem};
 const v=Object.fromEntries(Object.entries(entries).map(([k,n])=>[k,N(n,k)]));
 if(v.comissaoPct>100||v.impostoPct>100||v.stonePct>100)throw Error("taxa_superior_100");
 if(v.desconto>v.preco)throw Error("desconto_maior_preco");
 const liquido=v.preco-v.desconto;
 // Pressuposição simplificada: imposto e comissão sobre o preço bruto; contador precisa parametrizar conforme documentos fiscais.
 const custos=v.kit+v.engenharia+v.insumos+v.instalacao+v.deslocamento+v.risco+liquido*(v.comissaoPct+v.impostoPct+v.stonePct)/100;
 const contribuicao=R(liquido-custos);
 const bloqueios=[];
 if(v.desconto>500)bloqueios.push("DESCONTO_MAIOR_QUE_500");
 if(contribuicao<v.pisoMargem)bloqueios.push("CONTRIBUICAO_ABAIXO_PISO");
 if(!cotacaoValidada)bloqueios.push("COTACAO_NAO_VALIDADA");
 if(!configuracaoTributariaAprovada)bloqueios.push("BASE_TRIBUTARIA_PENDENTE");
 return {precoCliente:R(liquido),custosEstimados:R(custos),contribuicao,percentual:liquido?R(contribuicao/liquido*100):0,bloqueios,liberadoParaEnvio:false,observacao:"Prévia interna; a operação de intermediação, repasse e tributação devem ser validados pelo contador."};
}

