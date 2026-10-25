// Módulo puro: não lê CPF, dados do destinatário ou endereço do PDF.
const money=(s)=>{let v=String(s??"").replace(/R\$\s*/g,"").trim();if(/^\d{1,3}(\.\d{3})+,\d{2}$/.test(v))v=v.replace(/\./g,"").replace(",",".");else if(/^\d+,\d{1,2}$/.test(v))v=v.replace(",",".");if(!/^\d+(\.\d{1,2})?$/.test(v))return null;return Number(v).toFixed(2)};
const field=(text,rx)=>{const m=text.match(rx);return m?m[1]:null};
export function parseCotacaoTexto(text){
 if(typeof text!=="string"||text.length>80000)throw Error("texto_invalido");
 const s=text.replace(/\u00a0/g," ").replace(/\r/g,"");
 const num=field(s,/\b(WEB[- ]?\d{6,})\b/i);
 const dd=field(s,/Emiss[ãa]o\s+em\s+(\d{2}\/\d{2}\/\d{4})/i);
 const dias=field(s,/v[áa]lid[oa]\s+por\s+(\d{1,3})\s+dias?/i);
 const kw=field(s,/Pot[êe]ncia\s+do\s+sistema\s*:\s*([\d.,]+)\s*kWp/i);
 const pr=field(s,/\+\s*Total\s+de\s+Produtos\s*:\s*R\$\s*([\d.,]+)/i);
 const fr=field(s,/\+\s*Valor\s+Frete\s*:\s*R\$\s*([\d.,]+)/i);
 const seg=field(s,/\+\s*Valor\s+Seguro\s*:\s*R\$\s*([\d.,]+)/i);
 const total=field(s,/Valor\s+Total\s*:\s*R\$\s*([\d.,]+)/i);
 const parsed={numero:num?.replace(" ","-").toUpperCase()||null,emissao:dd||null,dias: dias?Number(dias):null,kwp:kw?Number(kw.replace(",",".")):null,produtos:money(pr),frete:money(fr),seguro:money(seg||"0"),total:money(total),fornecedor:/(BelEnergy|Belenus)/i.test(s)?"BelEnergy":null};
 return verificarCotacao(parsed);
}
export function verificarCotacao(q){
 const invalid=[];if(!q||typeof q!=="object")throw Error("cotacao_invalida");
 if(!/^WEB-\d{6,}$/.test(q.numero||""))invalid.push("numero_invalido");
 if(q.fornecedor!=="BelEnergy")invalid.push("fornecedor_nao_confirmado");
 if(!/^\d{2}\/\d{2}\/\d{4}$/.test(q.emissao||""))invalid.push("data_invalida");
 const dias=Number(q.dias);
 if(!Number.isInteger(dias)||dias<1||dias>30)invalid.push("prazo_invalido");
 if(!Number.isFinite(Number(q.kwp))||Number(q.kwp)<=0||Number(q.kwp)>2000)invalid.push("potencia_invalida");
 const prod=money(q.produtos),fr=money(q.frete),seg=money(q.seguro),tot=money(q.total);
 if([prod,fr,seg,tot].some(x=>x===null))invalid.push("valor_faltando");
 if(!invalid.length){
  const sum=Math.round(Number(prod)*100)+Math.round(Number(fr)*100)+Math.round(Number(seg)*100);
  if(Math.abs(sum-Math.round(Number(tot)*100))>5)invalid.push("soma_inconsistente");
 }
 let validade=null;
 if(q.emissao&&Number.isInteger(dias)&&dias>0){
  const [d,m,y]=q.emissao.split("/").map(Number);
  const date=new Date(Date.UTC(y,m-1,d));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)invalid.push("data_calendario_invalida");
  else {date.setUTCDate(date.getUTCDate()+dias);validade=date.toISOString().slice(0,10)}
 }
 return {numero:q.numero||null,emissao:q.emissao||null,dias:q.dias??null,kwp:Number(q.kwp)||null,
 produtos:prod,frete:fr,seguro:seg,total:tot,fornecedor:q.fornecedor||null,validade,
 erros:[...new Set(invalid)],status:"PENDENTE_CONFERENCIA_HUMANA",pode_comprar:false};
}

