const $=id=>document.getElementById(id);
const E=(tag,txt="",attrs={})=>{const e=document.createElement(tag);e.textContent=txt;for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e};
const brl=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
async function request(sb,action,more={}){
 const {data,error}=await sb.functions.invoke("capisol-cotacoes",{body:{action,...more}});
 if(error)throw Error("Serviço indisponível, sem sessão ou sem autorização");
 if(data?.error)throw Error(data.error);
 return data;
}
async function pdfSeguro(f){
 if(!f||f.size>10*1024*1024||!f.name.toLowerCase().endsWith(".pdf"))throw Error("Selecione PDF com até 10 MB");
 const bytes=new Uint8Array(await f.arrayBuffer());
 const hashBytes=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
 const pdf_sha256=Array.from(hashBytes).map(x=>x.toString(16).padStart(2,"0")).join("");
 const p=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
 p.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
 const d=await p.getDocument({data:bytes,stopAtErrors:true}).promise;
 if(d.numPages<1||d.numPages>30)throw Error("Número de páginas inválido");
 const parts=[];
 for(let n=1;n<=d.numPages;n++){const t=await(await d.getPage(n)).getTextContent();parts.push(t.items.map(x=>x.str||"").join(" "))}
 const text=parts.join("\n");
 const pick=rx=>(text.match(rx)||[])[0]||"";
 const texto=[
 pick(/\bWEB[- ]?\d{6,}\b/i),
 pick(/Emiss[ãa]o\s+em\s+\d{2}\/\d{2}\/\d{4}/i),
 pick(/v[áa]lid[oa]\s+por\s+\d+\s+dias?/i),
 pick(/Pot[êe]ncia\s+do\s+sistema\s*:\s*[\d.,]+\s*kWp/i),
 pick(/\+\s*Total\s+de\s+Produtos\s*:\s*R\$\s*[\d.,]+/i),
 pick(/\+\s*Valor\s+Frete\s*:\s*R\$\s*[\d.,]+/i),
 pick(/\+\s*Valor\s+Seguro\s*:\s*R\$\s*[\d.,]+/i),
 pick(/Valor\s+Total\s*:\s*R\$\s*[\d.,]+/i),
 /BelEnergy|Belenus/i.test(text)?"BelEnergy":""
 ].join("\n");
 // Envie SOMENTE os campos comerciais. Os dados pessoais do PDF não saem do navegador.
 return {texto,pdf_sha256};
}
export async function montarPainel({sb,root}){
 if(!root||root.dataset.init==="1")return;
 const {data:{session}}=await sb.auth.getSession();
 if(!session)return;
 const {data:owner,error}=await sb.rpc("eh_dono");
 if(error||owner!==true)return;
 root.hidden=false;root.dataset.init="1";
 root.append(E("h2","BelEnergy • importação segura de cotação"),
 E("p","Escolha o PDF do fornecedor. Somente campos comerciais são enviados; nenhuma compra ou proposta será finalizada."));
 const label=E("label","PDF da BelEnergy: ");const inp=E("input","",{type:"file",accept:"application/pdf,.pdf"});label.append(inp);root.append(label);
 const actions=E("div","",{class:"cotacoes-actions"});
 const preview=E("button","Conferir PDF",{type:"button"});
 const save=E("button","Salvar cotação",{type:"button"});save.disabled=true;
 const list=E("button","Listar cotações",{type:"button"});
 const ssw=E("a","Rastreamento oficial SSW",{href:"https://ssw.inf.br/2/rastreamento_pf",target:"_blank",rel:"noopener noreferrer"});
 actions.append(preview,save,list,ssw);root.append(actions);
 const output=E("div","Aguardando PDF.",{role:"status",class:"cotacoes-output"});root.append(output);
 const hist=E("div");root.append(hist);
 let payload=null;
 preview.onclick=async()=>{
  save.disabled=true;output.textContent="Conferindo valores...";
  try{
   payload=await pdfSeguro(inp.files?.[0]);
   const {cotacao:q}=await request(sb,"parse",{texto:payload.texto});
   if(q.erros.length){output.textContent="Campos pendentes: "+q.erros.join(", ");return}
   output.textContent=q.numero+" | "+q.kwp+" kWp | "+brl(q.total)+" | validade estimada: "+q.validade+". CONFIRA O PDF ORIGINAL antes de salvar.";
   save.disabled=false;
  }catch(e){output.textContent=e.message||"Falha ao ler PDF"}
 };
 save.onclick=async()=>{
  if(!payload)return;save.disabled=true;
  try{const r=await request(sb,"importar",payload);output.textContent="Registrada "+r.registro.numero+" com status pendente de conferência. Não houve compra."}
  catch(e){output.textContent=e.message||"Falha ao salvar"}
 };
 list.onclick=async()=>{
  hist.textContent="Buscando cotações...";
  try{
   const r=await request(sb,"listar");
   const table=E("table");const tr=E("tr");
   ["Número","Emissão","Validade","kWp","Total","Status"].forEach(x=>tr.append(E("th",x)));table.append(tr);
   for(const q of r.cotacoes||[]){const row=E("tr");[q.numero,q.emissao,q.validade,q.kwp,brl(q.total),q.situacao].forEach(x=>row.append(E("td",String(x??""))));table.append(row)}
   hist.replaceChildren(table);
  }catch(e){hist.textContent=e.message||"Não foi possível consultar"}
 };
 const details=E("details"),summary=E("summary","Simulação financeira (rascunho interno)");
 details.append(summary);const form=E("form");
 const names=[["preco","Valor total ao cliente",18900],["kit","Custo do kit",0],["engenharia","Projeto",350],["insumos","Insumos",500],["instalacao","Instalação PJ",0],["deslocamento","Deslocamento",0],["comissaoPct","Comissão (%)",5],["impostoPct","Imposto (%)",6],["stonePct","Stone (%)",0],["risco","Reserva risco",0],["desconto","Desconto",0],["pisoMargem","Piso contribuição",0]];
 for(const [name,title,val] of names){const l=E("label",title+" "),v=E("input","",{type:"number",name,min:"0",step:"0.01",required:"required"});v.value=String(val);l.append(v);form.append(l)}
 const calc=E("button","Simular",{type:"submit"}),result=E("div","Impostos e taxas dependem de validação.");
 form.append(calc);details.append(form,result);root.append(details);
 form.onsubmit=async(ev)=>{
  ev.preventDefault();const parametros={};
  for(const [name] of names)parametros[name]=Number(form.elements.namedItem(name).value);
  try{const p=await request(sb,"simular",{parametros});
   result.textContent="Contribuição estimada: "+brl(p.contribuicao)+" | "+(p.bloqueios.join(", ")||"Revisão humana obrigatória")+". Não liberado para envio.";
  }catch(e){result.textContent=e.message||"Falha"}
 };
}
