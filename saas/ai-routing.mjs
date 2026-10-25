// Orquestração planejada: seleção local. NÃO cria chaves nem amplia limites do provedor.
export const PROVIDERS=Object.freeze({
 openai:{label:'GPT',tasks:['marketing_copy','customer_service','summarize'],enabledByDefault:false},
 anthropic:{label:'Claude',tasks:['legal_draft','code_review','long_document'],enabledByDefault:false},
 google:{label:'Gemini',tasks:['visual_analysis','research','document_analysis'],enabledByDefault:false},
 antigravity:{label:'Antigravity',tasks:['development_agent'],enabledByDefault:false,mode:'developer_only'}
});
export const TASK_ROUTE=Object.freeze({
 marketing_copy:'openai',customer_service:'openai',summarize:'openai',
 legal_draft:'anthropic',code_review:'anthropic',long_document:'anthropic',
 visual_analysis:'google',research:'google',document_analysis:'google',
 development_agent:'antigravity'
});
export function tokensEstimated(text){return Math.ceil(new TextEncoder().encode(String(text??'')).length/3);}
// Estimativa conservadora de bytes, NÃO substitui tokenização do modelo.
export function contextPack(chunks,{maxEstimatedTokens=3000,maxChunks=8}={}){
 if(!Number.isSafeInteger(maxEstimatedTokens)||maxEstimatedTokens<100||maxEstimatedTokens>500000)throw Error('limite_de_contexto_invalido');
 if(!Array.isArray(chunks)||chunks.length>10000)throw Error('chunks_invalidos');
 if(!Number.isSafeInteger(maxChunks)||maxChunks<1||maxChunks>100)throw Error('max_chunks_invalidos');
 const usable=chunks.filter(x=>x && typeof x.text==='string' && typeof x.id==='string'
  && /^[a-zA-Z0-9:_-]{1,120}$/.test(x.id) && x.text.length<=200000)
  .sort((a,b)=>(b.score??0)-(a.score??0)).slice(0,Math.max(maxChunks*4,10));
 const packed=[],dropped=[];let used=0;
 for(const c of usable){
  const estimate=tokensEstimated(c.text);
  if(packed.length<maxChunks && used+estimate<=maxEstimatedTokens){packed.push({id:c.id,text:c.text,estimatedTokens:estimate});used+=estimate;}
  else dropped.push(c.id);
 }
 return {chunks:packed,dropped,estimatedTokens:used,limit:maxEstimatedTokens,
   warning:'A estimativa não amplia a janela real do provedor; aplicar tokenizador do modelo antes da API.'};
}
export function planModel(task,{enabledProviders=[],budgetToken=2000,allowedSpendCents=0,tenantScoped=true}={}){
 if(!Object.hasOwn(TASK_ROUTE,task))return {ok:false,reason:'task_unknown'};
 const provider=TASK_ROUTE[task];
 if(!tenantScoped)return {ok:false,reason:'tenant_scope_required'};
 if(!enabledProviders.includes(provider))return {ok:false,reason:'provider_not_connected',provider};
 if(!Number.isSafeInteger(budgetToken)||budgetToken<200||budgetToken>1000000)return {ok:false,reason:'token_budget_invalid'};
 if(!Number.isSafeInteger(allowedSpendCents)||allowedSpendCents<0)return {ok:false,reason:'spend_budget_invalid'};
 return {ok:true,provider,task,budgetToken,allowedSpendCents,canCallApi:false,
  next:'Conector autenticado com segredo server-side, quotas e auditoria antes de habilitar chamadas reais.'};
}
