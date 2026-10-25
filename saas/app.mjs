import {money,statuses,summarize,reviewSector,validateFiscal} from './domain.mjs';
import {tenantMode,validateRural,generateEditorialTracks,CONTENT_PILLARS} from './verticals.mjs';
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=window.supabase.createClient('https://wvgmabqecrlydsranknn.supabase.co','sb_publishable_yY2ciEDXntw2cvZJAcF6DQ_bwQUGEMv');
let user,workspace,workspaces=[],role,tab='overview',sectors=[],data={},provider=null,accessScopes=[];
const nav=[['overview','Visão geral'],['quality','Dados e crescimento'],['tasks','Tarefas e execução'],['sectors','72 setores'],['suppliers','Fornecedores'],['proposals','Propostas'],['subscriptions','CAPISOL+'],['bank','Open Finance'],['fiscal','Notas fiscais'],['audit','Auditoria'],['access','Equipe e acessos'],['rural','Produtores rurais'],['content','Estúdio de conteúdo'],['media','Vídeos e cortes']];
const financial=()=>['admin','manager'].includes(role);
const moduleAllowed=type=>financial()||accessScopes.includes(type+'.read')||accessScopes.includes(type+'.write');
const moduleWritable=type=>financial()||accessScopes.includes(type+'.write');
function notice(message='',error=false){$('notice').textContent=message;$('notice').className=error?'error':'';}
const errors={max_three_active_priorities:'Conclua ou pause uma prioridade antes de iniciar a quarta.',task_execution_requires_plan:'Para iniciar a tarefa, informe responsável, prazo e objetivo.',confirmed_account_required:'Esta conta precisa existir e confirmar o e-mail antes de receber acesso.',session_required:'Entre novamente para continuar.',manager_required:'Este módulo exige acesso de gestor.',pluggy_credentials_missing:'Cadastre as credenciais da Pluggy no backend para conectar uma conta.',focus_homologation_credentials_missing:'Falta a credencial de homologação da Focus NFe no backend.',fiscal_production_not_validated:'A emissão real aguarda configuração e validação fiscal.',ai_credentials_or_model_missing:'A análise por IA aguarda chave e modelo válidos no backend. A revisão de entradas continua disponível.',daily_limit_or_reservation_failed:'O limite diário da análise por IA foi atingido ou a reserva não pôde ser feita.',already_submitted_poll_status:'Esta nota já foi enviada. Consulte o resultado antes de qualquer nova tentativa.',bank_connection_requires_attention:'A conexão bancária precisa de atualização ou confirmação no provedor.',operation_failed:'A operação não foi confirmada. Confira o estado antes de tentar novamente.'};
function explain(e){return errors[e.message]||e.message||'Não foi possível concluir a operação.';}
async function run(button,fn){if(button)button.disabled=true;try{await fn();}catch(e){notice(explain(e),true);}finally{if(button)button.disabled=false;}}
async function api(action,body={}){
 const {data:{session}}=await db.auth.getSession();if(!session)throw new Error('session_required');
 const response=await fetch('https://wvgmabqecrlydsranknn.supabase.co/functions/v1/capisol-office',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,apikey:'sb_publishable_yY2ciEDXntw2cvZJAcF6DQ_bwQUGEMv','Content-Type':'application/json'},body:JSON.stringify({action,workspace_id:workspace.id,...body}),signal:AbortSignal.timeout(65000)});
 const result=await response.json();if(!response.ok)throw new Error(result.details?.join('\n')||result.error||'operation_failed');return result;
}
async function list(table){const {data,error}=await db.from(table).select('*').eq('workspace_id',workspace.id).order('created_at',{ascending:false}).limit(500);if(error)throw error;return data;}
async function load(){
 const tables={tasks:'capisol_tasks',...(financial()?{suppliers:'capisol_suppliers',proposals:'capisol_proposals',subscriptions:'capisol_subscriptions',fiscal:'capisol_fiscal_documents',bank:'capisol_bank_connections',transactions:'capisol_bank_transactions',runs:'capisol_agent_runs'}:{}),
 ...(moduleAllowed('rural')?{ruralProducers:'capisol_rural_producers',ruralProperties:'capisol_rural_properties'}:{}),
 ...(moduleAllowed('media')?{mediaJobs:'capisol_media_jobs',tracks:'capisol_content_tracks'}:{})};
 const results=await Promise.all(Object.entries(tables).map(async([key,table])=>[key,await list(table)]));data=Object.fromEntries(results);
 const members=await db.rpc('capisol_office_members',{p_workspace:workspace.id});if(members.error)throw members.error;data.members=members.data;
 if(financial()){const insights=await db.rpc('capisol_office_legacy_insights',{p_workspace:workspace.id});data.legacy=insights.error?null:insights.data;try{provider=await api('status');}catch(e){provider=null;notice('Cadastros disponíveis; não foi possível verificar as integrações: '+explain(e),true);}}
 if(results.some(([,rows])=>rows.length===500))notice('Exibindo até 500 registros por módulo. Use a gestão original para consultar o histórico completo.');
}
function pill(status){return `<span class="pill ${['done','active','authorized','synced','won','completed'].includes(status)?'good':['uncertain','rejected','blocked','failed'].includes(status)?'bad':'warn'}">${esc(statuses[status]||status)}</span>`;}
function empty(title,text){return `<div class="empty"><strong>${esc(title)}</strong>${esc(text)}</div>`;}
function table(headers,rows){return rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty('Nenhum registro ainda','Use o botão acima para cadastrar. Os dados serão salvos na empresa selecionada.');}
function memberName(id){if(!id)return 'Sem responsável';if(id===user.id)return 'Você';return data.members.find(m=>m.user_id===id)?.display_name||id.slice(0,8);}
function navigate(next){tab=next;render();}
function render(){
 $('title').textContent=nav.find(x=>x[0]===tab)?.[1]||'Escritório';
 $('nav').innerHTML=nav.filter(([id])=>id==='rural'?tenantMode(workspace).rural&&moduleAllowed('rural'):id==='content'||id==='media'?moduleAllowed('media'):financial()||['overview','tasks','sectors'].includes(id))
 .map(([id,label])=>`<button data-nav="${id}" class="${id===tab?'active':''}">${label}</button>`).join('');
 $('nav').querySelectorAll('button').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
 const content=$('content');content.innerHTML='';
 if(tab==='overview')renderOverview();
 else if(tab==='quality')renderQuality();
 else if(tab==='sectors')renderSectors();
 else if(tab==='bank')renderBank();
 else if(tab==='audit')run(null,renderAudit);
 else if(tab==='rural')renderRural();
 else if(tab==='content')renderContentStudio();
 else if(tab==='media')renderMediaStudio();
 else if(tab==='access')renderAccess();
 else renderRecords();
}
function renderOverview(){
 const m=summarize(data);
 $('content').innerHTML=`<section class="hero"><div><span class="eyebrow" style="color:#f9cb4d">ROTINA • EVIDÊNCIA • RESULTADO</span><h2>Um lugar para acompanhar a execução.</h2><p>${esc(workspace.name)} · tarefas, propostas, recorrência e integrações com o mesmo acesso.</p></div><button class="gold" id="hero-task">Criar tarefa</button></section>
 <div class="grid">${[['Tarefas abertas',m.open,'Escopo do seu acesso'],['Tarefas atrasadas',m.overdue,'Prazo vencido'],['Pendências de cadastro',m.incomplete,'Sem dono, prazo ou objetivo'],...(financial()?[['MRR contratado',money(m.mrr),'Assinaturas ativas deste escritório'],['Propostas em aberto',money(m.pipeline),'Rascunhos, revisão e aprovadas'],['Contribuição estimada',money(m.contribution),'Vendas ganhas menos custo estimado']]:[])].map(([label,value,sub])=>`<article class="card stat"><span class="label">${label}</span><strong class="value">${value}</strong><span class="muted">${sub}</span></article>`).join('')}</div>
 <div class="split"><section class="card"><h2>Próximas decisões</h2><ul>${m.overdue?`<li>Revisar ${m.overdue} tarefa(s) atrasada(s).</li>`:''}${m.blocked?`<li>Resolver ${m.blocked} bloqueio(s) de execução.</li>`:''}${m.losses?`<li>Revisar ${m.losses} proposta(s) com custo superior ao preço.</li>`:''}${m.incomplete?`<li>Completar responsável, prazo e objetivo de ${m.incomplete} tarefa(s).</li>`:''}${!m.open?'<li>Definir as primeiras prioridades com responsável e critério de conclusão.</li>':''}</ul><p class="muted">Indicadores calculados sobre os cadastros deste escritório. O histórico anterior permanece na gestão e CRM.</p><a class="button" href="../">Abrir histórico da gestão ↗</a></section><section class="card"><h2>Conexões verificadas</h2>${financial()?integrationSummary():'<p>Você vê suas tarefas e os procedimentos dos setores. Os dados financeiros são restritos aos gestores.</p>'}</section></div>`;
 $('hero-task').disabled=role==='viewer';$('hero-task').onclick=()=>edit('tasks');
}
function renderQuality(){
 const legacy=data.legacy;
 if(!legacy){$('content').innerHTML=empty('Histórico não autorizado para esta conta','Este painel exige acesso total à gestão CAPISOL original, além do vínculo à empresa. Os outros módulos continuam disponíveis.');return;}
 const counts=legacy.counts||{},q=legacy.quality||{},n=counts.propostas||0,accepted=q.accepted_proposals||0;
 const actions=[];
 if(q.leads_without_phone)actions.push(`Conferir contato de ${q.leads_without_phone} lead(s) antes de preparar atendimento.`);
 if(q.leads_without_source)actions.push(`Registrar a origem de ${q.leads_without_source} lead(s) para medir os canais de aquisição.`);
 if(q.leads_without_owner)actions.push(`Distribuir ${q.leads_without_owner} lead(s) sem vendedor entre responsáveis com capacidade.`);
 if(q.active_subscriptions_missing_price)actions.push(`Revisar ${q.active_subscriptions_missing_price} assinatura(s) ativa(s) sem mensalidade informada.`);
 $('content').innerHTML=`<section class="hero"><div><span class="eyebrow" style="color:#f9cb4d">BASE REAL DA GESTÃO</span><h2>Qualidade dos dados e oportunidades</h2><p>Consulta ao histórico existente, sem copiar nem alterar cadastros. Atualizado em ${esc(new Date(legacy.checked_at).toLocaleString('pt-BR'))}.</p></div><a class="button" href="../">Abrir CRM ↗</a></section><div class="grid">${[['Leads',counts.leads||0],['Clientes',counts.clientes||0],['Propostas',n],['Contratos',counts.contratos||0],['Obras',counts.obras||0],['Assinaturas',counts.assinaturas||0]].map(([label,value])=>`<article class="card stat"><span class="label">${label}</span><strong class="value">${value}</strong><span class="muted">Registros históricos</span></article>`).join('')}</div><div class="split"><section class="card"><h2>Prioridades de revisão</h2><ol>${actions.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Nenhuma ausência foi encontrada nos campos verificados. Isso não substitui a conferência documental.</li>'}</ol><p class="muted">Revisão de completude, não validação automática de veracidade.</p></section><section class="card"><h2>Propostas aceitas</h2><p>${accepted} de ${n} propostas históricas${n?` (${(accepted/n*100).toFixed(1)}%)`:''}.</p><p class="muted">A proporção considera toda a base e não representa conversão mensal. ${n<30?'Amostra inferior a 30 propostas; evite conclusões fortes.':''}</p></section></div><h2 style="margin-top:24px">Distribuição dos leads por etapa</h2>${table(['Etapa registrada','Quantidade'],Object.entries(legacy.lead_stages||{}).map(([stage,count])=>[esc(stage),String(count)]))}`;
}
function integrationSummary(){return `<p>Banco de dados <span class="pill good">Conectado</span></p><p>Pluggy ${pill(provider?.open_finance.configured?'configurada':'aguardando credenciais')}</p><p>Focus NFe ${pill(provider?.fiscal.production_enabled?'produção habilitada':provider?.fiscal.homologation_configured?'homologação configurada':'aguardando configuração')}</p><p>IA dos setores ${pill(provider?.ai.configured?'configurada':'aguardando chave/modelo')}</p><p class="muted">Configuração não comprova homologação. A conexão bancária exige consentimento; a nota só aparece como autorizada após resposta do provedor.</p>`;}
const definitions={
 tasks:{title:'Tarefa',table:'capisol_tasks',fields:[['title','Título','text'],['sector','Setor','sector'],['objective','Objetivo e critério de conclusão','textarea'],['assignee_id','Responsável','member'],['due_date','Prazo','date'],['priority','Prioridade','priority'],['status','Estado','task_status'],['evidence','Evidências e resultado','textarea']]},
 suppliers:{title:'Fornecedor',table:'capisol_suppliers',fields:[['name','Nome','text'],['category','Categoria','text'],['contact','Contato comercial','text'],['notes','Condições e validade das cotações','textarea']]},
 proposals:{title:'Proposta',table:'capisol_proposals',fields:[['customer','Cliente','text'],['description','Escopo','textarea'],['price','Preço final (R$)','number'],['estimated_cost','Custo total estimado (R$)','number'],['valid_until','Válida até','date'],['status','Estado','proposal_status']]},
 subscriptions:{title:'Assinatura CAPISOL+',table:'capisol_subscriptions',fields:[['customer','Cliente','text'],['plan','Plano e serviços incluídos','text'],['monthly_value','Mensalidade (R$)','number'],['next_due','Próximo vencimento','date'],['status','Estado','subscription_status']]},
 fiscal:{title:'Rascunho fiscal',table:'capisol_fiscal_documents',fields:[['customer','Tomador','text'],['description','Descrição do serviço próprio','textarea'],['amount','Valor do serviço (R$)','number'],['environment','Ambiente','environment'],['payload','Dados fiscais Focus NFS-e Nacional (JSON validado pelo contador)','json']]}
};
function renderRecords(){
 const key=tab,rows=data[key]||[];
 let desc={tasks:'Defina dono, prazo e resultado esperado. Para concluir, registre uma evidência.',suppliers:'Cadastro e comparação documental. Nenhum pedido de compra é realizado aqui.',proposals:'Valores estimados para revisão comercial. Custo total deve incluir impostos, comissão, frete e execução.',subscriptions:'Controle de contratos recorrentes. O cadastro não realiza cobrança automática.',fiscal:'NFS-e de serviços próprios. A emissão real depende da configuração fiscal e da confirmação de um sócio.'}[key];
 $('content').innerHTML=`<div class="bar"><p class="muted">${desc}</p><button class="primary" id="new">Novo registro</button></div><div id="records"></div>`;
 const editButton=x=>`<button data-edit="${x.id}">Editar</button>`;
 let headers,values;
 if(key==='tasks'){headers=['Tarefa / setor','Responsável','Prazo','Estado',''];values=rows.map(x=>[`${esc(x.title)}<div class="muted">${esc(sectors.find(s=>s.sector===x.sector)?.name)}</div>`,esc(memberName(x.assignee_id)),esc(x.due_date||'Sem prazo'),pill(x.status),editButton(x)]);}
 if(key==='suppliers'){headers=['Fornecedor','Categoria','Contato',''];values=rows.map(x=>[esc(x.name),esc(x.category),esc(x.contact),editButton(x)]);}
 if(key==='proposals'){headers=['Cliente','Preço','Contribuição estimada','Validade','Estado',''];values=rows.map(x=>[esc(x.customer),money(x.price),money(Number(x.price)-Number(x.estimated_cost)),esc(x.valid_until),pill(x.status),editButton(x)]);}
 if(key==='subscriptions'){headers=['Cliente','Plano','Mensalidade','Vencimento','Estado',''];values=rows.map(x=>[esc(x.customer),esc(x.plan),money(x.monthly_value),esc(x.next_due),pill(x.status),editButton(x)]);}
 if(key==='fiscal'){headers=['Tomador / referência','Valor','Ambiente','Estado','Ações'];values=rows.map(x=>[`${esc(x.customer)}<div class="muted">${esc(x.id.slice(0,8))}</div>`,money(x.amount),x.environment==='production'?'Produção':'Homologação',pill(x.status),`<div class="actions">${['draft','review'].includes(x.status)?editButton(x)+`<button data-issue="${x.id}">${x.environment==='production'?'Emitir nota':'Testar emissão'}</button>`:`<button data-poll="${x.id}">Consultar resultado</button>`}${safeLink(x.pdf_url,'PDF')}${safeLink(x.xml_url,'XML')}</div>`]);}
 $('records').innerHTML=table(headers,values);$('new').disabled=role==='viewer';$('new').onclick=()=>edit(key);
 $('records').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(key,rows.find(x=>x.id===b.dataset.edit)));
 $('records').querySelectorAll('[data-issue]').forEach(b=>b.onclick=()=>issue(rows.find(x=>x.id===b.dataset.issue)));
 $('records').querySelectorAll('[data-poll]').forEach(b=>b.onclick=()=>run(b,async()=>{await api('fiscal_poll',{document_id:b.dataset.poll});await load();render();notice('Estado fiscal atualizado pelo provedor.');}));
}
function safeLink(url,label){try{const u=new URL(url);if(u.protocol!=='https:'||!u.hostname.endsWith('.focusnfe.com.br'))return '';return `<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;}catch{return '';}}
const options={task_status:['planned','active','blocked','review','done','cancelled'],proposal_status:['draft','review','approved','won','lost'],subscription_status:['draft','active','paused','cancelled'],environment:['homologation','production'],priority:[1,2,3]};
function showForm(title,fields,values,onSave){
 $('form-title').textContent=title;$('form-error').textContent='';
 $('fields').innerHTML=fields.map(([key,label,type])=>{
  const v=values[key]??'';let input;
  if(type==='textarea'||type==='json')input=`<textarea id="field-${key}" name="${key}" ${type==='json'?'rows="12"':''}>${esc(type==='json'?JSON.stringify(v||{},null,2):v)}</textarea>`;
  else if(options[type]||type==='sector'||type==='member'){
   const opts=type==='sector'?sectors.map(s=>[s.sector,`${s.sector}. ${s.name}`]):type==='member'?[['','Sem responsável'],...data.members.filter(m=>m.active!==false).map(m=>[m.user_id,memberName(m.user_id)])]:options[type].map(x=>[x,statuses[x]||({homologation:'Homologação (teste)',production:'Produção (nota real)'}[x])||x]);
   input=`<select id="field-${key}" name="${key}">${opts.map(([k,l])=>`<option value="${esc(k)}" ${String(k)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  }else input=`<input id="field-${key}" name="${key}" type="${type}" value="${esc(v)}" ${type==='number'?'min="0" step="0.01"':''} ${['title','name','customer','plan','valid_until','next_due','price','amount'].includes(key)?'required':''}>`;
  return `<label for="field-${key}">${esc(label)}</label>${input}`;
 }).join('');
 $('editor').onsubmit=async e=>{e.preventDefault();$('save').disabled=true;$('form-error').textContent='';try{
  const vals=Object.fromEntries(new FormData(e.target));for(const [key,,type] of fields){if(type==='number'||type==='sector'||type==='priority')vals[key]=Number(vals[key]);if(type==='json')vals[key]=JSON.parse(vals[key]||'{}');}
  await onSave(vals);$('modal').close();
 }catch(error){$('form-error').textContent=explain(error);}finally{$('save').disabled=false;}};
 $('modal').showModal();
}
function edit(key,row={}){
 const d=definitions[key];const defaults=key==='tasks'?{sector:1,status:'planned',priority:2,assignee_id:user.id}:key==='fiscal'?{environment:'homologation',payload:{cnpj_prestador:workspace.cnpj}}:{status:'draft'};
 showForm(`${row.id?'Editar':'Novo'} · ${d.title}`,d.fields,{...defaults,...row},async values=>{
  if(key==='tasks'){values.assignee_id=values.assignee_id||null;values.due_date=values.due_date||null;if(values.status==='done'&&values.evidence.trim().length<10)throw new Error('Descreva a evidência da conclusão (mínimo 10 caracteres).');}
  if(key==='fiscal'){values.payload.valor_servico=values.amount;values.payload.descricao_servico=values.description;}
  if(key==='proposals'&&values.price<values.estimated_cost&&['approved','won'].includes(values.status)&&role!=='admin')throw new Error('Uma proposta com prejuízo estimado precisa de revisão dos sócios.');
  let query=row.id?db.from(d.table).update(values).eq('workspace_id',workspace.id).eq('id',row.id).eq('updated_at',row.updated_at):db.from(d.table).insert({...values,workspace_id:workspace.id});
  const result=await query.select('id');if(result.error)throw result.error;if(!result.data.length)throw new Error('O registro mudou ou seu acesso não permite esta alteração. Atualize a página.');
  await load();render();notice('Registro salvo no banco de dados.');
 });
}
function issue(doc){
 const validation=validateFiscal(doc,workspace.cnpj);if(validation.length){notice(validation.join(' · '),true);return;}
 const phrase=doc.environment==='production'?'EMITIR NOTA REAL':'TESTAR HOMOLOGACAO';
 showForm('Confirmar envio fiscal',[['confirmation',`Digite ${phrase} para enviar a nota de ${money(doc.amount)}`,'text']],{},async values=>{
  if(values.confirmation!==phrase)throw new Error('A confirmação deve corresponder ao texto indicado.');
  await api('fiscal_submit',{document_id:doc.id,confirmation:values.confirmation});await load();render();notice('Solicitação recebida pelo provedor. Consulte o resultado para confirmar a autorização.');
 });
}
function renderSectors(){
 $('content').innerHTML=`<div class="bar"><p class="muted">72 procedimentos de revisão. O resultado é um rascunho até a validação do responsável.</p><input id="sector-search" aria-label="Buscar setor" placeholder="Buscar setor ou rotina…"></div><div id="sector-list" class="grid sectors"></div>`;
 const draw=()=>{const q=$('sector-search').value.toLocaleLowerCase('pt-BR');$('sector-list').innerHTML=sectors.filter(s=>(s.name+' '+s.routine).toLocaleLowerCase('pt-BR').includes(q)).map(s=>`<article class="card"><span class="eyebrow">SETOR ${String(s.sector).padStart(2,'0')}</span><h3>${esc(s.name)}</h3><p class="muted">${esc(s.routine)}</p><details><summary>Etapas e indicador</summary><ol>${s.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="muted">${esc(s.metric)}</p></details><button data-sector="${s.sector}">Iniciar revisão</button></article>`).join('');$('sector-list').querySelectorAll('button').forEach(b=>b.onclick=()=>sectorForm(sectors.find(s=>s.sector===Number(b.dataset.sector))));};$('sector-search').oninput=draw;draw();
}
function sectorForm(sector){
 showForm(sector.routine,sector.inputs.map((x,i)=>[`input${i}`,x,'textarea']),{},async values=>{
  const inputs=Object.fromEntries(sector.inputs.map((x,i)=>[x,values[`input${i}`]]));const result=reviewSector(sector,inputs);
  if(!result.ready)throw new Error('Complete as evidências: '+result.missing.join(', '));
  $('content').innerHTML=`<section class="card"><span class="eyebrow">SETOR ${sector.sector} • REVISÃO DE ENTRADAS</span><h2>${esc(sector.routine)}</h2><p>Entradas preenchidas. A veracidade dos dados ainda precisa de conferência.</p><ol>${result.next.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="muted">Indicador: ${esc(result.metric)} · Validação: ${esc(result.professionalReview)}</p><div class="actions"><button id="make-task" class="primary">Transformar em tarefa</button><button id="copy-prompt">Copiar roteiro de análise</button>${financial()?'<button id="ai-run">Gerar análise por IA</button>':''}<button id="back-sectors">Voltar aos setores</button></div><pre id="analysis">${esc(result.prompt)}</pre></section>`;
  $('back-sectors').onclick=render;
  $('copy-prompt').onclick=e=>run(e.target,async()=>{await navigator.clipboard.writeText(result.prompt);notice('Roteiro copiado.');});
  $('make-task').onclick=()=>edit('tasks',{title:sector.routine,sector:sector.sector,objective:result.prompt,status:'planned',assignee_id:user.id});
  if($('ai-run'))$('ai-run').onclick=e=>run(e.target,async()=>{const response=await api('analyze_sector',{sector:sector.sector,inputs});$('analysis').textContent=response.output;notice('Rascunho da IA salvo na auditoria. Revise antes de usar.');});
 });
}
function renderBank(){
 $('content').innerHTML=`<section class="card"><h2>Contas conectadas com consentimento</h2><p class="muted">Consulta de transações efetivadas de contas bancárias nos últimos 90 dias. A sincronização é manual; não inicia pagamentos nem transferências.</p><button id="connect" class="primary">Conectar conta pela Pluggy</button><p class="muted">${provider?.open_finance.configured?'Credenciais configuradas. O titular confirma o consentimento no ambiente da Pluggy.':'Aguardando credenciais da Pluggy no backend.'}</p></section><div id="connections">${table(['Conexão','Estado','Última sincronização','Ações'],(data.bank||[]).map(x=>[esc(x.provider_item_id),pill(x.status),esc(x.synced_at?new Date(x.synced_at).toLocaleString('pt-BR'):'Ainda não sincronizada'),`<div class="actions"><button data-sync="${x.id}" ${x.revoked_at?'disabled':''}>Sincronizar</button><button data-revoke="${x.id}" ${x.status==='revoked'?'disabled':''}>Revogar</button></div>`]))}</div><h2 style="margin-top:28px">Transações importadas</h2><p class="muted">Importação para conferência. Não representa conciliação contábil automática.</p>${table(['Data','Descrição','Valor','Moeda'],(data.transactions||[]).map(x=>[esc(x.date),esc(x.description),money(x.amount),esc(x.currency)]))}`;
 $('connect').onclick=e=>run(e.target,async()=>{
  const token=await api('connect_token');
  if(!window.PluggyConnect)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.pluggy.ai/pluggy-connect/v2.3.1/pluggy-connect.js';script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar o ambiente Pluggy.'));document.head.append(script);});
  const connect=new window.PluggyConnect({connectToken:token.accessToken,includeSandbox:false,onSuccess:({item})=>run(null,async()=>{await api('bank_register',{item_id:item.id});await load();render();notice('Conta vinculada. Use Sincronizar para importar as transações.');}),onError:()=>notice('A conexão não foi concluída. Verifique a mensagem no ambiente Pluggy.',true)});connect.init();
 });
 document.querySelectorAll('[data-sync]').forEach(b=>b.onclick=()=>run(b,async()=>{const r=await api('bank_sync',{connection_id:b.dataset.sync});await load();render();notice(`${r.imported} transações conferidas no período ${r.from} a ${r.to}. ${r.complete?'Sincronização concluída.':'Importação parcial; o histórico completo precisa de revisão da paginação pelo suporte.'}`);}));
 document.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=()=>showForm('Revogar conexão bancária',[['confirm','Digite REVOGAR para interromper o acesso','text']],{},async v=>{if(v.confirm!=='REVOGAR')throw new Error('Digite REVOGAR.');await api('bank_revoke',{connection_id:b.dataset.revoke});await load();render();notice('Conexão revogada. Os registros já importados permanecem no histórico.');}));
}
async function renderAudit(){
 const {data:events,error}=await db.from('capisol_office_audit').select('*').eq('workspace_id',workspace.id).order('at',{ascending:false}).limit(100);if(error)throw error;if(tab!=='audit')return;
 $('content').innerHTML=`<p class="muted">Últimos 100 eventos do novo escritório. Histórico gerado pelo banco; não pode ser editado pela interface.</p>${table(['Data','Registro','Ação','Responsável'],events.map(x=>[esc(new Date(x.at).toLocaleString('pt-BR')),esc(x.entity+' · '+x.record_id.slice(0,8)),esc(x.action),esc(x.actor?memberName(x.actor):'Backend')]))}<h2 style="margin-top:28px">Análises dos setores</h2>${(data.runs||[]).map(r=>`<details class="card"><summary>Setor ${r.sector} · ${esc(r.model)} · ${esc(r.status)} · ${esc(new Date(r.created_at).toLocaleString('pt-BR'))}</summary><pre>${esc(r.output||'Sem resultado confirmado.')}</pre></details>`).join('')||empty('Nenhuma análise por IA registrada','As revisões de entradas funcionam sem consumo de IA.')}`;
}
function renderAccess(){
 $('content').innerHTML=`<section class="card"><h2>Equipe da empresa</h2><p class="muted">Sócios administram os acessos. Gestores acompanham os dados do escritório; operadores veem e editam tarefas atribuídas a eles; observadores apenas consultam suas tarefas.</p>${role==='admin'?'<button id="add-member" class="primary">Cadastrar acesso</button>':''}</section>${table(['Conta','Perfil','Acesso'],data.members.map(x=>[esc(memberName(x.user_id)),esc(x.role),x.active===false?'Revogado':role==='admin'&&x.role!=='admin'?`<button data-revoke-member="${x.user_id}">Revogar</button>`:'Ativo']))}<section class="card" style="margin-top:20px"><h2>Acesso individual</h2><p class="muted">Cada pessoa utiliza sua conta. Para receber acesso, a conta precisa estar cadastrada e com e-mail confirmado na gestão. Este painel não altera as permissões do CRM anterior.</p><a href="../" class="button">Abrir cadastro e acesso da gestão ↗</a></section>`;
 document.querySelectorAll('[data-revoke-member]').forEach(b=>b.onclick=()=>run(b,async()=>{const r=await db.rpc('capisol_office_revoke_member',{p_workspace:workspace.id,p_user:b.dataset.revokeMember});if(r.error)throw r.error;await load();render();notice('Acesso ao escritório revogado. As tarefas e evidências foram preservadas.');}));
 if($('add-member'))$('add-member').onclick=()=>showForm('Cadastrar acesso',[['email','E-mail da conta já confirmada','email'],['role','Perfil: manager, operator ou viewer','text']],{role:'operator'},async v=>{if(!['manager','operator','viewer'].includes(v.role))throw new Error('Perfil inválido.');const r=await db.rpc('capisol_office_add_member',{p_workspace:workspace.id,p_email:v.email,p_role:v.role});if(r.error)throw r.error;await load();render();notice('Acesso atualizado.');});
}
async function initialize(){
 const {data:{session}}=await db.auth.getSession();user=session?.user;
 if(!user){$('content').innerHTML=`<section class="card login"><span class="eyebrow">ACESSO INDIVIDUAL</span><h2>Entre no escritório</h2><p class="muted">Use a mesma conta da gestão CAPISOL.</p><form id="login"><label for="email">E-mail</label><input id="email" type="email" autocomplete="username" required><label for="password">Senha</label><input id="password" type="password" autocomplete="current-password" required><button class="primary">Entrar</button></form><p class="muted"><a href="../">Criar conta ou recuperar senha na gestão ↗</a></p></section>`;$('login').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{const r=await db.auth.signInWithPassword({email:$('email').value,password:$('password').value});if(r.error)throw new Error('E-mail ou senha não conferem. Use a recuperação na gestão se necessário.');notice();await initialize();});};return;}
 $('logout').hidden=false;$('logout').onclick=e=>run(e.target,async()=>{const r=await db.auth.signOut();if(r.error)throw r.error;location.reload();});
 const response=await db.from('capisol_workspaces').select('*').order('name');if(response.error)throw response.error;workspaces=response.data;
 if(!workspaces.length){$('content').innerHTML=empty('Sua conta ainda não tem acesso ao escritório','Solicite a um sócio o vínculo à empresa. Seu cadastro da gestão permanece disponível.');return;}
 workspace=workspaces[0];$('workspace').hidden=false;$('workspace').innerHTML=workspaces.map(w=>`<option value="${w.id}">${esc(w.name)}</option>`).join('');
 const activate=async()=>{workspace=workspaces.find(w=>w.id===$('workspace').value)||workspace;const r=await db.rpc('capisol_workspace_role',{p_workspace:workspace.id});if(r.error)throw r.error;role=r.data;const grants=await db.from('capisol_workspace_scopes').select('scope').eq('workspace_id',workspace.id).eq('user_id',user.id).eq('active',true);accessScopes=grants.error?[]:(grants.data||[]).map(g=>g.scope);await load();render();};
 $('workspace').onchange=()=>run(null,activate);$('refresh').hidden=false;$('refresh').onclick=e=>run(e.target,async()=>{notice();await load();render();});
 const r=await fetch('../biblioteca/setores-operacionais.json',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Biblioteca de setores indisponível.');sectors=(await r.json()).sectors;await activate();
}
$('close').onclick=()=>$('modal').close();
run(null,initialize);
