// Fluxo de duas pontes: Google Places para consulta efemera + fonte empresarial independente.
// Nao persistir dados derivados de Maps alem de placeId permitido; nao concluir inexistencia de empresa sem sede.
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isDate = s => ISO.test(s||'') && !Number.isNaN(Date.parse(s+'T00:00:00Z')) &&
  new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const PUBLIC = s => {try{const u=new URL(s);return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password&&!u.port&& !/(^localhost$|\.local$)/i.test(u.hostname)&& !/^(\d+\.){3}\d+$/.test(u.hostname)}catch{return false}};
export const ESTABELECIMENTO=Object.freeze(['proprio','alugado','terceiro_autorizado','sem_sede','multiplas_unidades','nao_verificado']);
export function avaliarDuplaValidacao(v){
 const x=v||{}, reasons=[];
 if(!['encontrado','nao_encontrado'].includes(x.placesStatus))reasons.push('consulta_places_pendente');
 if(x.placesStatus==='encontrado' && !/^[A-Za-z0-9_-]{8,300}$/.test(String(x.placeId||'')))reasons.push('place_id_ausente');
 if(!isDate(x.placesConsultadoEm))reasons.push('data_consulta_places_invalida');
 if(x.fonteIndependenteStatus!=='confirmado')reasons.push('fonte_empresarial_independente_nao_confirmada');
 if(!PUBLIC(x.fonteIndependenteUrl) || /(?:google\.com|google\.com\.br|googleapis\.com|maps\.google\.)/i.test(x.fonteIndependenteUrl||''))reasons.push('fonte_independente_obrigatoria');
 if(!isDate(x.fonteConferidaEm))reasons.push('data_fonte_independente_invalida');
 if(!ESTABELECIMENTO.includes(x.tipoEstabelecimento))reasons.push('situacao_imovel_pendente');
 // Mesmo "sem sede" pode ter deposito, filial, cobertura de terceiro ou ser cliente de manutencao.
 const sinalImovel=['proprio','alugado','terceiro_autorizado','multiplas_unidades'].includes(x.tipoEstabelecimento);
 return {
   completa:reasons.length===0,pendencias:reasons,
   localParaInstalacaoConfirmado:sinalImovel && x.imovelDisponivel===true,
   proximaEtapa:reasons.length?'VALIDAR_FONTES':'QUALIFICACAO_CONSUMO_E_IMOVEL',
   alertaImovel:x.tipoEstabelecimento==='sem_sede'?'Sem sede informada não é desqualificação automática; verificar unidade consumidora e autorização do imóvel.':
    'Aptidão técnica, titularidade e autorização ainda exigem vistoria.'
 };
}
export function normalizarDuplaValidacao(v){
 const r=avaliarDuplaValidacao(v);
 return {
  placesStatus:v.placesStatus,placeId:v.placesStatus==='encontrado'?v.placeId:'',placesConsultadoEm:v.placesConsultadoEm,
  fonteIndependenteStatus:v.fonteIndependenteStatus,fonteIndependenteUrl:v.fonteIndependenteUrl,
  fonteConferidaEm:v.fonteConferidaEm,tipoEstabelecimento:v.tipoEstabelecimento,
  imovelDisponivel:v.imovelDisponivel===true,completa:r.completa,pendencias:r.pendencias,
  localParaInstalacaoConfirmado:r.localParaInstalacaoConfirmado
 };
}
