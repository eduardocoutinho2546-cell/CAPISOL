// Sala de demonstração: dados fictícios somente na memória do navegador.
// Nunca importar este módulo no backend de produção ou misturá-lo a workspaces reais.
import {MODULES,MODULE_FAMILIES,SCALE_LEVELS,listForIndustry,scaleCheck} from './module-registry.mjs';
export {MODULES,MODULE_FAMILIES,SCALE_LEVELS};
export const DEMO_SCENARIOS=Object.freeze([
 {id:'solar',label:'Energia solar',company:'CAPISOL Solar — Exemplo',unit:'Rio Branco / AC',activity:'solar',core:['finance','sales','field'],stock:[['Módulo fotovoltaico 550 W',24],['Conector MC4',75]],orders:[['Instalação comercial 12 kWp','triage']],cash:{in:26500,out:17300}},
 {id:'agriculture',label:'Produção rural',company:'Fazenda Horizonte — Demonstração',unit:'Propriedade Modelo / AC',activity:'agriculture',stock:[['Fertilizante genérico (sacos)',90],['Sementes de milho (sacos)',50]],crops:[['Milho','plantado',8.5],['Mandioca','crescimento',5.0]],orders:[['Revisar calendário de irrigação','review']],cash:{in:48000,out:32100}},
 {id:'mechanics',label:'Oficina mecânica',company:'AutoCenter Modelo — Demonstração',unit:'Oficina Central',activity:'mechanics',stock:[['Filtro de óleo',36],['Pastilha de freio (jogo)',20]],orders:[['Revisão preventiva','triage'],['Troca de componentes','review']],cash:{in:34700,out:22100}},
 {id:'commerce',label:'Comércio / loja',company:'Loja Avenida — Demonstração',unit:'Filial Centro',activity:'commerce',stock:[['Produto A',48],['Produto B',27]],orders:[['Reposição de prateleiras','triage']],cash:{in:78500,out:52800}},
 {id:'news_media',label:'Jornal / mídia',company:'Jornal Regional — Demonstração',unit:'Redação Centro',activity:'news_media',stories:[['Economia local e empreendedorismo','factcheck'],['Entrevista com cooperativa','editing']],cash:{in:18100,out:13700}},
 {id:'faith_nonprofit',label:'Igreja / associação',company:'Centro Comunitário — Demonstração',unit:'Sede Social',activity:'faith_nonprofit',events:[['Mutirão solidário','review'],['Encontro comunitário','approved']],stock:[['Cestas de alimentos',62]],cash:{in:9500,out:6700}},
 {id:'services',label:'Serviços em geral',company:'Serviços Integrados — Demonstração',unit:'Unidade Centro',activity:'services',orders:[['Visita técnica programada','triage']],cash:{in:26500,out:18400}}
]);
export function seedDemo(key){
 const s=DEMO_SCENARIOS.find(x=>x.id===key);
 if(!s)throw Error('cenario_desconhecido');
 return {id:s.id,company:s.company,unit:s.unit,activity:s.activity,
  stock:(s.stock||[]).map(([name,qty],i)=>({id:'sku-'+i,name,qty})),
  crops:(s.crops||[]).map(([name,stage,hectares],i)=>({id:'crop-'+i,name,stage,hectares})),
  orders:(s.orders||[]).map(([title,status],i)=>({id:'order-'+i,title,status})),
  stories:(s.stories||[]).map(([title,status],i)=>({id:'story-'+i,title,status})),
  events:(s.events||[]).map(([title,status],i)=>({id:'event-'+i,title,status})),
  cash:{...s.cash},history:[]};
}
export function applyDemoAction(state,action){
 if(!state||!action||typeof action!=='object')throw Error('acao_invalida');
 const copy=structuredClone(state);
 if(action.type==='stock'){
  const item=copy.stock.find(x=>x.id===action.id);
  if(!item)throw Error('produto_inexistente');
  const qty=Number(action.qty);
  if(!Number.isInteger(qty)||qty<1||qty>1000000)throw Error('quantidade_invalida');
  if(!['in','out'].includes(action.direction))throw Error('tipo_movimentacao_invalido');
  const next=item.qty+(action.direction==='in'?qty:-qty);
  if(next<0)throw Error('estoque_insuficiente');
  item.qty=next;copy.history.push({event:'Movimentação de estoque simulada',detail:`${item.name}: ${action.direction==='in'?'+':'-'}${qty}`});
 }else if(action.type==='order'){
  const item=copy.orders.find(x=>x.id===action.id);if(!item)throw Error('os_nao_encontrada');
  if(!['triage','approved','in_progress','review','done'].includes(action.status))throw Error('status_invalido');
  item.status=action.status;copy.history.push({event:'OS simulada',detail:`${item.title} → ${item.status}`});
 }else if(action.type==='crop'){
  const item=copy.crops.find(x=>x.id===action.id);if(!item)throw Error('safra_nao_encontrada');
  const sequence=['planejado','plantado','crescimento','colheita','concluido'];
  const current=sequence.indexOf(item.stage);
  if(current<0||current===sequence.length-1)throw Error('fase_sem_proxima_etapa');
  item.stage=sequence[current+1];copy.history.push({event:'Fase de cultura simulada',detail:`${item.name} → ${item.stage} (não é recomendação agronômica)`});
 }else if(action.type==='story'){
  const item=copy.stories.find(x=>x.id===action.id);if(!item)throw Error('pauta_nao_encontrada');
  const sequence=['pitch','investigating','factcheck','editing','review','approved'];
  const current=sequence.indexOf(item.status);
  if(current<0||current===sequence.length-1)throw Error('pauta_concluida');
  item.status=sequence[current+1];copy.history.push({event:'Pauta simulada',detail:`${item.title} → ${item.status}; não publicada`});
 }else if(action.type==='event'){
  const item=copy.events.find(x=>x.id===action.id);if(!item)throw Error('evento_nao_encontrado');
  if(item.status==='approved')throw Error('evento_ja_aprovado');
  item.status='approved';copy.history.push({event:'Evento de exemplo',detail:`${item.title} → aprovado (não divulgado)`});
 }else if(action.type==='cash'){
  if(!['in','out'].includes(action.direction)||!Number.isInteger(action.amount)||action.amount<=0||action.amount>1000000)throw Error('valor_invalido');
  copy.cash[action.direction]+=action.amount;
  copy.history.push({event:'Lançamento financeiro simulado',detail:`${action.direction==='in'?'Entrada':'Saída'}: R$ ${action.amount}`});
 }else throw Error('acao_nao_suportada');
 return copy;
}
export function demoIndicators(state){
 return {balance:state.cash.in-state.cash.out,receipts:state.cash.in,expenses:state.cash.out,
  stockItems:state.stock.length,stockUnits:state.stock.reduce((sum,x)=>sum+x.qty,0),
  openedOrders:state.orders.filter(x=>x.status!=='done').length,
  crops:state.crops.length,
  stories:state.stories.length,
  events:state.events.length};
}
export function industryCatalogue(activity){
 const related=listForIndustry(activity);
 return {related,total:MODULES.length,pertinent:related.length};
}
export function scaleRequirements(id){
 return scaleCheck(id,{tenantRlsVerified:false,restoredBackup:false,localTaxRules:false,branches:1,currencies:['BRL'],jurisdictions:['BR']});
}
