// Capacidades compartilhadas — perfis por ramo, sem duplicar bancos por cliente.
export const INDUSTRIES = Object.freeze({
 solar:{label:'Energia solar',modules:['rural','media','content','engineering','finance','crm']},
 agriculture:{label:'Agronegócio e propriedades rurais',modules:['rural','media','content','finance','crm']},
 commerce:{label:'Comércio e varejo',modules:['media','content','finance','crm','inventory']},
 services:{label:'Prestação de serviços',modules:['media','content','finance','crm']},
 manufacturing:{label:'Indústria e manufatura',modules:['media','content','finance','crm','inventory','quality']},
 logistics:{label:'Logística e transportes',modules:['media','content','finance','crm','inventory']},
 construction:{label:'Construção e obras',modules:['media','content','finance','crm','engineering']},
 hospitality:{label:'Hotelaria e turismo',modules:['media','content','finance','crm']},
 education:{label:'Educação e treinamento',modules:['media','content','finance','crm']},
 health:{label:'Saúde e bem-estar (com revisão profissional)',modules:['media','content','finance','crm']}
});
export function tenantMode(workspace){
 const industry=typeof workspace?.industry_code==='string' && INDUSTRIES[workspace.industry_code]?workspace.industry_code:'services';
 const kind=['company','rural_producer','cooperative','association'].includes(workspace?.kind)?workspace.kind:'company';
 return {industry,kind,label:INDUSTRIES[industry].label,rural:kind==='rural_producer'||kind==='cooperative'||industry==='agriculture'||industry==='solar'};
}
export const REGIONAL_UF=['AC','AM','RO','RR','PA','AP','TO','MT','MS','GO','DF','SP','RJ','MG','ES','PR','SC','RS','BA','PE','CE','RN','PB','AL','SE','PI','MA'];
export function validateRural(kind, data){
 const errors=[];
 if(!['producer','property'].includes(kind))return ['tipo_invalido'];
 if(!data || typeof data!=='object')return ['dados_invalidos'];
 for(const k of kind==='producer'?['display_name','municipality']:['name','municipality','producer_id'])if(!String(data[k]??'').trim())errors.push(k+'_obrigatorio');
 if(data.state_code&&!REGIONAL_UF.includes(data.state_code))errors.push('uf_invalida');
 if(data.document_last4&&!/^\d{4}$/.test(data.document_last4))errors.push('identificador_deve_ter_so_4_digitos');
 if(data.registry_last4&&!/^[A-Za-z\d]{4}$/.test(data.registry_last4))errors.push('registro_deve_ter_so_4_caracteres');
 if(kind==='property'&&data.hectares!==undefined&&(!Number.isFinite(Number(data.hectares))||Number(data.hectares)<0||Number(data.hectares)>1e8))errors.push('area_invalida');
 return errors;
}
export const CONTENT_PILLARS=Object.freeze([
 'Bastidores e cultura','Dúvidas frequentes','Educação do mercado','Estudos de caso','Processos e qualidade',
 'Experiência do cliente','Sustentabilidade','Finanças e eficiência','Erros e aprendizados','Comunidade local',
 'Perguntas a especialistas','Inovação e tendências'
]);
export const FORMATS=Object.freeze([
 ['Explicação curta','9:16','reels_tiktok_shorts'],
 ['Entrevista e cortes','9:16','reels_tiktok_shorts'],
 ['Artigo e bastidores','1:1','linkedin_x'],
 ['Vídeo aprofundado','16:9','youtube'],
 ['Carrossel ou infográfico','4:5','instagram_linkedin']
]);
export function generateEditorialTracks(workspaceId){
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(String(workspaceId??'')))throw Error('workspace_invalido');
 return CONTENT_PILLARS.flatMap((pillar,i)=>FORMATS.map(([format,aspect,distribution],j)=>({
  workspace_id:workspaceId,cluster_no:i+1,strand_no:j+1,label:`${pillar} · ${format}`,
  platform:'internal',status:'planned',public_account_authorized:false,
  suggested_aspect:aspect,distribution_goal:distribution
 })));
}
export function publishingGate({approved,accountAuthorized,rightsConfirmed,platformSupported,originalityReviewed}){
 const missing=Object.entries({approved,accountAuthorized,rightsConfirmed,platformSupported,originalityReviewed})
  .filter(([,v])=>v!==true).map(([k])=>k);
 return {mayPrepare:missing.length===0,mayPublishAutomatically:false,missing,
 reason:'Publicação exige API oficial, consentimento, permissões e confirmação independente de retorno.'};
}
