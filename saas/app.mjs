import {money,statuses,summarize,reviewSector,validateFiscal} from './domain.mjs';
import {tenantMode,validateRural,generateEditorialTracks,CONTENT_PILLARS,sectorApplicability} from './verticals.mjs';
import {MODULES,MODULE_FAMILIES,SCALE_LEVELS,CATALOG_SUMMARY,scaleCheck,listForIndustry} from './module-registry.mjs';
import {RADAR_STAGES,RADAR_CLASSIFICATIONS,groupRadar,filterRadar,reviewInput} from './partner-radar.mjs';
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=window.supabase.createClient('https://wvgmabqecrlydsranknn.supabase.co','sb_publishable_yY2ciEDXntw2cvZJAcF6DQ_bwQUGEMv');
let user,workspace,workspaces=[],role,tab='overview',sectors=[],data={},provider=null,accessScopes=[];
const nav=[['overview','Visão geral'],['quality','Dados e crescimento'],['tasks','Tarefas e execução'],['sectors','72 setores'],['suppliers','Fornecedores'],['partnerRadar','Radar de prestadores AC/RO'],['proposals','Propostas'],['subscriptions','CAPISOL+'],['bank','Open Finance'],['fiscal','Notas fiscais'],['audit','Auditoria'],['access','Equipe e acessos'],['rural','Produtores rurais'],['content','Estúdio de conteúdo'],['media','Vídeos e cortes'],['modules','Catálogo de módulos'],['workbench','Operações multissetoriais']];
const financial=()=>['admin','manager'].includes(role);
const isCapisol=()=>workspace?.cnpj==='66360677000149';
const menuLabel=(id,label)=>id==='subscriptions'&&!isCapisol()?'Assinaturas':label;
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
 const tables={tasks:'capisol_tasks',...(financial()?{partnerRadar:'capisol_partner_radar',suppliers:'capisol_suppliers',proposals:'capisol_proposals',subscriptions:'capisol_subscriptions',fiscal:'capisol_fiscal_documents',bank:'capisol_bank_connections',transactions:'capisol_bank_transactions',runs:'capisol_agent_runs'}:{}),
 ...(moduleAllowed('rural')?{ruralProducers:'capisol_rural_producers',ruralProperties:'capisol_rural_properties'}:{}),
 ...(moduleAllowed('media')?{mediaJobs:'capisol_media_jobs',tracks:'capisol_content_tracks'}:{}),
 ...(financial()?{units:'capisol_org_units',stockItems:'capisol_stock_items',stockMoves:'capisol_stock_moves',
 cropCycles:'capisol_crop_cycles',cropObservations:'capisol_crop_observations',
 workOrders:'capisol_work_orders',newsStories:'capisol_newsroom_stories',communityEvents:'capisol_community_events'}:{})};
 const results=await Promise.all(Object.entries(tables).map(async([key,table])=>[key,await list(table)]));data=Object.fromEntries(results);
 const members=await db.rpc('capisol_office_members',{p_workspace:workspace.id});if(members.error)throw members.error;data.members=members.data;
 const invites=await db.rpc('capisol_my_pending_workspace_invites');data.invites=invites.error?[]:(invites.data||[]);
 if(role==='admin'){const g=await db.from('capisol_workspace_scopes').select('user_id,scope,active').eq('workspace_id',workspace.id);data.grants=g.error?[]:(g.data||[]);}
 if(financial()){if(isCapisol()){const insights=await db.rpc('capisol_office_legacy_insights',{p_workspace:workspace.id});data.legacy=insights.error?null:insights.data;}
 try{provider=await api('status');}catch(e){provider=null;notice('Cadastros disponíveis; não foi possível verificar as integrações: '+explain(e),true);}}
 if(results.some(([,rows])=>rows.length===500))notice('Exibindo até 500 registros por módulo. Use a gestão original para consultar o histórico completo.');
}
function pill(status){return `<span class="pill ${['done','active','authorized','synced','won','completed'].includes(status)?'good':['uncertain','rejected','blocked','failed'].includes(status)?'bad':'warn'}">${esc(statuses[status]||status)}</span>`;}
function empty(title,text){return `<div class="empty"><strong>${esc(title)}</strong>${esc(text)}</div>`;}
function table(headers,rows){return rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty('Nenhum registro ainda','Use o botão acima para cadastrar. Os dados serão salvos na empresa selecionada.');}
function memberName(id){if(!id)return 'Sem responsável';if(id===user.id)return 'Você';return data.members.find(m=>m.user_id===id)?.display_name||id.slice(0,8);}
function navigate(next){tab=next;render();}
function render(){
 $('title').textContent=menuLabel(tab,nav.find(x=>x[0]===tab)?.[1]||'Escritório');
 $('nav').innerHTML=nav.filter(([id])=>id==='rural'?tenantMode(workspace).rural&&moduleAllowed('rural'):id==='content'||id==='media'?moduleAllowed('media'):id==='modules'?true:id==='workbench'?financial():id==='partnerRadar'?financial()&&isCapisol():['quality','bank','fiscal'].includes(id)?isCapisol()&&financial():financial()||['overview','tasks','sectors'].includes(id))
 .map(([id,label])=>`<button data-nav="${id}" class="${id===tab?'active':''}">${esc(menuLabel(id,label))}</button>`).join('');
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
 else if(tab==='modules')renderModuleRegistry();
 else if(tab==='workbench')renderWorkBench();
 else if(tab==='partnerRadar')renderPartnerRadar();
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
  else if(options[type]||type==='sector'||type==='member'||type==='producer'||['orgunit','stockitem','cropcycle','ruralproperty'].includes(type)){
   const opts=type==='sector'?sectors.map(s=>[s.sector,`${s.sector}. ${s.name}`]):type==='member'?[['','Sem responsável'],...data.members.filter(m=>m.active!==false).map(m=>[m.user_id,memberName(m.user_id)])]:type==='producer'?(data.ruralProducers||[]).map(p=>[p.id,p.display_name]):type==='orgunit'?(data.units||[]).map(u=>[u.id,u.name]):type==='stockitem'?(data.stockItems||[]).map(x=>[x.id,x.sku+' · '+x.name]):type==='cropcycle'?(data.cropCycles||[]).map(x=>[x.id,x.culture+' · '+(x.planting_date||'sem data')]):type==='ruralproperty'?(data.ruralProperties||[]).map(x=>[x.id,x.name]):options[type].map(x=>[x,statuses[x]||({homologation:'Homologação (teste)',production:'Produção (nota real)'}[x])||x]);
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
 showForm(`${row.id?'Editar':'Novo'} · ${key==='subscriptions'&&!isCapisol()?'Assinatura':d.title}`,d.fields,{...defaults,...row},async values=>{
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
 const draw=()=>{const q=$('sector-search').value.toLocaleLowerCase('pt-BR');$('sector-list').innerHTML=sectors.filter(s=>(s.name+' '+s.routine).toLocaleLowerCase('pt-BR').includes(q)).map(s=>`<article class="card"><span class="eyebrow">SETOR ${String(s.sector).padStart(2,'0')}</span><h3>${esc(s.name)}</h3><p class="muted">${esc(s.routine)}</p><p class="muted">Aplicação: ${esc(sectorApplicability(s.sector,tenantMode(workspace)).level)} · ${esc(sectorApplicability(s.sector,tenantMode(workspace)).reason)}</p><details><summary>Etapas e indicador</summary><ol>${s.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="muted">${esc(s.metric)}</p></details><button data-sector="${s.sector}">Iniciar revisão</button></article>`).join('');$('sector-list').querySelectorAll('button').forEach(b=>b.onclick=()=>sectorForm(sectors.find(s=>s.sector===Number(b.dataset.sector))));};$('sector-search').oninput=draw;draw();
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

function renderRural(){
 if(!tenantMode(workspace).rural||!moduleAllowed('rural')){navigate('overview');return;}
 const producers=data.ruralProducers||[],properties=data.ruralProperties||[];
 $('content').innerHTML=`<section class="hero"><div><span class="eyebrow">GESTÃO RURAL • EMPRESA SEPARADA</span><h2>Produtores e propriedades</h2>
 <p>Cadastros privados desta empresa. Informe somente os 4 últimos dígitos do documento; cadastro não prova titularidade.</p></div></section>
 <div class="bar"><h2>Produtores</h2><button id="new-producer" class="primary">Cadastrar produtor</button></div>
 ${table(['Nome','Município','Atividade','Estado'],producers.map(x=>[esc(x.display_name),esc(x.municipality+' / '+x.state_code),esc(x.main_activity),esc(x.verification_state)]))}
 <div class="bar"><h2>Propriedades</h2><button id="new-property" class="primary">Cadastrar propriedade</button></div>
 ${table(['Propriedade','Produtor','Área (ha)','Município'],properties.map(x=>[esc(x.name),esc(producers.find(p=>p.id===x.producer_id)?.display_name||'Não encontrado'),esc(x.hectares??'Não informada'),esc(x.municipality)]))}
 <p class="muted">CADASTRO em rascunho. Para CAR, CCIR, documentos completos e regularidade agrária é obrigatório processo privado e conferência profissional.</p>`;
 $('new-producer').disabled=!moduleWritable('rural');
 $('new-property').disabled=!moduleWritable('rural')||!producers.length;
 $('new-producer').onclick=()=>showForm('Novo produtor rural',[
 ['display_name','Nome ou razão social','text'],['municipality','Município','text'],['state_code','UF','text'],
 ['document_last4','4 últimos dígitos CPF/CNPJ (opcional)','text'],['main_activity','Atividade: crops, livestock, agroforestry, aquaculture, mixed, other','text']
 ],{state_code:'AC',main_activity:'mixed'},async v=>{
  const errors=validateRural('producer',v);if(errors.length)throw Error(errors.join(' · '));
  const row={...v,workspace_id:workspace.id,kind:'person',verification_state:'draft',consent_confirmed:false};
  if(!row.document_last4)delete row.document_last4;
  const r=await db.from('capisol_rural_producers').insert(row).select('id');if(r.error)throw r.error;
  await load();render();notice('Produtor incluído, aguardando conferência.');
 });
 $('new-property').onclick=()=>showForm('Nova propriedade rural',[
 ['producer_id','Produtor responsável','producer'],['name','Nome da propriedade','text'],['municipality','Município','text'],
 ['state_code','UF','text'],['hectares','Hectares','number'],['activity','Atividade: crops, livestock, agroforestry, aquaculture, mixed, other','text']
 ],{producer_id:producers[0]?.id,state_code:'AC',activity:'mixed'},async v=>{
  const errors=validateRural('property',v);if(errors.length)throw Error(errors.join(' · '));
  if(!producers.some(p=>p.id===v.producer_id))throw Error('Produtor de outra empresa ou inexistente.');
  v.hectares=Number(v.hectares);
  const r=await db.from('capisol_rural_properties').insert({...v,workspace_id:workspace.id}).select('id');if(r.error)throw r.error;
  await load();render();notice('Propriedade incluída para conferência.');
 });
}
function renderContentStudio(){
 if(!moduleAllowed('media')){navigate('overview');return;}
 const tracks=data.tracks||[];
 $('content').innerHTML=`<section class="hero"><div><span class="eyebrow">CONTEÚDO AUTÊNTICO • PLANEJAMENTO INTERNO</span>
 <h2>12 pilares e cinco formatos por pilar</h2><p>60 vertentes editoriais, não 60 contas falsas. Nenhuma publicação automática configurada.</p></div></section>
 <div class="bar"><p>${tracks.length} pauta(s) registradas nesta empresa.</p>
 <button id="seed-tracks" class="primary">Cadastrar 60 pautas internas</button></div>
 <div class="grid sectors">${CONTENT_PILLARS.map((p,i)=>`<article class="card"><span class="eyebrow">PILAR ${String(i+1).padStart(2,'0')}</span><h3>${esc(p)}</h3>
 <p class="muted">Curtos, entrevistas, artigos, vídeo longo e carrossel.</p></article>`).join('')}</div>
 <p class="muted">Publicação externa precisa de conta oficial, direitos, aprovação humana, API homologada e métricas próprias.</p>`;
 $('seed-tracks').disabled=tracks.length>0||!moduleWritable('media');
 $('seed-tracks').onclick=e=>run(e.target,async()=>{
  const rows=generateEditorialTracks(workspace.id).map(({workspace_id,cluster_no,strand_no,label,platform,status,public_account_authorized})=>
   ({workspace_id,cluster_no,strand_no,label,platform,status,public_account_authorized}));
  const r=await db.from('capisol_content_tracks').insert(rows).select('id');if(r.error)throw r.error;
  await load();render();notice('60 pautas internas cadastradas; nenhuma conta ou post criado.');
 });
}
function renderMediaStudio(){
 if(!moduleAllowed('media')){navigate('overview');return;}
 const rows=data.mediaJobs||[];
 $('content').innerHTML=`<section class="hero"><div><span class="eyebrow">VÍDEOS BRUTOS E CLIPAGEM</span><h2>Fila de pós-produção</h2>
 <p>Os videomakers entregam o bruto. Clipadores/IA preparam cortes com revisão; nenhum post sai automaticamente.</p></div></section>
 <div class="bar"><p>${rows.length} trabalho(s) registrados.</p><button id="new-media" class="primary">Cadastrar vídeo bruto</button></div>
 ${table(['Material','Tipo','Estado','Direitos'],rows.map(x=>[esc(x.title),esc(x.media_kind),pill(x.state),x.rights_confirmed?'Confirmados':'Pendentes']))}
 <p class="muted">O cadastro de arquivo privado organiza a fila, mas não executa FFmpeg nem envia a redes sociais.</p>`;
 $('new-media').disabled=!moduleWritable('media');
 $('new-media').onclick=()=>showForm('Registrar arquivo original',[
 ['title','Título','text'],['original_storage_path','Caminho em armazenamento privado','text'],
 ['instructions','Instruções de corte e legendagem','textarea'],['confirmation','Digite TENHO AUTORIZACAO (direitos do vídeo)','text']
 ],{},async v=>{
  if(v.confirmation!=='TENHO AUTORIZACAO')throw Error('Confirme autorização de uso de imagem e direitos.');
  if(!/^[A-Za-z0-9_./-]{4,800}$/.test(v.original_storage_path)||v.original_storage_path.includes('..'))throw Error('Informe caminho privado válido, não URL pública.');
  const r=await db.from('capisol_media_jobs').insert({workspace_id:workspace.id,title:v.title,
    original_storage_path:v.original_storage_path,instructions:v.instructions,rights_confirmed:true,media_kind:'video',state:'draft'}).select('id');
  if(r.error)throw r.error;await load();render();notice('Arquivo cadastrado para revisão. Edição ainda não executada.');
 });
}


let operationMode='units',catalogShowAll=false,catalogLimit=50;
const operationalDefinitions={
 units:{label:'Unidades e filiais',table:'capisol_org_units',fields:[['name','Nome da unidade','text'],['unit_type','Tipo: headquarters, branch, warehouse, farm, workshop, newsroom, church, school, clinic, other','text'],['city','Município / cidade','text'],['state_code','UF','text'],['country_code','País (ISO-2)','text']]},
 stockItems:{label:'Estoque por unidade',table:'capisol_stock_items',fields:[['org_unit_id','Unidade / estoque','orgunit'],['sku','Código SKU','text'],['name','Nome do item','text'],['unit','Unidade (un, kg, g, l, ml, m, m2, box, bag)','text'],['min_quantity','Estoque mínimo','number']]},
 stockMoves:{label:'Entradas e saídas',table:'capisol_stock_moves',fields:[['stock_item_id','SKU / unidade','stockitem'],['move_type','Movimento: in (entrada) / out (saída)','text'],['quantity','Quantidade','number'],['reason','Motivo / documento de origem','textarea']]},
 cropCycles:{label:'Culturas e safras',table:'capisol_crop_cycles',fields:[['property_id','Propriedade rural','ruralproperty'],['culture','Cultura','text'],['cultivar','Variedade / cultivar','text'],['planting_date','Data do plantio','date'],['forecast_harvest_date','Previsão de colheita','date'],['area_ha','Hectares','number']]},
 cropObservations:{label:'Acompanhamento agronômico',table:'capisol_crop_observations',fields:[['crop_cycle_id','Safra registrada','cropcycle'],['observed_on','Data da observação','date'],['growth_stage','Fase da cultura','text'],['risk_flag','Risco: none, pest_suspected, disease_suspected, water_stress, other','text'],['note','Evidência de campo (sem prescrição automática)','textarea']]},
 workOrders:{label:'Mecânica e ordens de serviço',table:'capisol_work_orders',fields:[['org_unit_id','Unidade / oficina','orgunit'],['sector','Setor: mechanics, solar, field, retail, facility, agriculture, other','text'],['reference','Referência única da OS','text'],['asset_label','Equipamento ou veículo (sem documento pessoal)','text'],['description','Diagnóstico preliminar e serviço solicitado','textarea'],['estimated_cost','Custo estimado (R$)','number']]},
 newsStories:{label:'Jornalismo e redação',table:'capisol_newsroom_stories',fields:[['title','Título ou pauta','text'],['summary','Resumo para apuração','textarea'],['source_url','Fonte pública (URL, opcional)','text']]},
 communityEvents:{label:'Igrejas, associações e eventos',table:'capisol_community_events',fields:[['title','Nome do evento','text'],['venue','Local / espaço','text'],['starts_at','Início (data/hora)','datetime-local'],['ends_at','Término (data/hora, opcional)','datetime-local'],['event_kind','Tipo: community, faith, volunteer, education, fundraiser, other','text']]}
};
function renderModuleRegistry(){
 const root=$('content'),industry=tenantMode(workspace).industry;
 root.innerHTML=`<section class="hero"><div><span class="eyebrow">CATÁLOGO DE CAPACIDADES • NÃO É HOMOLOGAÇÃO</span>
 <h2>${CATALOG_SUMMARY.moduleCount} módulos em ${CATALOG_SUMMARY.familyCount} núcleos</h2>
 <p>72 procedimentos anteriores permanecem acessíveis. Cada módulo precisa de responsável, dados, segurança, integração e teste antes de executar.</p></div></section>
 <div class="bar"><label for="catalog-q">Pesquisar módulo</label><input id="catalog-q" placeholder="Ex.: oficina, plantio, estoque, jornal...">
 <label for="catalog-scale">Escala</label><select id="catalog-scale">${SCALE_LEVELS.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
 <div class="bar"><label for="catalog-family">Núcleo</label><select id="catalog-family"><option value="">Todos os núcleos</option>${MODULE_FAMILIES.map(f=>`<option value="${f.id}">${esc(f.name)} (${f.count})</option>`).join('')}</select>
 <label><input type="checkbox" id="catalog-all"> Mostrar também especialidades de outros mercados</label></div>
 <div id="catalog-scale-info" class="card"></div><p id="catalog-count" class="muted"></p><div id="catalog-cards" class="grid sectors"></div>
 <button id="catalog-more">Mostrar mais módulos</button>`;
 const draw=()=>{
  const q=$('catalog-q').value.toLocaleLowerCase('pt-BR'),family=$('catalog-family').value,scale=$('catalog-scale').value;
  const list=(catalogShowAll?MODULES:listForIndustry(industry)).filter(m=>(!family||m.family===family)
     &&(m.name+' '+m.familyName+' '+m.requiredRoles.join(' ')).toLocaleLowerCase('pt-BR').includes(q));
  const check=scaleCheck(scale);
  $('catalog-scale-info').innerHTML=`<strong>${esc(SCALE_LEVELS.find(x=>x.id===scale)?.name)}</strong>
   <p>${esc(check.needs.join(' · '))}</p><p class="muted">Pré-condições ainda não verificadas: ${esc(check.pending.join(', '))}. A escolha aqui não ativa escala de produção.</p>`;
  $('catalog-count').textContent=`${list.length} capacidades pertinentes à seleção · exibindo ${Math.min(catalogLimit,list.length)}. ${CATALOG_SUMMARY.distinction}`;
  $('catalog-cards').innerHTML=list.slice(0,catalogLimit).map(m=>`<article class="card"><span class="eyebrow">${esc(m.id)} · ${esc(m.familyName)}</span>
   <h3>${esc(m.name)}</h3><p class="muted">Profissionais: ${esc(m.requiredRoles.join(', '))}</p>
   <p><span class="pill warn">Especificado, não conectado</span></p>
   <p class="muted">Precisa de: ${esc(m.requirements.slice(0,4).join(', '))} e homologação.</p></article>`).join('');
  $('catalog-more').hidden=list.length<=catalogLimit;
 };
 $('catalog-q').oninput=()=>{catalogLimit=50;draw();};
 $('catalog-family').onchange=()=>{catalogLimit=50;draw();};
 $('catalog-scale').onchange=draw;
 $('catalog-all').onchange=()=>{catalogShowAll=$('catalog-all').checked;catalogLimit=50;draw();};
 $('catalog-more').onclick=()=>{catalogLimit+=50;draw();};
 draw();
}
function renderWorkBench(){
 if(!financial()){navigate('overview');return;}
 const root=$('content'),def=operationalDefinitions[operationMode],rows=data[operationMode]||[];
 const columns={
 units:['name','unit_type','city','country_code'],
 stockItems:['sku','name','unit','quantity','min_quantity'],
 stockMoves:['move_type','quantity','balance_after','reason','created_at'],
 cropCycles:['culture','cultivar','stage','planting_date','agronomist_review'],
 cropObservations:['growth_stage','risk_flag','professional_review','observed_on'],
 workOrders:['reference','sector','asset_label','status','estimated_cost'],
 newsStories:['title','summary','status','source_checked'],
 communityEvents:['title','venue','event_kind','status','starts_at']
 };
 root.innerHTML=`<section class="hero"><div><span class="eyebrow">MÓDULOS COM PERSISTÊNCIA · AUTOMAÇÃO EXTERNA DESATIVADA</span>
 <h2>Operações por empresa e unidade</h2><p>Estoque e cultura não acionam compras, defensivos ou máquinas; OS, jornais e eventos não emitem notas nem publicam conteúdos.</p></div></section>
 <div class="bar"><label for="operation-mode">Selecionar operação</label><select id="operation-mode">${Object.entries(operationalDefinitions).map(([k,v])=>`<option value="${k}" ${k===operationMode?'selected':''}>${esc(v.label)}</option>`).join('')}</select>
 <button class="primary" id="new-operation">Novo registro / movimento</button></div>
 ${table(columns[operationMode].map(c=>c.replaceAll('_',' ')),rows.map(x=>columns[operationMode].map(k=>esc(x[k]??'—'))))}
 <p class="muted">Movimentações de estoque são lançadas via RPC com ID de requisição e bloqueio de saldo negativo. Acessos são protegidos por RLS da empresa. Revisões profissionais continuam necessárias.</p>`;
 $('operation-mode').onchange=()=>{operationMode=$('operation-mode').value;renderWorkBench();};
 $('new-operation').onclick=()=>createOperation( operationMode );
 if(operationMode==='stockItems'&&!data.units?.length)$('new-operation').disabled=true;
 if(operationMode==='stockMoves'&&!data.stockItems?.length)$('new-operation').disabled=true;
 if(operationMode==='cropCycles'&&!data.ruralProperties?.length)$('new-operation').disabled=true;
 if(operationMode==='cropObservations'&&!data.cropCycles?.length)$('new-operation').disabled=true;
 if(operationMode==='workOrders'&&!data.units?.length)$('new-operation').disabled=true;
}
function createOperation(mode){
 const spec=operationalDefinitions[mode];
 if(!spec)throw Error('Módulo inválido');
 const idempotencyKey=crypto.randomUUID();
 const defaults={country_code:'BR',state_code:'AC',unit:'un',unit_type:'branch',move_type:'in',
    sector:'mechanics',risk_flag:'none',event_kind:'community'};
 showForm(spec.label,spec.fields,defaults,async v=>{
  if(mode==='stockMoves'){
   if(!['in','out'].includes(v.move_type)||!Number.isFinite(v.quantity)||v.quantity<=0||String(v.reason||'').trim().length<5)
    throw Error('Informe entrada ou saída, quantidade positiva e motivo com ao menos cinco caracteres.');
   const r=await db.rpc('capisol_stock_move',{p_workspace:workspace.id,p_item:v.stock_item_id,
    p_request:idempotencyKey,p_type:v.move_type,p_quantity:v.quantity,p_reason:v.reason});
   if(r.error)throw r.error;
   await load();render();notice('Movimentação lançada. Saldo confirmado: '+r.data);
   return;
  }
  if(mode==='units'){
   if(!['headquarters','branch','warehouse','farm','workshop','newsroom','church','school','clinic','other'].includes(v.unit_type))
    throw Error('Tipo de unidade inválido');
   if(!/^[A-Z]{2}$/.test(v.country_code))throw Error('País ISO-2 inválido');
  }
  if(mode==='stockItems'){
   if(!['un','kg','g','l','ml','m','m2','box','bag'].includes(v.unit)||v.min_quantity<0)
    throw Error('Unidade/quantidade mínima inválida');
   v.quantity=0;
  }
  if(mode==='cropCycles'&&(!v.culture||v.area_ha<0))throw Error('Cultura ou área inválida');
  if(mode==='cropObservations'){
   if(!['none','pest_suspected','disease_suspected','water_stress','other'].includes(v.risk_flag))
    throw Error('Classificação de risco inválida');
   v.professional_review='pending';
  }
  if(mode==='workOrders'){
   if(!['mechanics','solar','field','retail','facility','agriculture','other'].includes(v.sector))
     throw Error('Setor da ordem de serviço inválido');
   v.status='draft';
  }
  if(mode==='newsStories')v.status='pitch';
  if(mode==='communityEvents'){
   if(!['community','faith','volunteer','education','fundraiser','other'].includes(v.event_kind))throw Error('Tipo de evento inválido');
   if(!v.ends_at)delete v.ends_at;v.status='draft';
  }
  for(const k of Object.keys(v))if(v[k]==='')delete v[k];
  const r=await db.from(spec.table).insert({...v,workspace_id:workspace.id}).select('id');
  if(r.error)throw r.error;
  await load();render();notice('Registro criado na empresa selecionada, aguardando validação operacional.');
 });
}


let radarFilter={uf:'',stage:'',query:''};
function renderPartnerRadar(){
 if(!isCapisol()||!financial()){navigate('overview');return;}
 const rows=data.partnerRadar||[],metrics=groupRadar(rows);
 const filtered=filterRadar(rows,radarFilter);
 $('content').innerHTML=`<section class="hero"><div><span class="eyebrow" style="color:#f9cb4d">CAPISOL • PESQUISA DE FORNECEDORES</span>
 <h2>Radar de prestadores e parcerias AC/RO</h2><p>Candidatos públicos não são prestadores homologados, contratos ou contatos realizados. Nenhuma mensagem é enviada automaticamente.</p></div></section>
 <div class="grid">${[['Candidatos públicos',metrics.total],['Acre',metrics.ac],['Rondônia',metrics.ro],['Registrados como contatados',metrics.contacted],['Parcerias confirmadas',metrics.approved]].map(([label,value])=>
 `<article class="card stat"><span class="label">${esc(label)}</span><strong class="value">${value}</strong><span class="muted">Somente este radar</span></article>`).join('')}</div>
 <div class="bar" style="margin-top:22px"><label for="radar-uf">Estado</label><select id="radar-uf"><option value="">AC e RO</option>
 <option value="AC" ${radarFilter.uf==='AC'?'selected':''}>Acre</option><option value="RO" ${radarFilter.uf==='RO'?'selected':''}>Rondônia</option></select>
 <label for="radar-stage">Etapa</label><select id="radar-stage"><option value="">Todas</option>${Object.entries(RADAR_STAGES).map(([key,label])=>
 `<option value="${key}" ${radarFilter.stage===key?'selected':''}>${esc(label)}</option>`).join('')}</select>
 <label for="radar-query">Buscar</label><input id="radar-query" value="${esc(radarFilter.query)}" placeholder="Nome, serviço ou município"></div>
 <p class="muted">${filtered.length} candidato(s). Verifique CNAE, responsável técnico, NR-10/NR-35, ART, seguro, preço e capacidade antes de contratar. Fontes consultadas em 26/10/2026.</p>
 ${table(['Empresa / município','Classificação','Serviços','Contato público / fonte','Etapa / acompanhar'],
 filtered.map(x=>[
  `<strong>${esc(x.name)}</strong><div class="muted">${esc(x.municipality)} / ${esc(x.uf)}</div>`,
  esc(RADAR_CLASSIFICATIONS[x.classification]||x.classification),
  esc((x.services||[]).join(', ')),
  `<span>${esc(x.phone||'Não divulgado')}</span><div class="muted">${esc(x.email||'')}</div><a href="${esc(x.source_url)}" target="_blank" rel="noopener noreferrer">Verificar fonte ↗</a>`,
  `<strong>${esc(RADAR_STAGES[x.stage]||x.stage)}</strong><div class="muted">${esc(x.review_note||'Sem análise registrada')}</div><button data-radar-review="${esc(x.id)}">Registrar análise</button>`
 ]))}<section class="card" style="margin-top:22px"><h2>Etapas para homologar um prestador</h2>
 <ol><li>Contato humano e consentimento para cadastro.</li><li>Confirmar CNPJ e capacidade de atuação em AC/RO.</li>
 <li>Receber documentação técnica, responsável e NR-10/NR-35 quando aplicáveis.</li>
 <li>Conferir qualidade, preço por kWp/serviço, deslocamento, seguro e contrato com SLA.</li>
 <li>Validar primeiro serviço e registrar evidências; somente depois poderá ser parceiro homologado em cadastro próprio.</li></ol>
 <p class="muted">Registrar contato na tabela não envia WhatsApp, não confirma contrato e não muda a classificação de concorrente.</p></section>`;
 const rebind=()=>{
  $('radar-uf').onchange=()=>{radarFilter.uf=$('radar-uf').value;renderPartnerRadar();};
  $('radar-stage').onchange=()=>{radarFilter.stage=$('radar-stage').value;renderPartnerRadar();};
  $('radar-query').oninput=()=>{const val=$('radar-query').value,pos=$('radar-query').selectionStart;
   radarFilter.query=val;renderPartnerRadar();const inp=$('radar-query');inp.focus();inp.setSelectionRange(pos,pos);};
  $('content').querySelectorAll('[data-radar-review]').forEach(b=>b.onclick=()=>{
   const candidate=rows.find(x=>x.id===b.dataset.radarReview);if(!candidate)return;
   showForm('Revisar candidato · '+candidate.name,[['stage','Etapa (identificado, em_analise, contatado, documentos_pendentes, descartado)','text'],
     ['reason','Observação factual / quem confirmou / próxima ação','textarea']],
     {stage:candidate.stage,reason:candidate.review_note},async values=>{
      const v=reviewInput(values);
      const r=await db.rpc('capisol_partner_review',{p_workspace:workspace.id,p_candidate:candidate.id,p_stage:v.stage,p_reason:v.reason});
      if(r.error)throw r.error;await load();render();notice('Análise salva com histórico. A relação comercial continua não homologada.');
     });
  });
 };
 rebind();
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

 if(role==='admin'){
  $('content').insertAdjacentHTML('beforeend',`<section class="card" style="margin-top:20px"><h2>Permissões por módulo</h2>
  <p class="muted">Conceder apenas a pessoas já vinculadas a esta empresa. Permissões rurais e de mídia não alteram automaticamente o acesso financeiro.</p>
  <button id="grant-scope" class="primary">Configurar permissão</button>
  ${table(['Membro','Permissão','Situação'],(data.grants||[]).map(g=>[esc(memberName(g.user_id)),esc(g.scope),g.active?'Ativa':'Revogada']))}</section>`);
  $('grant-scope').onclick=()=>showForm('Acesso específico',[
    ['user_id','Membro da empresa','member'],['scope','Permissão: rural.read, rural.write, media.read, media.write','text'],
    ['state','Digite ATIVAR ou REVOGAR','text']
  ],{},async v=>{
    if(!['ATIVAR','REVOGAR'].includes(v.state))throw Error('Digite ATIVAR ou REVOGAR.');
    const r=await db.rpc('capisol_grant_scope',{p_workspace:workspace.id,p_user:v.user_id,p_scope:v.scope,p_active:v.state==='ATIVAR'});
    if(r.error)throw r.error;await load();render();notice('Permissão atualizada somente nesta empresa.');
  });
 }
 if(role==='admin'&&workspace.cnpj==='66360677000149'){
  $('content').insertAdjacentHTML('beforeend',`<section class="card" style="margin-top:20px"><h2>Convidar outra empresa</h2>
  <p class="muted">A pessoa convidada precisa ter conta e e-mail confirmados. Ela será administradora dos próprios dados; a CAPISOL não recebe acesso automático.</p>
  <button id="tenant-invite" class="primary">Criar convite multiempresa</button></section>`);
  $('tenant-invite').onclick=()=>showForm('Convidar empresa / produtor rural',[
   ['name','Nome da empresa ou produtor','text'],['email','E-mail confirmado do titular','email'],
   ['kind','Tipo: company, rural_producer, cooperative, association','text'],
   ['industry','Atividade: solar, agriculture, commerce, services, manufacturing, logistics, construction, hospitality, education, health','text'],
   ['cnpj','CNPJ (14 dígitos; opcional)','text']
  ],{kind:'company',industry:'services'},async v=>{
   if(!['company','rural_producer','cooperative','association'].includes(v.kind))throw Error('Tipo de ambiente inválido.');
   const r=await db.rpc('capisol_invite_new_workspace',{p_name:v.name,p_owner_email:v.email,p_kind:v.kind,p_industry:v.industry,p_cnpj:v.cnpj||null});
   if(r.error)throw r.error;notice('Convite criado. O titular verá o convite ao entrar com a própria conta.');
  });
 }
 if((data.invites||[]).length){
  $('content').insertAdjacentHTML('beforeend',`<section class="card"><h2>Convites para sua conta</h2>${(data.invites||[]).map(i=>
    `<div class="bar"><span>${esc(i.workspace_name)} · ${esc(i.industry_code)}</span>
    <button data-accept-invite="${esc(i.invitation_id)}">Aceitar</button></div>`).join('')}</section>`);
  $('content').querySelectorAll('[data-accept-invite]').forEach(b=>b.onclick=e=>run(e.target,async()=>{
   const r=await db.rpc('capisol_accept_workspace_invitation',{p_invitation:b.dataset.acceptInvite});
   if(r.error)throw r.error;await initialize();notice('Acesso habilitado para a empresa convidada.');
  }));
 }

 document.querySelectorAll('[data-revoke-member]').forEach(b=>b.onclick=()=>run(b,async()=>{const r=await db.rpc('capisol_office_revoke_member',{p_workspace:workspace.id,p_user:b.dataset.revokeMember});if(r.error)throw r.error;await load();render();notice('Acesso ao escritório revogado. As tarefas e evidências foram preservadas.');}));
 if($('add-member'))$('add-member').onclick=()=>showForm('Cadastrar acesso',[['email','E-mail da conta já confirmada','email'],['role','Perfil: manager, operator ou viewer','text']],{role:'operator'},async v=>{if(!['manager','operator','viewer'].includes(v.role))throw new Error('Perfil inválido.');const r=await db.rpc('capisol_office_add_member',{p_workspace:workspace.id,p_email:v.email,p_role:v.role});if(r.error)throw r.error;await load();render();notice('Acesso atualizado.');});
}
async function initialize(){
 const {data:{session}}=await db.auth.getSession();user=session?.user;
 if(!user){$('content').innerHTML=`<section class="card login"><span class="eyebrow">ACESSO INDIVIDUAL</span><h2>Entre no escritório</h2><p class="muted">Use a mesma conta da gestão CAPISOL.</p><form id="login"><label for="email">E-mail</label><input id="email" type="email" autocomplete="username" required><label for="password">Senha</label><input id="password" type="password" autocomplete="current-password" required><button class="primary">Entrar</button></form><p class="muted"><a href="../">Criar conta ou recuperar senha na gestão ↗</a></p><p class="muted"><a href="./demo.html">Experimentar apresentação com dados fictícios ↗</a></p></section>`;$('login').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{const r=await db.auth.signInWithPassword({email:$('email').value,password:$('password').value});if(r.error)throw new Error('E-mail ou senha não conferem. Use a recuperação na gestão se necessário.');notice();await initialize();});};return;}
 $('logout').hidden=false;$('logout').onclick=e=>run(e.target,async()=>{const r=await db.auth.signOut();if(r.error)throw r.error;location.reload();});
 const response=await db.from('capisol_workspaces').select('*').order('name');if(response.error)throw response.error;workspaces=response.data;
 if(!workspaces.length){
 const inv=await db.rpc('capisol_my_pending_workspace_invites');
 const pend=inv.error?[]:(inv.data||[]);
 $('content').innerHTML=pend.length?
 `<section class="card"><h2>Convite para escritório</h2><p>Uma empresa enviou um convite para você administrar seus dados. Só aceite se reconhecer o convite.</p>
 ${pend.map(x=>`<div class="bar"><span>${esc(x.workspace_name)} · ${esc(x.industry_code)} · válido até ${esc(new Date(x.expires_at).toLocaleDateString('pt-BR'))}</span>
 <button data-accept-invite="${esc(x.invitation_id)}" class="primary">Aceitar convite</button></div>`).join('')}</section>`:
 empty('Sua conta ainda não tem acesso ao escritório','Solicite a um administrador um convite para sua empresa. Seu cadastro da gestão permanece disponível.');
 $('content').querySelectorAll('[data-accept-invite]').forEach(b=>b.onclick=e=>run(e.target,async()=>{
  const r=await db.rpc('capisol_accept_workspace_invitation',{p_invitation:b.dataset.acceptInvite});if(r.error)throw r.error;
  await initialize();notice('Convite aceito. Você agora administra apenas os dados desta empresa.');
 }));
 return;
}
 workspace=workspaces[0];$('workspace').hidden=false;$('workspace').innerHTML=workspaces.map(w=>`<option value="${w.id}">${esc(w.name)}</option>`).join('');
 const activate=async()=>{workspace=workspaces.find(w=>w.id===$('workspace').value)||workspace;document.querySelectorAll('.aside-bottom a').forEach(a=>{a.hidden=workspace.cnpj!=='66360677000149';});const r=await db.rpc('capisol_workspace_role',{p_workspace:workspace.id});if(r.error)throw r.error;role=r.data;const grants=await db.from('capisol_workspace_scopes').select('scope').eq('workspace_id',workspace.id).eq('user_id',user.id).eq('active',true);accessScopes=grants.error?[]:(grants.data||[]).map(g=>g.scope);await load();render();};
 $('workspace').onchange=()=>run(null,activate);$('refresh').hidden=false;$('refresh').onclick=e=>run(e.target,async()=>{notice();await load();render();});
 const r=await fetch('../biblioteca/setores-operacionais.json',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Biblioteca de setores indisponível.');sectors=(await r.json()).sectors;await activate();
}
$('close').onclick=()=>$('modal').close();
run(null,initialize);
