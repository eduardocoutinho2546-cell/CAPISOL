// Caixa de entrada dos pedidos que chegaram pelo formulário CAPISOL.
// Executada exclusivamente dentro da tela autorizada do histórico legado.
// Nenhum contato público prospectado é tratado como lead com opt-in.
export const PHONE_OFFICIAL = '5568992490347';

export function validInboundPhone(phone) {
 const input=String(phone??'').replace(/\D/g,'');
 const value=input.length===10||input.length===11?'55'+input:input;
 return /^55[1-9][0-9][0-9]{8,9}$/.test(value)?value:null;
}
export function inboundRows(legacy) {
 const records=Array.isArray(legacy?.inbound_site)?legacy.inbound_site:[];
 return records.filter(x=>x&&validInboundPhone(x.fone)&&String(x.id||'').startsWith('site_'))
  .slice(0,25);
}
export function sourceRows(legacy){
 return Object.entries(legacy?.lead_origins||{})
  .map(([source,n])=>[source,Number(n)||0])
  .sort((a,b)=>b[1]-a[1]);
}
const el=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=String(txt);return x;};

export function renderInboundInbox(root,legacy){
 if(!root || !legacy)return;
 const origin=root.appendChild(el('section'));
 origin.className='card';
 origin.style.marginTop='24px';
 origin.append(el('h2','Origens dos cadastros comerciais'),
   el('p','Prospecção pública não é lead inbound ou autorização para disparos. Revise a procedência antes de contatar.'));
 const sources=sourceRows(legacy);
 const originTable=origin.appendChild(el('table'));
 const oh=originTable.appendChild(el('thead')).appendChild(el('tr'));
 for(const t of ['Origem registrada','Registros'])oh.append(el('th',t));
 const body=originTable.appendChild(el('tbody'));
 for(const [source,n] of sources){const tr=body.appendChild(el('tr'));tr.append(el('td',source),el('td',n));}
 if(!sources.length)origin.append(el('p','Aguardando classificação dos cadastros.'));

 const inbox=root.appendChild(el('section'));
 inbox.className='card';
 inbox.style.marginTop='24px';
 inbox.append(el('h2','Pedidos recebidos pelo site'),
  el('p','Solicitações com autorização de contato, separadas da prospecção pública. Apenas os 25 registros mais recentes aparecem aqui.'));
 const rows=inboundRows(legacy);
 if(!rows.length){
  inbox.append(el('p','Nenhum pedido com consentimento encontrado. O formulário está disponível; confirme a entrada de um pedido real quando houver.'));
  const link=el('a','Abrir formulário de orçamento ↗');
  link.href='../orcamento/';link.target='_blank';link.rel='noopener noreferrer';
  inbox.append(link);return;
 }
 const t=inbox.appendChild(el('table'));
 const head=t.appendChild(el('thead')).appendChild(el('tr'));
 for(const label of ['Cliente','Interesse','Cidade','Etapa','Recebimento','Próxima ação'])head.append(el('th',label));
 const tbody=t.appendChild(el('tbody'));
 for(const x of rows){
  const tr=tbody.appendChild(el('tr'));
  tr.append(el('td',String(x.nome||'Solicitante').slice(0,80)),
   el('td',String(x.interesse||'Atendimento').slice(0,40)),
   el('td',String(x.cidade||'Não informada').slice(0,60)),
   el('td',String(x.etapa||'Lead').slice(0,40)),
   el('td',String(x.recebido_em||'').slice(0,25)));
  const action=tr.appendChild(el('td'));
  const phone=validInboundPhone(x.fone);
  const link=action.appendChild(el('a','Responder no WhatsApp ↗'));
  link.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Olá! Aqui é a equipe da CAPISOL Energia Solar. Recebemos seu pedido de atendimento pelo site. Podemos conversar sobre sua solicitação?');
  link.target='_blank';link.rel='noopener noreferrer';
 }
 inbox.append(el('p','O clique abre o WhatsApp para revisão humana; não envia mensagens automaticamente e não atribui vendedor.'));
}
