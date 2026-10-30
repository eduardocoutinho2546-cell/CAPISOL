// CAPISOL: pré-validação no frontend. O backend DEVE repetir todos os portões.
const promessas = [/conta\s+zerada/i,/economize\s+\d+[.,]?\d*\s*%/i,
 /\bgarantid[oa]\b/i,/melhor\s+do\s+brasil/i,/\bde\s+R\$\s*[\d.,]+\s+por\s+R\$/i];
const numero = /(?:R\$\s*\d|\b\d+[,.]?\d*\s*%)/g;
export function verificarRascunho({texto="",canal="whatsapp",fonteNumeros=[],telefoneConfirmado=false,
  consentimento=false,optOut=false,modoSombra=true,aprovacao=false,canalHabilitado=false}={}){
 const motivos=[];
 if(typeof texto!=="string"||!texto.trim())motivos.push("TEXTO_VAZIO");
 else {
  if(promessas.some(rx=>rx.test(texto)))motivos.push("PROMESSA_VEDADA");
  const numeros=texto.match(numero)||[];
  if(numeros.length&&!fonteNumeros.length)motivos.push("NUMEROS_SEM_FONTE");
  if(canal==="whatsapp"){
   const emoji=(texto.match(/\p{Extended_Pictographic}/gu)||[]).length;
   if(emoji>1)motivos.push("MAIS_DE_UM_EMOJI");
  }
 }
 if(optOut)motivos.push("CONTATO_BLOQUEADO");
 if(!consentimento)motivos.push("SEM_OPT_IN");
 if(!telefoneConfirmado)motivos.push("TELEFONE_NAO_CONFIRMADO");
 if(modoSombra)motivos.push("MODO_SOMBRA");
 if(!aprovacao)motivos.push("AGUARDA_APROVACAO");
 if(!canalHabilitado)motivos.push("KILL_SWITCH_ATIVO");
 return {liberado:motivos.length===0,motivos};
}
