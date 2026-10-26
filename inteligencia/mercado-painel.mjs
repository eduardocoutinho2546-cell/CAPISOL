import {selecionarMercado,avaliarPreco,pisoComercial,orientarPreco,FIXO_HISTORICO_V10} from "./mercado-motor.mjs";
const money=n=>n===null||n===undefined?"—":Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const e=(tag,text="",p={})=>{const node=document.createElement(tag);node.textContent=String(text);Object.assign(node,p);return node;};
function field(form,label,name,type="number",value="",extra={}){
 const l=e("label",label),i=e("input","",{name,type,...extra});
 if(value!==null&&value!=="")i.value=String(value);
 if(type==="number"){i.step="0.01";i.min="0";}
 l.append(i);form.append(l);return i;
}
function table(parent,headers){
 const wrap=e("div","",{className:"scroll"}),t=e("table"),head=e("thead"),r=e("tr");
 headers.forEach(x=>r.append(e("th",x)));head.append(r);
 const body=e("tbody");t.append(head,body);wrap.append(t);parent.append(wrap);return body;
}
export async function montarRadar({sb,root}){
 if(!root||root.dataset.montado)return;
 const {data:{session}}=await sb.auth.getSession();if(!session)return;
 const {data:member}=await sb.rpc("eh_membro");if(member!==true)return;
 root.dataset.montado="1";
 root.append(e("h2","Radar de mercado, margem e ponto de equilíbrio"));
 root.append(e("p","Preços de concorrentes definem a referência somente com 3+ ofertas reais comparáveis de empresas diferentes em Rio Branco, publicadas nos últimos 45 dias. A mediana reduz distorções. Sem prova, a tabela não recebe média fictícia."));
 const msg=e("p","Referência nacional informativa (NÃO concorrência local): 1.000 kWh/mês, R$ 19.300–24.200 turnkey — Solar Community 2026. Esse dado NÃO entra no cálculo da mediana do Acre.");
 const source=e("a","Consultar fonte",{href:"https://solarcommunity.com.br/energia-solar/1000-kwh",target:"_blank",rel:"noopener noreferrer"});msg.append(" ",source);root.append(msg);
 const form=e("form");
 const kwh=field(form,"Faixa de geração (kWh/mês)","kwh","number","1000",{required:true});
 const kit=field(form,"Kit + frete real da BelEnergy (R$)","kit","number","",{placeholder:"Somente PDF atual"});
 const obra=field(form,"Projeto + instalação + insumos + deslocamento (R$)","obra","number","",{placeholder:"Custos de obra conferidos"});
 const comm=field(form,"Comissão efetiva (%)","comissaoPct","number","5");
 const tax=field(form,"Tributo efetivo (%) — validar contador","impostoPct","number","");
 const risk=field(form,"Reserva de risco (%)","riscoPct","number","");
 const monthly=field(form,"Despesas fixas MENSAIS previstas (R$)","fixoMensal","number",FIXO_HISTORICO_V10);
 const realized=field(form,"Contribuição já comprovada no mês (R$)","contribuicaoMesJaRealizada","number","0");
 const min=field(form,"Piso desejado de contribuição por venda (R$)","contribuicaoMinima","number","");
 const base=e("label","Base fiscal APROVADA (definição contábil)"),select=e("select","",{name:"baseFiscal"});
 for(const [value,title] of [["","Ainda não aprovada"],["propria","Receita própria = preço - kit"],["total","Valor integral da venda"]])select.append(e("option",title,{value}));
 base.append(select);form.append(base);root.append(form);
 const compute=e("button","Comparar preços e contas do mês",{className:"primary",type:"button"});root.append(compute);
 const summary=e("div","Informe as premissas e pressione comparar. Nenhum preço fica aprovado automaticamente.",{className:"result",role:"status"});root.append(summary);
 const cases=table(root,["Preço vendido","Comissão","Impostos","Contribuição","Falta para fixos","Vendas adicionais necessárias"]);
 root.append(e("h3","Evidências comerciais de concorrentes"));
 root.append(e("p","Registre somente preço completo on-grid, sem bateria, pagamento à vista, geração semelhante e prova pública ou orçamento autorizado. A amostra fica na base privada da equipe, não em post público."));
 const mform=e("form");
 const company=field(mform,"Empresa","empresa","text","",{required:true,maxLength:100});
 const cp=field(mform,"Preço completo anunciado (R$)","preco","number","",{required:true});
 const cg=field(mform,"Consumo mensal coberto (kWh)","consumoKwh","number","1000",{required:true});
 const city=field(mform,"Cidade","cidade","text","Rio Branco",{required:true});
 const dt=field(mform,"Data comprovada","dataPesquisa","date",new Date().toISOString().slice(0,10),{required:true});
 const src=field(mform,"URL do anúncio/fonte","fonte","url","",{required:true,placeholder:"https://..."});
 const checked=e("label"),ck=e("input","",{type:"checkbox"});
 checked.append(ck,document.createTextNode(" Confirmo: sistema on-grid sem bateria, instalado com projeto/homologação, mesma modalidade de pagamento e fonte verificada."));mform.append(checked);root.append(mform);
 const add=e("button","Registrar preço observado",{className:"secondary",type:"button"});root.append(add);
 const samples=table(root,["Empresa","Data","Consumo","Preço","Fonte"]);
 let records=[];
 async function load(){
  const {data,error}=await sb.from("docs").select("id,data,updated_at").eq("col","mercado_cotacoes_2026").order("updated_at",{ascending:false}).limit(200);
  if(error){summary.textContent="Falha ao ler amostras privadas: "+error.message;return}
  records=data||[];samples.replaceChildren();
  for(const row of records.slice(0,45)){
   const d=row.data||{},tr=e("tr");
   [d.empresa,d.dataPesquisa,d.consumoKwh,money(d.preco)].forEach(x=>tr.append(e("td",x||"—")));
   const cell=e("td");if(/^https:\/\//.test(d.fonte||""))cell.append(e("a","Fonte",{href:d.fonte,target:"_blank",rel:"noopener noreferrer"}));else cell.textContent="—";
   tr.append(cell);samples.append(tr);
  }
 }
 function update(){
  const inputs=Object.fromEntries(new FormData(form).entries());
  const market=selecionarMercado(records,{kwh:Number(inputs.kwh),cidade:"Rio Branco",hoje:new Date().toISOString().slice(0,10)});
  let minPrice=null;
  try{minPrice=pisoComercial(inputs);}catch(e){summary.textContent="Falha no piso: "+e.message;return}
  const orient=orientarPreco(market,minPrice);
  const marketInfo=market.insuficiente?"Sem amostra local suficiente: "+market.amostras+"/3 concorrentes comparáveis.":"Mediana local verificada: "+money(market.mediana)+"; amostras "+market.amostras+".";
  summary.textContent=marketInfo+"\nPiso financeiro estimado: "+money(minPrice)+". Status: "+orient.estado+
   ". Meta de mercado NÃO é aprovação de venda. Despesas fixas previstas: "+money(Number(inputs.fixoMensal))+"; dia (30d): "+money(Number(inputs.fixoMensal)/30)+".";
  cases.replaceChildren();
  const prices=[18500,18900,19000,...(market.mediana!==null?[market.mediana]:[])].filter((x,i,arr)=>arr.indexOf(x)===i);
  for(const p of prices){
   const result=avaliarPreco({...inputs,preco:p});
   const tr=e("tr");
   [money(p),money(result.comissao),money(result.impostos),money(result.contribuicao),
    money(result.restaPagarFixos),result.vendasNecessarias===null?"—":String(result.vendasNecessarias)].forEach(x=>tr.append(e("td",x)));
   cases.append(tr);
  }
 }
 compute.addEventListener("click",update);
 add.addEventListener("click",async()=>{
  if(!mform.reportValidity())return;
  if(!ck.checked){summary.textContent="Marque confirmação de condições comparáveis e fonte verificada.";return}
  const d=Object.fromEntries(new FormData(mform).entries()),price=Number(d.preco),generation=Number(d.consumoKwh);
  try{const url=new URL(d.fonte);if(url.protocol!=="https:"||!Number.isFinite(price)||price<=0||!Number.isFinite(generation)||generation<=0)throw Error("Dados do anúncio inválidos");
   if(!window.confirm("Registrar a evidência pública de "+d.empresa+" por "+money(price)+"?"))return;
   add.disabled=true;
   const {error}=await sb.from("docs").insert({id:"MK_"+crypto.randomUUID(),col:"mercado_cotacoes_2026",data:{
    ...d,preco:price,consumoKwh:generation,cidade:d.cidade.trim(),onGrid:true,temBateria:false,
    instaladoCompleto:true,mesmaModalidade:true,criadoPor:session.user.id}});
   if(error)throw error;
   await load();update();mform.reset();mform.elements.consumoKwh.value=String(kwh.value);mform.elements.cidade.value="Rio Branco";ck.checked=false;
  }catch(e){summary.textContent="Evidência não salva: "+e.message}finally{add.disabled=false}
 });
 await load();update();
}
