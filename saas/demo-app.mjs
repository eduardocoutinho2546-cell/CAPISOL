import {DEMO_SCENARIOS,seedDemo,applyDemoAction,demoIndicators,industryCatalogue,scaleRequirements,MODULES,MODULE_FAMILIES,SCALE_LEVELS} from './demo-model.mjs';
const $=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
const labels={overview:'VISÃO EXECUTIVA',operations:'OPERAÇÃO DO SEGMENTO',modules:'CATÁLOGO DE 240 MÓDULOS',scale:'EXPANSÃO GEOGRÁFICA',report:'RELATÓRIO DEMONSTRATIVO'};
let scenario='agriculture',view='overview',state=seedDemo(scenario),scale='neighborhood',query='',family='',showAll=false;
const statusName=s=>({planning:'Planejamento',planted:'Plantado',growing:'Crescimento',triage:'Triagem',review:'Aguardando revisão',approved:'Aprovado',in_progress:'Em execução',done:'Concluído',pitch:'Sugestão',investigating:'Apuração',factcheck:'Checagem',editing:'Edição',planted:'Plantado',plantado:'Plantado',crescimento:'Crescimento',colheita:'Colheita',concluido:'Concluído'}[s]||s);
function banner(){return '<span class="eyebrow">SIMULAÇÃO SEM DADOS REAIS</span>';}
function metrics(){const m=demoIndicators(state);return `<div class="grid stats">
 <section class="card"><div class="metric-label">Entradas ilustrativas</div><div class="metric-number">${brl(m.receipts)}</div><div class="metric-sub">Valores sintéticos</div></section>
 <section class="card"><div class="metric-label">Saídas ilustrativas</div><div class="metric-number">${brl(m.expenses)}</div><div class="metric-sub">Sem integração bancária</div></section>
 <section class="card"><div class="metric-label">Saldo simulado</div><div class="metric-number">${brl(m.balance)}</div><div class="metric-sub">Não é saldo de conta</div></section>
 <section class="card"><div class="metric-label">Unidade ilustrativa</div><div class="metric-number">01</div><div class="metric-sub">${safe(state.unit)}</div></section></div>`;}
function rowItems(items,type){
 if(!items.length)return `<p class="empty">Sem registros fictícios deste tipo neste cenário. Abra outra empresa para conferir outras rotinas.</p>`;
 return `<div class="stack">${items.map(x=>`<div class="row"><div><strong>${safe(x.name||x.title)}</strong>
 <small>${type==='stock'?'Quantidade em estoque: '+x.qty:type==='crop'?'Área: '+x.hectares+' ha':statusName(x.status||x.stage)}</small></div>
 ${type==='stock'?`<div class="controls"><input type="number" min="1" max="1000000" value="1" aria-label="Quantidade de ${safe(x.name)}" data-qty="${safe(x.id)}"><button class="mini" data-do="stock-in" data-id="${safe(x.id)}">Entrada</button><button class="mini" data-do="stock-out" data-id="${safe(x.id)}">Saída</button></div>`:
 type==='crop'?`<button class="mini" data-do="crop" data-id="${safe(x.id)}" ${x.stage==='concluido'?'disabled':''}>Avançar fase simulada</button>`:
 type==='order'?`<button class="mini" data-do="order" data-id="${safe(x.id)}" ${x.status==='done'?'disabled':''}>Avançar OS</button>`:
 type==='story'?`<button class="mini" data-do="story" data-id="${safe(x.id)}" ${x.status==='approved'?'disabled':''}>Avançar pauta</button>`:
 type==='event'?`<button class="mini" data-do="event" data-id="${safe(x.id)}" ${x.status==='approved'?'disabled':''}>Aprovar exemplo</button>`:''}
 </div>`).join('')}</div>`;
}
function overview(){
 const m=demoIndicators(state),cat=industryCatalogue(scenario);
 return `<div class="hero"><div>${banner()}<h3>Da atividade local à gestão multissetorial</h3>
 <p>Alterne entre sete empresas inteiramente fictícias. Simule tarefas sem alterar a plataforma de clientes.</p></div>
 <div><div class="hero-stat">240</div><small>capacidades catalogadas · ${cat.pertinent} pertinentes ao segmento selecionado</small></div></div>
 ${metrics()}
 <div class="grid two"><section class="card"><h3>O que você pode demonstrar</h3>
 <div class="row"><strong>Controle de estoque</strong><span class="pill">${m.stockItems} SKUs de exemplo</span></div>
 <div class="row"><strong>Ordens de serviço</strong><span class="pill">${m.openedOrders} abertas</span></div>
 <div class="row"><strong>Safras / culturas</strong><span class="pill">${m.crops} registradas</span></div>
 <div class="row"><strong>Pautas editoriais</strong><span class="pill">${m.stories} registros</span></div>
 <div class="row"><strong>Eventos comunitários</strong><span class="pill">${m.events} registros</span></div>
 </section><section class="card"><h3>O que já existe na plataforma</h3>
 <p><strong>Controle de contas e empresas:</strong> autenticação e isolamento de dados no backend real.</p>
 <p><strong>Operação demonstrativa:</strong> simulação de finanças, peças, culturas, pautas e eventos.</p>
 <p><strong>Governança:</strong> classificação por segmento e dez níveis de expansão.</p>
 <p><strong>Importante:</strong> abertura de conta, pagamentos, fiscal, WhatsApp, redes sociais e agentes externos ainda exigem homologação real.</p>
 <button class="primary" data-view-to="operations">Experimentar operação</button></section></div>
 <section class="card"><h3>Troque o segmento acima para demonstrar outro negócio</h3><p>Esta demonstração funciona sem login e sem dados de outras empresas. O ambiente real requer acesso individual autorizado.</p>
 <div class="controls">${DEMO_SCENARIOS.map(x=>`<button class="mini" data-scenario-to="${x.id}">${safe(x.label)}</button>`).join('')}</div></section>`;
}
function operations(){
 const m=demoIndicators(state);
 return `${metrics()}<div class="grid two">
 <section class="card"><div class="section-title"><h3>Estoque e peças</h3><span class="pill gray">Simulação local</span></div>
 ${rowItems(state.stock,'stock')}</section>
 <section class="card"><div class="section-title"><h3>Ordens e atendimentos</h3><span class="pill gray">Sem cliente real</span></div>
 ${rowItems(state.orders,'order')}</section>
 <section class="card"><div class="section-title"><h3>Safras e agronomia</h3><span class="pill yellow">Sem prescrição técnica</span></div>
 ${rowItems(state.crops,'crop')}</section>
 <section class="card"><div class="section-title"><h3>Jornal e verificação de fatos</h3><span class="pill yellow">Sem publicação</span></div>
 ${rowItems(state.stories,'story')}</section>
 <section class="card"><div class="section-title"><h3>Igrejas e eventos sociais</h3><span class="pill gray">Sem envio de convites</span></div>
 ${rowItems(state.events,'event')}</section>
 <section class="card"><h3>Caixa exemplificativo</h3><p>Experimente um lançamento de R$ 100, inteiramente fictício.</p>
 <div class="controls"><button class="mini" data-do="cash-in">Simular recebimento</button><button class="mini" data-do="cash-out">Simular despesa</button></div>
 <p>Saldo calculado: <strong>${brl(m.balance)}</strong>. O sistema não recebe pagamentos nem acessa bancos aqui.</p></section></div>
 <section class="card"><h3>Trilha de ações desta sessão</h3>${state.history.length?`<div class="stack">${state.history.slice(-10).reverse().map(x=>`<div class="row history"><strong>${safe(x.event)}</strong><span>${safe(x.detail)}</span></div>`).join('')}</div>`:'<p>Nenhuma ação simulada realizada ainda. Use os controles acima.</p>'}</section>`;
}
function modules(){
 const cat=industryCatalogue(scenario);
 let filtered=(showAll?MODULES:cat.related).filter(m=>(!family||m.family===family)&&
 (m.name+' '+m.familyName+' '+m.requiredRoles.join(' ')).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
 return `<div class="hero"><div>${banner()}<h3>24 núcleos e 240 competências</h3><p>O catálogo ajuda a planejar o escritório de cada negócio; não é um comprovante de 240 módulos automatizados.</p></div><div class="hero-stat">240</div></div>
 <section class="card"><h3>Explore as especialidades</h3><div class="filter-row">
 <input id="module-query" value="${safe(query)}" placeholder="Pesquisar: estoque, mecânica, agro, contratos..." aria-label="Pesquisar módulos">
 <select id="module-family" aria-label="Filtrar núcleo"><option value="">Todos os núcleos</option>
 ${MODULE_FAMILIES.map(x=>`<option value="${safe(x.id)}" ${family===x.id?'selected':''}>${safe(x.name)} (${x.count})</option>`).join('')}</select></div>
 <label><input id="module-showall" type="checkbox" style="width:auto" ${showAll?'checked':''}> Mostrar módulos de todos os mercados</label>
 <p class="subtext">${filtered.length} competências exibidas (até 60 por página de visualização) · status: especificadas e sujeitas a homologação.</p></section>
 <div class="catalog" style="margin-top:16px">${filtered.slice(0,60).map(x=>`<article class="module"><span class="eyebrow">${safe(x.id)} · ${safe(x.familyName)}</span>
 <h4>${safe(x.name)}</h4><p>Profissionais: ${safe(x.requiredRoles.join(', '))}</p><span class="risk">Integração específica não comprovada</span></article>`).join('')}</div>
 ${filtered.length>60?'<p class="subtext">Mostrando os primeiros 60 resultados. Refine a pesquisa para encontrar outros módulos.</p>':''}`;
}
function scales(){
 const x=scaleRequirements(scale);
 return `<div class="hero"><div>${banner()}<h3>Preparação para crescer com controle</h3><p>Do bairro à operação global, cada nível exige arquitetura e validações próprias.</p></div><div class="hero-stat">10</div></div>
 <div class="scale-grid">${SCALE_LEVELS.map(s=>`<button class="scale ${s.id===scale?'active':''}" data-scale-to="${safe(s.id)}"><span>Nível ${s.rank}</span><strong>${safe(s.name)}</strong></button>`).join('')}</div>
 <div class="grid two"><section class="card"><h3>${safe(SCALE_LEVELS.find(s=>s.id===scale).name)}</h3>
 <p>Capacidades exigidas neste nível:</p><ul class="note-list">${x.needs.map(t=>`<li>${safe(t)}</li>`).join('')}</ul>
 <p>Escolher nível não cria filiais, regimes tributários nem implantação real.</p></section>
 <section class="card"><h3>Validações obrigatórias</h3><span class="pill yellow">Não homologado nesta simulação</span>
 <ul class="note-list">${x.pending.map(t=>`<li>${safe(t.replaceAll('_',' '))}</li>`).join('')}</ul>
 <p>Além desses bloqueios automáticos, precisam ser testados legislação local, permissões, moeda, fusos, disponibilidade e auditoria.</p></section></div>`;
}
function report(){
 const m=demoIndicators(state),cat=industryCatalogue(scenario);
 return `<div class="hero"><div>${banner()}<h3>CAPISOL Gestão 4.0</h3><p>Plataforma empresarial multiatividade com separação por empresa, governança e catálogo de especialidades.</p></div></div>
 <section class="card"><h3>Resumo para apresentar</h3>
 <table class="report"><tbody>
 <tr><th>Empresa do exemplo</th><td>${safe(state.company)} — completamente fictícia</td></tr>
 <tr><th>Segmento</th><td>${safe(DEMO_SCENARIOS.find(x=>x.id===scenario).label)}</td></tr>
 <tr><th>Capacidades catalogadas</th><td>240 em 24 núcleos · ${cat.pertinent} pertinentes ao segmento (incluindo núcleos gerais)</td></tr>
 <tr><th>Escalas previstas</th><td>10, de bairro a global; expansão exige homologação específica</td></tr>
 <tr><th>Processos simulados</th><td>Estoque, OS, culturas, redação, eventos e caixa demonstrativo, conforme o segmento</td></tr>
 <tr><th>Saldo sintético</th><td>${brl(m.balance)}, sem vínculo com instituição financeira</td></tr>
 <tr><th>Segurança</th><td>Demonstração sem sessão, sem banco e sem permissões de escrita; backend real exige autenticação e RLS</td></tr>
 <tr><th>Pendências antes de produção ampla</th><td>Autenticação testada com clientes reais, integrações financeiras e fiscais, upload, backup restaurado, WhatsApp, APIs sociais, módulos setoriais e aceites regulatórios</td></tr>
 </tbody></table><p class="subtext">Os números simulados e os registros internos desta página não são evidências operacionais de clientes reais.</p>
 <div class="controls"><button class="primary" data-print>Imprimir esta apresentação</button><button class="soft" data-view-to="operations">Retornar à simulação</button></div>
 </section>`;
}
function display(){
 $('company').textContent=state.company;
 $('subline').textContent=DEMO_SCENARIOS.find(x=>x.id===scenario).label+' · '+state.unit;
 $('crumb').textContent=labels[view];
 document.querySelectorAll('nav [data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 $('app').innerHTML=({overview,operations,modules,scale:scales,report})[view]();
}
function feedback(message,isError=false){
 $('feedback').innerHTML=`<div class="notice ${isError?'error':''}">${safe(message)}</div>`;
}
function doAction(el){
 const type=el.dataset.do,id=el.dataset.id;
 if(!type)return;
 try{
  if(type==='cash-in'||type==='cash-out'){state=applyDemoAction(state,{type:'cash',direction:type.endsWith('in')?'in':'out',amount:100});}
  else if(type==='stock-in'||type==='stock-out'){
   const input=document.querySelector('[data-qty="'+id+'"]'),qty=Number(input?.value);
   state=applyDemoAction(state,{type:'stock',direction:type.endsWith('in')?'in':'out',id,qty});
  }else if(type==='crop')state=applyDemoAction(state,{type,id});
  else if(type==='story')state=applyDemoAction(state,{type,id});
  else if(type==='event')state=applyDemoAction(state,{type,id});
  else if(type==='order'){const item=state.orders.find(x=>x.id===id);
   const sequence=['triage','approved','in_progress','review','done'];
   let next=sequence[sequence.indexOf(item?.status)+1]||'done';
   state=applyDemoAction(state,{type,id,status:next});
  }else return;
  feedback('Ação executada apenas nesta simulação. Nenhum dado externo foi alterado.');display();
 }catch(error){feedback('Simulação recusada: '+error.message,true);}
}
$('scenario').innerHTML=DEMO_SCENARIOS.map(x=>`<option value="${x.id}">${safe(x.label)}</option>`).join('');
$('scenario').value=scenario;
$('scenario').addEventListener('change',e=>{scenario=e.target.value;state=seedDemo(scenario);view='overview';$('feedback').innerHTML='';display();});
document.querySelector('nav').addEventListener('click',e=>{const el=e.target.closest('[data-view]');if(el){view=el.dataset.view;display();}});
$('app').addEventListener('click',e=>{
 const el=e.target.closest('[data-do],[data-view-to],[data-scenario-to],[data-scale-to],[data-print]');
 if(!el)return;
 if(el.dataset.do){doAction(el);return;}
 if(el.dataset.viewTo){view=el.dataset.viewTo;display();return;}
 if(el.dataset.scenarioTo){scenario=el.dataset.scenarioTo;state=seedDemo(scenario);$('scenario').value=scenario;view='overview';display();return;}
 if(el.dataset.scaleTo){scale=el.dataset.scaleTo;display();return;}
 if('print' in el.dataset)window.print();
});
$('app').addEventListener('input',e=>{if(e.target.id==='module-query'){query=e.target.value; // preserva foco e posição
 const pos=e.target.selectionStart;display();const input=$('module-query');input.focus();input.setSelectionRange(pos,pos);
}});
$('app').addEventListener('change',e=>{if(e.target.id==='module-family'){family=e.target.value;display();}if(e.target.id==='module-showall'){showAll=e.target.checked;display();}});
$('reset').onclick=()=>{state=seedDemo(scenario);$('feedback').innerHTML='';display();};
$('print').onclick=()=>window.print();
display();
