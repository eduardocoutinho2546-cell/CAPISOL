import {FONTE_VENDA, idEncaminhamento, vendaElegivel, criarCartaoAdministrativo, resumirVendas} from './fluxo-core.mjs';
const el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
const brl=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

// Inicialização autenticada na Central Comercial, sem privilégios administrativos implícitos.
export async function montarFluxoIntegrado({sb,root}) {
  if (!root || root.dataset.montado === '1') return;
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if (sessionError || !session) return;
  const member=await sb.rpc('eh_membro');
  if (member.error || member.data !== true) return;
  const owner=await sb.rpc('eh_dono');
  const podeEncaminhar=!owner.error && owner.data===true;
  root.dataset.montado='1';
  root.append(el('h2','Comercial → Administrativo • passagem de vendas'));
  root.append(el('p','Fase piloto. O registro de venda não é contrato assinado, comprovação de pagamento nem autorização para comprar kit. O cartão apenas solicita conferência humana.'));
  const summary=el('div','Consultando dados permitidos à sua conta...');
  summary.className='result';summary.setAttribute('role','status');root.append(summary);
  const reloadButton=el('button','Atualizar encaminhamentos');
  reloadButton.className='secondary';reloadButton.type='button';root.append(reloadButton);
  const scroll=el('div');scroll.className='scroll';
  const table=el('table'),thead=el('thead'),head=el('tr');
  ['Cliente','Venda','Financeiro','Passagem ao ADM','Ação'].forEach(t=>head.append(el('th',t)));
  thead.append(head);const body=el('tbody');table.append(thead,body);scroll.append(table);root.append(scroll);
  root.append(el('p','Checklist após encaminhar: cadastro → contrato → financiamento/recebimento → engenharia → autorização de compra → instalação → homologação → aceite e pós-venda. Cada fase depende de conferência humana.'));

  let busy=false;
  async function count(tableName,field,value) {
    let q=sb.from(tableName).select('id',{head:true,count:'exact'});
    if (field) q=q.eq(field,value);
    const result=await q;
    return result.error?'SEM ACESSO':String(result.count??0);
  }
  async function reload() {
    if (busy) return;
    busy=true;reloadButton.disabled=true;body.replaceChildren();summary.textContent='Carregando vendas e encaminhamentos...';
    try {
      const salesResponse=await sb.from('docs').select('id,data,updated_at').eq('col',FONTE_VENDA).order('updated_at',{ascending:false}).limit(50);
      if (salesResponse.error) throw salesResponse.error;
      const vendas=salesResponse.data||[];
      const ids=vendas.filter(vendaElegivel).map(v=>idEncaminhamento(v.id));
      let done=[];
      if (ids.length) {
        const handoffs=await sb.from('docs').select('id').eq('col','leads').in('id',ids);
        if (handoffs.error) throw handoffs.error;
        done=(handoffs.data||[]).map(x=>x.id);
      }
      const checked=new Set(done);
      const counts=resumirVendas(vendas,done);
      const leads=await sb.from('docs').select('id',{count:'exact',head:true}).eq('col','leads').contains('data',{funil:'venda'});
      const leadCount=leads.error?'SEM ACESSO':String(leads.count??0);
      const props=await count('capisol_proposals');
      const orders=await count('capisol_work_orders');
      const received=await count('docs','col','recebimentos');
      summary.textContent='Leads no funil comercial: '+leadCount+' · Propostas estruturadas: '+props+' · Ordens de serviço: '+orders+' · Recebimentos registrados: '+received+'.\nEntre as últimas '+vendas.length+' vendas lançadas: '+counts.pendentes+' aguardando passagem ao ADM; '+counts.encaminhadas+' encaminhadas; '+counts.invalidas+' sem confirmação suficiente.';
      if(!vendas.length){const tr=el('tr'),td=el('td','Nenhuma venda registrada neste módulo. Cadastre uma venda verdadeira na seção acima.');td.colSpan=5;tr.append(td);body.append(tr);}
      for(const sale of vendas){
        const d=sale.data||{},tr=el('tr');
        [d.cliente||'—',Number.isFinite(Number(d.valorVendido))?brl(d.valorVendido):'—',d.situacaoFinanceira||'PENDENTE_CUSTOS',
          !vendaElegivel(sale)?'Venda não confirmada':checked.has(idEncaminhamento(sale.id))?'Cartão criado':'Aguardando encaminhamento'].forEach(x=>tr.append(el('td',x)));
        const actionCell=el('td');
        if(vendaElegivel(sale)&&!checked.has(idEncaminhamento(sale.id))&&podeEncaminhar){
          const button=el('button','Encaminhar ao ADM');button.className='secondary';button.type='button';
          button.onclick=async()=>{
            if(!window.confirm('Criar somente um cartão de conferência administrativa para '+d.cliente+'? Nenhum pagamento, comissão ou compra será autorizado.'))return;
            button.disabled=true;
            try {
              const cartao=criarCartaoAdministrativo(sale,session.user.id);
              const exists=await sb.from('docs').select('id').eq('col','leads').eq('id',cartao.id).maybeSingle();
              if(exists.error)throw exists.error;
              if(!exists.data){const written=await sb.from('docs').insert(cartao);if(written.error&&written.error.code!=='23505')throw written.error;}
              summary.textContent='Encaminhamento registrado; conferência administrativa permanece pendente. Nenhum compromisso financeiro foi criado.';
              await reload();
            }catch(e){summary.textContent='Não foi possível encaminhar: '+(e.message||'verifique acesso e permissões');button.disabled=false;}
          };
          actionCell.append(button);
        } else actionCell.append(el('span',podeEncaminhar?'—':'Somente sócios autorizados'));
        tr.append(actionCell);body.append(tr);
      }
    }catch(e){summary.textContent='Diagnóstico indisponível: '+(e.message||'verifique login e RLS.');}
    finally{busy=false;reloadButton.disabled=false;}
  }
  reloadButton.onclick=reload;
  await reload();
}
