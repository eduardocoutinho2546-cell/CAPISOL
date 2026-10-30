// Modelo puro para o painel autenticado Empresa hoje: nunca faz fetch sem login.
// Cada indicador deve ser acompanhado de fonte e data; sem dado não vira zero.
export const SETORES = Object.freeze([
 "estrategia","operacoes","financas","juridico-contabil","comercial",
 "marketing","marca-conteudo","ti-dados","pessoas","institucional",
 "jornalismo-radar","comunidades","obras","posvenda-capisol-mais",
 "compras-estoque"
]);
function seguro(valor){return valor===null||valor===undefined||valor===""?"sem dado":String(valor)}
export function modeloEmpresaHoje(registros=[]){
 const map=new Map(registros.filter(x=>x&&SETORES.includes(x.setor)).map(x=>[x.setor,x]));
 return SETORES.map(setor=>{
  const s=map.get(setor)||{};
  return {setor,ultimaRodada:seguro(s.ultimaRodada),pendencia:seguro(s.pendencia),
   bloqueio:seguro(s.bloqueio),indicador:seguro(s.indicador),
   fonte:seguro(s.fonte),dataFonte:seguro(s.dataFonte)};
 });
}
export function renderizarEmpresaHoje(root,registros){
 // Só usar em área autenticada. textContent evita injeção HTML em fontes.
 if(!root || typeof root.replaceChildren!=="function") throw Error("RAIZ_INVALIDA");
 const doc=root.ownerDocument;
 const fragment=doc.createDocumentFragment();
 const heading=doc.createElement("h2");heading.textContent="Empresa hoje";fragment.appendChild(heading);
 for(const s of modeloEmpresaHoje(registros)){
  const card=doc.createElement("section");card.className="capisol-setor";
  const h=doc.createElement("h3");h.textContent=s.setor.replaceAll("-"," ");card.appendChild(h);
  for(const [titulo,v] of [["Última rodada",s.ultimaRodada],["Titular",s.pendencia],
    ["Bloqueio",s.bloqueio],["Indicador",s.indicador],["Fonte",s.fonte],["Verificação",s.dataFonte]]){
   const p=doc.createElement("p");p.textContent=titulo+": "+v;card.appendChild(p);
  }
  fragment.appendChild(card);
 }
 root.replaceChildren(fragment);
}
