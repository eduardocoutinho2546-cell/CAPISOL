// CAPISOL | Radar comercial por evidências — sem scraping, disparos ou métricas inventadas.
export const TIPOS = Object.freeze(['parceiro','cliente','concorrente']);
export const FONTES = Object.freeze([
  'site_empresarial', 'cnpj_dados_abertos', 'indicacao_verificada',
  'contato_direto', 'diretorio_autorizado', 'edital_publico', 'biblioteca_anuncios'
]);
export const MUNICIPIOS_AC = Object.freeze([
  'Rio Branco','Bujari','Porto Acre','Senador Guiomard','Acrelândia',
  'Plácido de Castro','Sena Madureira','Xapuri','Brasiléia','Epitaciolândia',
  'Assis Brasil','Manoel Urbano','Tarauacá','Feijó','Cruzeiro do Sul',
  'Mâncio Lima','Rodrigues Alves','Porto Walter','Marechal Thaumaturgo',
  'Jordão','Santa Rosa do Purus','Capixaba'
]);
const normal = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const texto = (s, n=300) => String(s ?? '').trim().slice(0,n);
function dataValida(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const d=new Date(s+'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s;
}
export function urlPublica(s) {
  try {
    const u=new URL(s);
    const h=u.hostname.toLowerCase();
    return u.protocol==='https:' && !u.username && !u.password && !u.port &&
      h.includes('.') && h!=='localhost' && !h.endsWith('.local') &&
      !h.endsWith('.internal') && !h.endsWith('.localhost') &&
      !/^(\d{1,3}\.){3}\d{1,3}$/.test(h) && !h.includes(':');
  } catch { return false; }
}
export function validarRegistro(x) {
  const erros=[];
  if (!x || typeof x!=='object' || Array.isArray(x)) return ['registro_invalido'];
  if (!TIPOS.includes(x.tipo)) erros.push('tipo_invalido');
  if (texto(x.nome).length<3) erros.push('nome_obrigatorio');
  if (texto(x.municipio).length<3 || !['AC','RO'].includes(x.uf)) erros.push('territorio_invalido');
  if (!FONTES.includes(x.fonteTipo)) erros.push('origem_invalida');
  if (!urlPublica(x.fonteUrl)) erros.push('evidencia_url_publica_https_obrigatoria');
  if (!dataValida(x.observadoEm)) erros.push('data_invalida');
  if (!texto(x.evidencia,500)) erros.push('evidencia_literal_obrigatoria');
  if (x.verificado !== true) erros.push('fonte_nao_conferida');
  if (x.tipo==='concorrente' && x.fonteTipo==='biblioteca_anuncios' &&
      !/^(www\\.)?(facebook\\.com|transparency\\.google\\.com|adstransparency\\.google\\.com)$/i.test((()=>{try{return new URL(x.fonteUrl).hostname}catch{return ''}})()))
    erros.push('url_de_biblioteca_de_anuncios_nao_reconhecida');
  if (x.tipo==='concorrente' && (!texto(x.identificador) || x.fonteTipo!=='biblioteca_anuncios'))
    erros.push('anuncio_identificado_na_biblioteca_obrigatorio');
  if (x.tipo!=='concorrente' && x.fonteTipo==='biblioteca_anuncios')
    erros.push('anuncio_nao_e_lista_de_clientes');
  if (['google_maps_scraper','scraping_google_maps','google_maps_bulk'].includes(x.fonteTipo))
    erros.push('origem_maps_scraping_bloqueada');
  if (['roas','conversoes','vendasEstimadas','cac','ctr','lucroConcorrente'].some(k=>k in x))
    erros.push('metricas_de_terceiros_nao_comprovadas');
  if (x.fonteUrl && /(?:maps\.google\.|google\.com\/maps|google\.com\/search)/i.test(x.fonteUrl))
    erros.push('nao_persistir_conteudo_google_maps');
  return erros;
}
export function chaveRegistro(x) {
  // Chave estável para não criar o mesmo cartão em buscas repetidas.
  const id=[normal(x.tipo),normal(x.nome),normal(x.municipio),normal(x.uf)].join('|');
  let h=2166136261;
  for (let i=0;i<id.length;i++) { h^=id.charCodeAt(i); h=Math.imul(h,16777619); }
  return 'radar_'+(h>>>0).toString(16).padStart(8,'0');
}
export function pontuarRegistro(x) {
  const tipo=x?.tipo, cidade=normal(x?.municipio);
  if (!TIPOS.includes(tipo)) return {score:0,prioridade:'REVISAR',motivos:[]};
  const sinais=new Set(Array.isArray(x.sinais)?x.sinais:[]);
  let score=0; const motivos=[];
  const add=(ok,p,label)=>{if(ok){score+=p;motivos.push(label);}};
  add(x.uf==='AC',15,'Atuação no Acre');
  add(['rio branco','bujari','porto acre','senador guiomard'].includes(cidade),15,'Rota operacional próxima');
  if(tipo==='cliente'){
    add(sinais.has('consumo_diurno'),15,'Consumo diurno');
    add(sinais.has('conta_elevada'),15,'Conta energética expressiva');
    add(sinais.has('estrutura_apta'),15,'Viabilidade técnica preliminar');
    add(sinais.has('interesse_confirmado'),25,'Interesse declarado');
  } else if(tipo==='parceiro'){
    add(sinais.has('servico_complementar'),25,'Serviço complementar');
    add(sinais.has('cobertura_local'),15,'Cobertura operacional');
    add(sinais.has('certificacoes_verificadas'),25,'Habilitação comprovada');
    add(sinais.has('interesse_confirmado'),20,'Parceria sinalizada');
  } else {
    add(sinais.has('oferta_completa'),20,'Oferta detalhada');
    add(sinais.has('preco_com_escopo'),25,'Preço e escopo verificáveis');
    add(sinais.has('condicoes_financeiras'),15,'Financiamento explícito');
  }
  return {score:Math.min(score,100),prioridade:score>=65?'P1':score>=35?'P2':'P3',motivos,
    aviso:'Pontuação representa prioridade de pesquisa, não intenção de compra ou taxa de conversão.'};
}
export function montarCartao(x) {
  const erros=validarRegistro(x);
  if(erros.length) throw new Error(erros.join(', '));
  const classificacao=pontuarRegistro(x);
  return {
    tipo:x.tipo, nome:texto(x.nome,160), municipio:texto(x.municipio,100), uf:x.uf,
    segmento:texto(x.segmento,100), site:texto(x.site,300), telefoneComercial:texto(x.telefoneComercial,40),
    fonteTipo:x.fonteTipo, fonteUrl:x.fonteUrl, observadoEm:x.observadoEm,
    evidencia:texto(x.evidencia,500), identificador:texto(x.identificador,100),
    sinais:(Array.isArray(x.sinais)?x.sinais:[]).filter(s=>typeof s==='string').slice(0,12),
    verificado:true, score:classificacao.score, prioridade:classificacao.prioridade,
    motivos:classificacao.motivos, contatoAutorizado:false,
    status:'pesquisa_pendente_de_qualificacao_humana', id:chaveRegistro(x)
  };
}
export function leadParaFunil(c) {
  if(c?.tipo!=='cliente' || c?.status!=='pesquisa_pendente_de_qualificacao_humana')
    throw new Error('somente_cliente_verificado');
  return {
    nome:c.nome, fone:c.telefoneComercial || '', funil:'prospeccao', etapa:'Qualificar',
    nicho:c.segmento || 'Outro', origem:'Radar comercial | fonte empresarial verificada',
    criado:c.observadoEm, recebidoEm:new Date().toISOString(),
    municipio:c.municipio, uf:c.uf, site:c.site,
    fonte:c.fonteTipo, fonteUrl:c.fonteUrl, prioridade:c.prioridade,
    obs:c.evidencia, whatsappOptIn:false, lawfulBasis:null,
    statusContato:'aguardando_revisao_base_legal', contatoAutomatizado:false
  };
}
