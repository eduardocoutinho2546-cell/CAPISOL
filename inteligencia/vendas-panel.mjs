// Formulário autenticado: preço de tabela NÃO força o valor contratado.
import {simularVenda,validarCadastro} from "./vendas-calculo.mjs";
const h=(tag,txt="",props={})=>{const e=document.createElement(tag);e.textContent=txt;Object.assign(e,props);return e};
const fmt=x=>x==null?"—":Number(x).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const specs=[
 ["dataVenda","Data do contrato","date","",true],["cliente","Cliente","text","",true],
 ["vendedor","Vendedor responsável","text","",true],["consumoKwh","Geração alvo (kWh/mês)","number","1000",true],
 ["precoTabela","Preço de referência (R$)","number","18900",false],
 ["valorVendido","Valor REAL vendido (R$)","number","",true],
 ["kitReal","Custo REAL do kit + frete (R$)","number","",false],
 ["custosDiretos","Projeto, instalação, insumos, deslocamento (R$)","number","",false],
 ["comissaoPct","Comissão aplicável (%)","number","",false],
 ["tributosPct","Tributos estimados (%)","number","",false],
 ["reservasPct","Reserva de risco (%)","number","",false],
 ["fixoMensal","Despesas fixas do mês (R$)","number","",false],
 ["vendasPlanejadasMes","Meta de vendas no mês (para rateio)","number","",false]
];
const val=form=>Object.fromEntries(new FormData(form).entries());
export async function montarVendas({sb,root}){
 if(!root||root.dataset.montado)return;
 const {data:{session}}=await sb.auth.getSession();if(!session)return;
 const {data:member}=await sb.rpc("eh_membro");if(member!==true)return;
 root.dataset.montado="1";
 root.append(h("h2","Registrar venda • preço negociado"));
 root.append(h("p","Referência: R$ 18.900 para 1.000 kWh/mês. Digite quanto realmente vendeu, por exemplo R$ 19.000. Os custos só geram resultado se estiverem completos; despesas fixas continuam no DRE."));
 const form=h("form");form.id="capisolRegistroVenda";
 for(const [name,label,type,defaultValue,required] of specs){
  const l=h("label",label),input=h("input","",{name,type,required});
  if(defaultValue)input.value=defaultValue;
  if(type==="number"){input.step=name==="consumoKwh"||name==="vendasPlanejadasMes"?"1":"0.01";input.min=name==="valorVendido"?"0.01":"0";}
  l.append(input);form.append(l);
 }
 const base=h("label","Base tributária (segundo contador)");
 const select=h("select","",{name:"baseTributaria"});
 for(const [v,t] of [["","Não definida"],["servicos","Receita própria (venda menos kit)"],["total","Valor total contratado"]])select.append(h("option",t,{value:v}));
 base.append(select);form.append(base);root.append(form);
 const conf=h("label");const cb=h("input","",{type:"checkbox"});
 conf.append(cb,document.createTextNode(" Confirmo que esta VENDA realmente foi fechada (não é só cotação)."));root.append(conf);
 const bar=h("div","",{className:"cotacoes-actions"});
 const simulate=h("button","Calcular resultado",{type:"button",className:"secondary"});
 const save=h("button","Registrar venda fechada",{type:"button",className:"primary"});
 bar.append(simulate,save);root.append(bar);
 const status=h("div","Nenhuma venda é registrada automaticamente. O preço final fica separado da tabela.",{className:"result",role:"status"});root.append(status);
 root.append(h("h3","Vendas cadastradas"));
 const scroll=h("div","",{className:"scroll"}),table=h("table"),thead=h("thead"),tr=h("tr");
 for(const c of ["Data","Cliente","kWh/mês","Tabela","Valor vendido","Diferença","Contribuição simulada","Conferência"])tr.append(h("th",c));
 thead.append(tr);const tbody=h("tbody");table.append(thead,tbody);scroll.append(table);root.append(scroll);
 form.elements.consumoKwh.addEventListener("change",()=>{
  if(Number(form.elements.consumoKwh.value)!==1000&&Number(form.elements.precoTabela.value)===18900)form.elements.precoTabela.value="";
  if(Number(form.elements.consumoKwh.value)===1000&&form.elements.precoTabela.value==="")form.elements.precoTabela.value="18900";
 });
 simulate.addEventListener("click",()=>{
  try{const r=simularVenda(val(form));
   status.textContent="Vendido "+fmt(r.valorVendido)+" | Tabela "+fmt(r.precoTabela)+" | Diferença "+fmt(r.diferenca)+
   " | Contribuição antes do fixo "+fmt(r.contribuicao)+
   " | Resultado após rateio gerencial "+fmt(r.resultadoAposRateio)+" | "+r.status+
   ". Contribuição não é lucro líquido. Impostos e custos precisam de conferência.";}
  catch(e){status.textContent="Simulação: "+e.message}
 });
 async function reload(){
  const {data,error}=await sb.from("docs").select("data,updated_at").eq("col","vendas_sistemas_registro").order("updated_at",{ascending:false}).limit(80);
  if(error){status.textContent="Erro ao consultar vendas: "+error.message;return}
  tbody.replaceChildren();
  for(const row of data||[]){const d=row.data||{},t=h("tr");
   for(const v of [d.dataVenda,d.cliente,d.consumoKwh,fmt(d.precoTabela),fmt(d.valorVendido),fmt(d.diferencaTabela),fmt(d.contribuicaoSimulada),d.situacaoFinanceira||"PENDENTE"])
    t.append(h("td",v==null?"—":String(v)));
   tbody.append(t);
  }
 }
 save.addEventListener("click",async()=>{
  if(!form.reportValidity())return;
  try{
   const d=validarCadastro({...val(form),conferido:cb.checked});
   if(!window.confirm("Confirmar venda realmente fechada de "+d.cliente+" por "+fmt(d.valorVendido)+"?"))return;
   save.disabled=true;status.textContent="Salvando no cadastro protegido...";
   const {error}=await sb.from("docs").insert({id:"VS_"+crypto.randomUUID(),col:"vendas_sistemas_registro",
    data:{...d,registradoPor:session.user.id}});
   if(error)throw error;
   status.textContent="Venda registrada: "+fmt(d.valorVendido)+", referência "+fmt(d.precoTabela)+
    ". Resultado financeiro "+d.situacaoFinanceira+". Não emite NF nem baixa pagamentos.";
   form.reset();form.elements.consumoKwh.value="1000";form.elements.precoTabela.value="18900";cb.checked=false;
   await reload();
  }catch(e){status.textContent="Registro NÃO feito: "+(e.message||"erro de acesso");}
  finally{save.disabled=false;}
 });
 await reload();
}
