export const RADAR_STAGES=Object.freeze({
 identificado:'Identificado (sem contato)',
 em_analise:'Em análise interna',
 contatado:'Contato realizado (registro manual)',
 documentos_pendentes:'Documentação solicitada',
 descartado:'Descartado'
});
export const RADAR_CLASSIFICATIONS=Object.freeze({
 prestador_potencial:'Prestador potencial',
 fornecedor_potencial:'Fornecedor potencial',
 concorrente_potencial:'Concorrente / possível parceiro'
});
export function groupRadar(rows=[]){
 const result={total:0,ac:0,ro:0,contacted:0,approved:0,pending:0};
 for(const x of rows){result.total++;if(x.uf==='AC')result.ac++;if(x.uf==='RO')result.ro++;
  if(['contatado','documentos_pendentes'].includes(x.stage))result.contacted++;
  if(x.qualified===true&&x.relationship_confirmed===true)result.approved++;
  else if(x.stage!=='descartado')result.pending++;
 }
 return result;
}
export function filterRadar(rows,{uf='',stage='',query=''}={}){
 if(!Array.isArray(rows))throw Error('lista_invalida');
 if(uf&&!['AC','RO'].includes(uf))throw Error('estado_invalido');
 if(stage&&!Object.hasOwn(RADAR_STAGES,stage))throw Error('etapa_invalida');
 const q=String(query).trim().toLocaleLowerCase('pt-BR').slice(0,100);
 return rows.filter(x=>(!uf||x.uf===uf)&&(!stage||x.stage===stage)&&
 (!q||[x.name,x.municipality,x.category,x.classification,...(x.services||[])].join(' ').toLocaleLowerCase('pt-BR').includes(q)));
}
export function reviewInput({stage,reason}={}){
 const next=String(stage||'').trim(),note=String(reason||'').trim();
 if(!Object.hasOwn(RADAR_STAGES,next))throw Error('Etapa inválida');
 if(note.length<5||note.length>1200)throw Error('Informe uma evidência de revisão com 5 a 1200 caracteres');
 return {stage:next,reason:note};
}
