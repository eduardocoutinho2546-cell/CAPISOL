// CAPISOL: atribuição somente por vínculo explícito, nunca por nome/telefone.
const E=(name,content)=>{const n=document.createElement(name);if(content!==undefined)n.textContent=String(content);return n;};
export function campaignRows(report){
 return (Array.isArray(report?.campanhas)?report.campanhas:[])
  .filter(x=>x&&typeof x.origem==='string'&&typeof x.campanha==='string')
  .map(x=>({
   origem:x.origem,campanha:x.campanha,
   recebidos:Math.max(0,Number(x.recebidos)||0),
   propostas:Math.max(0,Number(x.propostas)||0),
   vendas:Math.max(0,Number(x.vendas)||0),
   faturamento:Math.max(0,Number(x.faturamento)||0),
   contribuicao:Number(x.contribuicao_estimada)||0
  }));
}
const BRL=x=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(x)||0);
export function renderCampaignAttribution(root,report,propostas=[],leads=[],onLink=null){
 if(!root)return;
 const s=root.appendChild(E('section'));
 s.className='card';s.style.marginTop='24px';
 s.append(E('h2','Campanhas → pedidos → propostas → vendas'),
  E('p','Somente leads que pediram contato pelo site ou iniciaram conversa pela API oficial. Contatos públicos importados não contam como interesse.'));
 if(!report){s.append(E('p','Relatório indisponível; não considerar zero como informação confirmada.'));return;}
 const total=report.totais||{};
 s.append(E('p','Pedidos recebidos: '+(Number(total.recebidos)||0)+' · Propostas vinculadas: '+(Number(total.propostas)||0)+' · Vendas ganhas: '+(Number(total.vendas)||0)+' · Receita vinculada: '+BRL(total.faturamento)+' · Contribuição estimada: '+BRL(total.contribuicao_estimada)));
 s.append(E('p','Valores de propostas ganhas registradas, não comprovantes bancários nem lucro líquido. Vínculo com campanha precisa de registro explícito.'));
 const rows=campaignRows(report);
 if(rows.length){
  const tbl=s.appendChild(E('table'));const h=tbl.appendChild(E('thead')).appendChild(E('tr'));
  for(const x of ['Origem','Campanha / referência','Pedidos','Propostas','Vendas','Receita vinculada'])h.append(E('th',x));
  const b=tbl.appendChild(E('tbody'));
  for(const x of rows){const tr=b.appendChild(E('tr'));for(const v of [x.origem,x.campanha,x.recebidos,x.propostas,x.vendas,BRL(x.faturamento)])tr.append(E('td',v));}
 }else s.append(E('p','Ainda não existe pedido inbound atribuído. O calendário de posts não equivale a lead.'));
 const available=(Array.isArray(leads)?leads:[]).filter(x=>x?.id?.startsWith('site_'));
 const proposals=(Array.isArray(propostas)?propostas:[]).filter(x=>x?.id&&['draft','review','approved','won','lost'].includes(x.status));
 if(!available.length||!proposals.length||typeof onLink!=='function'){
  s.append(E('p','Para vincular campanha a receita, primeiro receba um pedido real pelo formulário e crie uma proposta real no escritório. Nenhum vínculo automático é inventado.'));
  return;
 }
 const wrap=s.appendChild(E('div'));wrap.style.marginTop='12px';
 wrap.append(E('h3','Vincular proposta real a um pedido recebido'));
 const lead=wrap.appendChild(E('select'));lead.setAttribute('aria-label','Selecione um pedido consentido');
 for(const l of available){const o=E('option',(l.nome||'Solicitante')+' — '+(l.cidade||'Cidade não informada'));o.value=l.id;lead.append(o);}
 const proposal=wrap.appendChild(E('select'));proposal.setAttribute('aria-label','Selecione uma proposta');
 for(const p of proposals){const o=E('option',(p.customer||'Cliente')+' · '+p.status);o.value=p.id;proposal.append(o);}
 const button=wrap.appendChild(E('button','Vincular proposta ao pedido'));button.type='button';button.className='button';
 const feedback=wrap.appendChild(E('p'));feedback.setAttribute('role','status');
 button.onclick=async()=>{
  button.disabled=true;feedback.textContent='Conferindo vínculo…';
  try{await onLink({lead_id:lead.value,proposta_id:proposal.value});feedback.textContent='Vínculo salvo. A página será atualizada.';}
  catch(err){feedback.textContent='Não foi possível vincular: '+String(err?.message||err).slice(0,160);}
  finally{button.disabled=false;}
 };
}
