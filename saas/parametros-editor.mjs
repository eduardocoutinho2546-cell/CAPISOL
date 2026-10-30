// Adaptador sem privilégios: deve receber client Supabase com JWT da PWA autenticada.
// Nunca usar service_role no browser. Aprovação sempre no RPC de segundo sócio.
export function validarPrevia1166(linhas){
 if(!Array.isArray(linhas)||linhas.length!==1166)throw Error("PREVIA_1166_OBRIGATORIA");
 const chaves=new Set();
 const municipios=new Map();
 for(const x of linhas){
  const id=String(x.ibge)+":"+String(x.kwh);
  if(chaves.has(id))throw Error("PREVIA_DUPLICADA");
  chaves.add(id);
  const faixa=Number(x.kwh);
  if(!/^12\d{5}$/.test(String(x.ibge))||!Number.isInteger(faixa)||faixa<400||faixa>3000||(faixa-400)%50!==0)
   throw Error("MUNICIPIO_OU_FAIXA_INVALIDA");
  if(!municipios.has(String(x.ibge)))municipios.set(String(x.ibge),new Set());
  municipios.get(String(x.ibge)).add(faixa);
  if(!["preco_novo","preco_vigente","margem_6","margem_efetiva"].every(k=>k in x))
   throw Error("PREVIA_CAMPOS_FALTANDO");
 }
 if(municipios.size!==22||[...municipios.values()].some(v=>v.size!==53))
  throw Error("MATRIZ_22x53_INCOMPLETA");
 return {total:linhas.length,semDado:linhas.filter(x=>x.preco_novo==="sem dado").length,
  abaixoPiso:linhas.filter(x=>x.abaixo_piso===true).length};
}
export async function solicitarRevisaoParametro(client,pedido,previsualizacao){
 // Prévia obrigatória na UI. Backend deverá recalcular antes da aprovação.
 const operational=new Set(["belenergy.intervalo_horas","belenergy.baixar_pdf","pdf.retencao_dias","proposta.validade_max_dias"]);
 const isOperational=operational.has(pedido?.p_chave);
 const resumo=isOperational?{total:0,semDado:0,abaixoPiso:0}:validarPrevia1166(previsualizacao);
 if(resumo.semDado>0)throw Error("PREVIA_INCOMPLETA_SEM_COTACOES");
 if(!client||typeof client.rpc!=="function")throw Error("CLIENTE_AUTENTICADO_AUSENTE");
 if(!pedido||!pedido.p_motivo||!pedido.p_fonte)throw Error("JUSTIFICATIVA_OBRIGATORIA");
 const {data,error}=await client.rpc("capisol_parametro_propor",pedido);
 if(error)throw Error("ALTERACAO_NAO_AUTORIZADA_OU_INDISPONIVEL");
 return {id:data,estado:"PENDENTE_SEGUNDO_SOCIO",abaixoPiso:resumo.abaixoPiso};
}
export async function aprovarSegundoSocio(client,id){
 if(!client||typeof client.rpc!=="function")throw Error("CLIENTE_AUTENTICADO_AUSENTE");
 const {data,error}=await client.rpc("capisol_parametro_aprovar",{p_parametro:id});
 if(error||data!==true)throw Error("APROVACAO_NAO_CONCLUIDA");
 return "VIGENTE";
}

export function copiarDoMesAnterior(registros,mesDestino){
 // Cria cópia RASCUNHO, sem aprovado_por, sem escrever no servidor.
 if(!Array.isArray(registros)||!/^[0-9]{4}-[0-9]{2}$/.test(mesDestino))
  throw Error("MES_INVALIDO");
 return registros.filter(x=>x.estado==="VIGENTE").map(x=>({
  ...x,id:undefined,versao:undefined,aprovado_por:null,estado:"RASCUNHO",
  mes_referencia:mesDestino+"-01",motivo:"Cópia para revisão "+mesDestino
 }));
}
