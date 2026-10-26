// CAPISOL - preço de mercado aprovado pelos sócios, contribuições financeiras e ponto de equilíbrio.
// Origem: Gestão v10.2, despesas fixas PREVISTAS 11.780 mensais (não conciliadas).
export const FIXO_HISTORICO_V10=11780;
const num=x=>x!==""&&x!==null&&x!==undefined&&Number.isFinite(Number(x))?Number(x):null;
const cent=x=>Math.round((x+Number.EPSILON)*100)/100;
export function selecionarMercado(registros,{kwh=1000,cidade="Rio Branco",hoje=new Date().toISOString().slice(0,10)}={}){
 const wanted=Number(kwh),base=new Date(hoje+"T12:00:00Z");if(!Number.isFinite(wanted)||wanted<=0||Number.isNaN(base.getTime()))throw Error("FAIXA_OU_DATA_INVALIDA");
 const last=new Map();
 for(const item of registros||[]){
  const a=item.data||item,preco=num(a.preco),geracao=num(a.consumoKwh),dt=new Date(String(a.dataPesquisa||"")+"T12:00:00Z");
  if(!a.empresa||!a.fonte||!a.cidade||!Number.isFinite(preco)||preco<=0||!geracao||Number.isNaN(dt.getTime()))continue;
  const age=(base.getTime()-dt.getTime())/86400000;
  if(age<0||age>45||Math.abs(geracao-wanted)/wanted>.12||a.cidade.toLowerCase().trim()!==cidade.toLowerCase().trim())continue;
  if(a.instaladoCompleto!==true||a.onGrid!==true||a.temBateria===true||a.mesmaModalidade!==true)continue;
  const key=a.empresa.trim().toLowerCase();
  const old=last.get(key),ts=item.updated_at?new Date(item.updated_at).getTime():null;
  // Havendo timestamps reais da base, a versão efetivamente mais recente vence.
  const newer=!old||dt>old.dt||(dt.getTime()===old.dt.getTime()&&
   (Number.isFinite(ts)&&Number.isFinite(old.ts)?ts>old.ts:old.ts===null));
  if(newer)last.set(key,{empresa:a.empresa,preco,dt,origem:a.fonte,ts});
 }
 const itens=[...last.values()].sort((a,b)=>a.preco-b.preco);
 const ps=itens.map(x=>x.preco);
 const n=ps.length;
 const media=n?cent(ps.reduce((a,b)=>a+b,0)/n):null;
 const mediana=n?cent(n%2?ps[(n-1)/2]:(ps[n/2-1]+ps[n/2])/2):null;
 return {amostras:n,media: n>=3?media:null,mediana:n>=3?mediana:null,
  insuficiente:n<3,referenciaInformativa:media,itens};
}
export function avaliarPreco(i){
 const preco=num(i.preco),kit=num(i.kit),obra=num(i.obra),comissao=num(i.comissaoPct),aliq=num(i.impostoPct),risco=num(i.riscoPct);
 const base=String(i.baseFiscal||"");
 if([preco,kit,obra,comissao,aliq,risco].some(v=>v===null)||!["propria","total"].includes(base))
   return {status:"CUSTOS_OU_REGIME_PENDENTES",preco,contribuicao:null,lucroGerencial:null,restaPagarFixos:null,vendasNecessarias:null};
 if(preco<=0||kit<0||obra<0||[comissao,aliq,risco].some(x=>x<0||x>=100)||comissao+aliq+risco>=100)
  throw Error("PARAMETROS_INVALIDOS");
 const baseTributo=base==="total"?preco:Math.max(0,preco-kit);
 const tax=cent(baseTributo*aliq/100),comm=cent(preco*comissao/100);
 const reserva=cent(Math.max(0,preco-kit)*risco/100);
 const contribuicao=cent(preco-kit-obra-tax-comm-reserva);
 const fixo=num(i.fixoMensal),fechada=num(i.contribuicaoMesJaRealizada);
 const restaPagarFixos=fixo===null?null:cent(Math.max(0,fixo-Math.max(0,fechada||0)));
 const lucroGerencial=fixo===null?null:cent(contribuicao+Math.max(0,fechada||0)-fixo);
 const vendasNecessarias=restaPagarFixos===null?null:contribuicao>0?Math.ceil(restaPagarFixos/contribuicao):null;
 const nDiario=Number.isFinite(Number(i.diasMes))&&Number(i.diasMes)>0?Number(i.diasMes):30;
 return {status:contribuicao>0?"MARGEM_POSITIVA_A_CONFERIR":"SEM_MARGEM",preco,kit,obra,
  comissao:comm,impostos:tax,reserva,contribuicao,fixoMensal:fixo,custoFixoDiario:fixo===null?null:cent(fixo/nDiario),
  restaPagarFixos,lucroGerencial,vendasNecessarias};
}
export function pisoComercial(i){
 const kit=num(i.kit),obra=num(i.obra),c=num(i.comissaoPct),t=num(i.impostoPct),r=num(i.riscoPct),objetivo=num(i.contribuicaoMinima);
 if([kit,obra,c,t,r,objetivo].some(v=>v===null)||!["total","propria"].includes(i.baseFiscal))return null;
 const k=(i.baseFiscal==="total")?(1-r/100):(1-(t+r)/100);
 const denominador=1-(c+t+r)/100;
 if(denominador<=0||kit<0||obra<0||objetivo<0)throw Error("PISO_INVALIDO");
 return Math.ceil((kit*k+obra+objetivo)/denominador*100)/100;
}
export function orientarPreco(mercado,precoMinimo){
 if(!mercado||mercado.insuficiente||mercado.mediana===null)return {estado:"AGUARDANDO_PRECOS_LOCAIS",sugerido:null};
 if(precoMinimo===null)return {estado:"AGUARDANDO_CUSTOS_REAIS",sugerido:null,mercado:mercado.mediana};
 if(precoMinimo>mercado.mediana)return {estado:"MERCADO_ABAIXO_DO_PISO",sugerido:null,mercado:mercado.mediana,piso:precoMinimo};
 return {estado:"PENDENTE_APROVACAO_SOCIOS",sugerido:mercado.mediana,mercado:mercado.mediana,piso:precoMinimo};
}
