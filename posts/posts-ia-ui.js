/* CAPISOL Posts: browser UI only. Generation and credentials stay on the server. */
(function(root){
 'use strict';
 var formats={FeedInstitucional:'Feed institucional (1:1)',FeedServico:'Feed de serviço (1:1)',FeedEconomia:'Feed de economia (1:1)',FeedInvestimento:'Feed de investimento (1:1)',StoryAviso:'Story de aviso (9:16)',StoryResultado:'Story por segmento (9:16)',StoryOrcamento:'Story de orçamento (9:16)',ReelsCapa:'Capa de Reels (9:16)',Carrossel:'Carrossel educativo · 5 lâminas (4:5)'};
 var channels={whatsapp:'WhatsApp',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',linkedin:'LinkedIn',youtube:'YouTube',youtube_shorts:'YouTube Shorts',google:'Google Perfil da Empresa'};
 var selected='Para aprovar',selectedChannel='all',jobs=[],loaded=false,loading=false,busy={},notice='',latest=null,requestId=null;
 function channelOf(p){return String(p.rede||p.canal||p.platform||'instagram').toLowerCase();}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function safeLegacy(u){return typeof u==='string'&&(/^(?:posts\/[\w\-/]+\.(?:png|jpg|jpeg)|https:\/\/[\w.\-/]+\.(?:png|jpg|jpeg))$/.test(u));}
 function pathOK(p){return /^posts-ia\/[0-9a-f-]{36}\/[0-4]\.png$/.test(p||'');}
 function humanError(e){return e&&e.userMessage?e.userMessage:'Não foi possível concluir. Confira a configuração do gerador e tente novamente.';}
 function redraw(){if(latest&&latest.el.isConnected)render(latest.el,latest.ctx);}
 function remember(job){var i=jobs.findIndex(function(j){return j.id===job.id;});if(i<0)jobs.unshift(job);else jobs[i]=job;}
 async function refresh(ctx){
  if(!ctx.isOwner||loading||loaded)return;loading=true;
  try{var ids=await ctx.api.list();jobs=await Promise.all(ids.map(function(id){return ctx.api.get(id);}));loaded=true;
   var missing=jobs.filter(function(j){return j.state==='ready'&&!(ctx.posts||[]).some(function(p){return p.id===j.id;});});
   for(var j of missing)await ctx.api.step(j.id,false); // Recover a lost publish response without generating again.
   if(missing.length)await ctx.reloadPosts?.();
  }
  catch(e){notice=humanError(e);loaded=true;}finally{loading=false;redraw();}
 }
 function progress(job){
  var slides=job.slides||[],done=slides.filter(function(s){return s.state==='ready';}).length;
  if(job.state==='ready')return 'Imagens prontas';
  if(job.state==='failed')return 'Pedido recusado. Ajuste o tema e crie outro.';
  if(job.state==='paused')return 'Pausado · '+done+' de '+slides.length+' imagens prontas';
  return 'Gerando · '+done+' de '+slides.length+' imagens prontas';
 }
 async function run(job,confirmRetry){
  if(busy[job.id])return;busy[job.id]=true;notice='';remember(job);redraw();
  var ctx=latest.ctx;
  try{
   // A request processes one slide. Never loop indefinitely on a running lease.
   var count=(job.slides||[]).length+1;
   for(var i=0;i<count;i++){
    job=await ctx.api.step(job.id,confirmRetry===true);confirmRetry=false;remember(job);redraw();
    if(job.state==='ready'){notice='Imagens prontas para revisão humana.';await ctx.reloadPosts?.();break;}
    if(job.state!=='pending')break;
   }
  }catch(e){notice=humanError(e);try{remember(await ctx.api.get(job.id));}catch(ignore){}}
  finally{busy[job.id]=false;redraw();}
 }
 function openForm(){
  if(!latest||!latest.ctx.isOwner)return;
  var dialog=document.createElement('dialog');dialog.className='poia-dialog';
  dialog.innerHTML='<form><h2>Gerar conteúdo por canal</h2><p>Escolha a rede. A publicação continua protegida até existir autorização oficial.</p><label>Rede<select name="channel">'+Object.keys(channels).map(function(k){return '<option value="'+k+'">'+channels[k]+'</option>';}).join('')+'</select></label><label>Formato<select name="format">'+Object.keys(formats).map(function(k){return '<option value="'+k+'">'+formats[k]+'</option>';}).join('')+'</select></label><label>Tema<input name="theme" required minlength="3" maxlength="240" placeholder="Ex.: Como funciona energia solar"></label><label>Município<input name="city" required maxlength="100" value="Rio Branco - AC"></label><label>Gerador<select name="provider"><option value="auto">Automático · Nano Banana com alternativa OpenAI</option><option value="google">Nano Banana Pro</option><option value="openai">OpenAI</option></select></label><p class="poia-note">Usa as APIs configuradas e pode consumir créditos. Não inclua dados de clientes.</p><p role="alert" class="poia-error"></p><div class="poia-actions"><button type="button" class="b b-sec" data-cancel>Cancelar</button><button type="submit" class="b b-pri">Gerar rascunho</button></div></form>';
  document.body.appendChild(dialog);dialog.showModal();
  var form=dialog.querySelector('form'),submit=dialog.querySelector('[type=submit]'),error=dialog.querySelector('[role=alert]');
  requestId=root.crypto.randomUUID();
  dialog.querySelector('[data-cancel]').onclick=function(){dialog.close();dialog.remove();};
  dialog.addEventListener('cancel',function(){dialog.remove();});
  form.onsubmit=async function(e){
   e.preventDefault();if(submit.disabled)return;
   submit.disabled=true;submit.textContent='Preparando…';error.textContent='';
   var values=new FormData(form),input={requestId:requestId,channel:values.get('channel'),format:values.get('format'),theme:values.get('theme'),city:values.get('city'),provider:values.get('provider')};
   try{var job=await latest.ctx.api.create(input);dialog.close();dialog.remove();remember(job);await run(job,false);}
   catch(err){error.textContent=humanError(err);submit.disabled=false;submit.textContent='Gerar imagem';}
  };
 }
 function styles(){if(document.getElementById('poia-style'))return;
  var style=document.createElement('style');style.id='poia-style';style.textContent='.poia{--poia-blue:#0B2D5B;--poia-yellow:#F6C300;font-family:Montserrat,Arial,sans-serif;color:var(--poia-blue)}.poia h1,.poia h2{color:var(--poia-blue)}.poia-head,.poia-actions,.poia-tabs,.poia-counts{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.poia-head{justify-content:space-between;margin-bottom:20px}.poia .b-pri,.poia-dialog .b-pri{background:#0B2D5B;color:#fff}.poia-counts>div{background:#fff;border:1px solid #E9EEF4;border-radius:12px;padding:16px;min-width:150px;flex:1}.poia-counts strong{display:block;font-size:26px;margin-top:8px}.poia-tabs{margin:20px 0}.poia-tabs button[aria-selected=true]{background:#F6C300;color:#0B2D5B}.poia-card,.poia-job{background:#fff;border:1px solid #E9EEF4;border-radius:12px;padding:20px;margin:16px 0}.poia-images{display:flex;gap:12px;overflow:auto;margin:12px 0}.poia-images>div{flex:0 0 240px}.poia-images img{width:100%;height:270px;object-fit:contain;background:#E9EEF4;border-radius:10px}.poia-copy{white-space:pre-wrap;background:#f6f8fb;border-radius:8px;padding:14px}.poia-note{font-size:13px;color:#536176;line-height:1.6}.poia-error{color:#9a3019;white-space:pre-wrap}.poia-dialog{border:1px solid #E9EEF4;border-radius:16px;max-width:500px;width:calc(100% - 40px);padding:24px;color:#0B2D5B;font-family:Montserrat,Arial,sans-serif}.poia-dialog::backdrop{background:#0b2d5b77}.poia-dialog label{display:block;margin:14px 0;font-weight:600;font-size:13px}.poia-dialog input,.poia-dialog select,.poia-dialog textarea{display:block;box-sizing:border-box;width:100%;padding:11px;margin-top:6px;border:1px solid #ccd5df;border-radius:8px;font:inherit}.poia-empty{padding:30px;border:1px dashed #b7c5d4;border-radius:12px}.poia button:disabled{opacity:.55}';document.head.appendChild(style);
 }
 function render(el,ctx){
  latest={el:el,ctx:ctx};styles();
  var posts=(ctx.posts||[]).slice().sort(function(a,b){return String(b.criado||'').localeCompare(String(a.criado||''));});
  var count=function(s){return posts.filter(function(p){return(p.status||'Para aprovar')===s;}).length;};
  var h='<section class="poia"><header class="poia-head"><div><h1>Posts prontos</h1><p class="poia-note">Crie imagens, revise e prepare a publicação da CAPISOL.</p><p><a class="b b-sec" href="conteudo/" target="_blank" rel="noopener">Biblioteca de templates por rede</a></p></div>'+(ctx.isOwner?'<button class="b b-pri" data-poia-studio>+ Estúdio Social · Vídeo/Motion</button><button class="b b-sec" data-poia-new>+ Gerar imagem com IA</button>':'')+'</header>';
  h+='<div class="poia-counts">'+[['Para aprovar','Para aprovar'],['Aprovados','Aprovado'],['Postados','Postado']].map(function(s){return '<div>'+s[0]+'<strong>'+count(s[1])+'</strong></div>';}).join('')+'</div>';
  if(notice)h+='<p role="status" class="poia-note">'+esc(notice)+'</p>';
  if(ctx.isOwner){
   h+='<div aria-live="polite">'+jobs.filter(function(j){return j.state!=='ready';}).map(function(j){return '<article class="poia-job"><b>'+esc(j.input.theme)+'</b><p>'+esc(progress(j))+'</p>'+(j.error?'<p class="poia-error">'+esc(j.error.message||'O pedido precisa ser retomado.')+'</p>':'')+(j.state!=='failed'?'<button class="b b-sec" data-resume="'+esc(j.id)+'" '+(busy[j.id]?'disabled':'')+'>'+ (busy[j.id]?'Gerando…':'Verificar / retomar')+'</button>':'')+'</article>';}).join('')+'</div>';
  }
  h+='<nav class="poia-tabs" aria-label="Status dos posts">'+[['Para aprovar','Para aprovar'],['Aprovado','Aprovados'],['Postado','Postados'],['Recusado','Recusados']].map(function(s){return '<button class="b b-sec" aria-selected="'+(selected===s[0])+'" data-tab="'+s[0]+'">'+s[1]+'</button>';}).join('')+'</nav>';
  h+='<nav class="poia-tabs" aria-label="Canal de publicação"><button class="b b-sec" aria-selected="'+(selectedChannel==='all')+'" data-channel="all">Todas</button>'+Object.keys(channels).map(function(k){return '<button class="b b-sec" aria-selected="'+(selectedChannel===k)+'" data-channel="'+k+'">'+channels[k]+'</button>';}).join('')+'</nav>';
  var shown=posts.filter(function(p){return(p.status||'Para aprovar')===selected&&(selectedChannel==='all'||channelOf(p)===selectedChannel);});
  if(!shown.length)h+='<div class="poia-empty">Nenhuma publicação nesta aba.'+(ctx.isOwner?' Use “Gerar imagem com IA” para começar.':'')+'</div>';
  shown.forEach(function(p,i){
   var assets=(p.assets||[]).filter(pathOK),legacy=(p.imagens||[]).filter(safeLegacy);
   h+='<article class="poia-card"><h2>'+esc(p.titulo||'Publicação CAPISOL')+'</h2><p class="poia-note"><b>'+esc(channels[channelOf(p)]||'Canal não definido')+'</b> · '+esc(formats[p.formato]||p.formato||'')+' · '+esc(String(p.criado||'').slice(0,10))+'</p><div class="poia-images">';
   assets.forEach(function(path,k){h+='<div><img data-asset="'+esc(path)+'" alt="'+esc(p.alt||'Imagem CAPISOL para revisão')+'"><button class="b b-sec" data-download="'+esc(path)+'">Baixar imagem '+(k+1)+'</button></div>';});
   legacy.forEach(function(u,k){h+='<div><img src="'+esc(u)+'" alt="'+esc(p.alt||'Imagem CAPISOL')+'"><a class="b b-sec" href="'+esc(u)+'" download target="_blank" rel="noopener">Baixar imagem '+(k+1)+'</a></div>';});
   h+='</div>';
   if(typeof p.video==='string'&&/^posts-social\\/[0-9a-f-]{36}\\/final\\.(webm|mp4)$/.test(p.video)){
     h+='<div class="poia-images"><div style="flex:1"><video controls playsinline preload="metadata" style="max-width:300px;width:100%;max-height:440px;background:#022C5E;border-radius:10px" data-socialpath="'+esc(p.video)+'"></video><p><button class="b b-sec" data-socialdownload="'+esc(p.video)+'">Baixar vídeo</button></p></div></div>';
   }
   h+='<div class="poia-copy">'+esc(p.legenda||'')+'</div><p class="poia-note">'+esc(p.hashtags||'')+'</p>';
   if(p.geracao)h+='<p class="poia-note">Gerado por '+esc((p.geracao.motores||[]).map(function(m){return m.motor+' · '+m.modelo;}).filter(function(v,i,a){return a.indexOf(v)===i;}).join(', '))+'. Revisão humana necessária.</p>';
   if(p.horario||p.musica)h+='<p class="poia-note">'+(p.horario?'<b>Horário:</b> '+esc(p.horario)+'<br>':'')+(p.musica?'<b>Música:</b> '+esc(p.musica):'')+'</p>';
   if(p.roteiro)h+='<p class="poia-note"><b>Roteiro:</b> '+esc(p.roteiro)+'</p>';
   if(p.validacao)h+='<p class="poia-note">'+esc(p.validacao)+'</p>';
   if(p.marca)h+='<ul class="poia-note">'+p.marca.map(function(m,k){return '<li><label><input type="checkbox" data-review="'+i+'" data-item="'+k+'" '+(m[1]?'checked ':'')+(!ctx.canApprove?'disabled ':'')+'>'+esc(m[0])+'</label></li>';}).join('')+'</ul>';
   h+='<div class="poia-actions"><button class="b b-sec" data-copy="'+i+'">Copiar legenda + hashtags</button>';
   if(ctx.canApprove&&selected==='Para aprovar')h+='<button class="b b-pri" data-post="'+i+'" data-state="Aprovado">Aprovar</button><button class="b b-sec" data-post="'+i+'" data-state="Recusado">Recusar</button>';
   if(ctx.canApprove&&selected==='Aprovado')h+='<button class="b b-pri" data-post="'+i+'" data-state="Postado">Marcar como postado</button>';
   h+='</div></article>';
  });h+='</section>';el.innerHTML=h;
  var bt=el.querySelector('[data-poia-new]');if(bt)bt.onclick=openForm;
  var studio=el.querySelector('[data-poia-studio]');if(studio)studio.onclick=async function(){
    studio.disabled=true;
    try{var src=Array.from(document.scripts).find(function(s){return /posts-ia-ui\\.js(?:\\?|$)/.test(s.src);});
      var url=src?new URL('studio-social.mjs',src.src).href:new URL('posts/studio-social.mjs',document.baseURI).href;
      var module=await import(url);module.openStudio(latest.ctx);
    }catch(e){notice=e.message||'Não foi possível abrir o estúdio.';redraw();}
    finally{if(studio.isConnected)studio.disabled=false;}
  };
  el.querySelectorAll('[data-tab]').forEach(function(b){b.onclick=function(){selected=b.dataset.tab;redraw();};});
  el.querySelectorAll('[data-channel]').forEach(function(b){b.onclick=function(){selectedChannel=b.dataset.channel;redraw();};});
  el.querySelectorAll('[data-copy]').forEach(function(b){b.onclick=async function(){var p=shown[+b.dataset.copy];try{await navigator.clipboard.writeText((p.legenda||'')+'\n\n'+(p.hashtags||''));b.textContent='Legenda copiada';}catch(e){notice='Selecione a legenda e copie o texto.';redraw();}};});
  el.querySelectorAll('[data-review]').forEach(function(b){b.onchange=function(){var p=shown[+b.dataset.review],next=(p.marca||[]).map(function(m,k){return[m[0],k===+b.dataset.item?b.checked:m[1]];});notice='';if(ctx.review)ctx.review(p,next);};});
  el.querySelectorAll('[data-post]').forEach(function(b){b.onclick=function(){var p=shown[+b.dataset.post];if(b.dataset.state==='Aprovado'&&(p.marca||[]).some(function(m){return!m[1];})){notice='Confira os itens de revisão antes de aprovar.';redraw();return;}notice='';ctx.approve(p,b.dataset.state);};});
  el.querySelectorAll('[data-resume]').forEach(function(b){b.onclick=async function(){try{var j=await ctx.api.get(b.dataset.resume);remember(j);var uncertain=(j.slides||[]).some(function(s){return s.state==='ambiguous';});if(uncertain&&!root.confirm('A tentativa anterior pode ter consumido créditos. Autoriza tentar novamente somente a imagem pendente?'))return;await run(j,true);}catch(e){notice=humanError(e);redraw();}};});
  el.querySelectorAll('[data-asset]').forEach(function(img){ctx.api.sign(img.dataset.asset).then(function(url){if(img.isConnected)img.src=url;},function(){if(img.isConnected)img.alt='Imagem indisponível. Atualize a sessão e tente novamente.';});});
  el.querySelectorAll('[data-socialpath]').forEach(function(video){ctx.api.signMedia(video.dataset.socialpath).then(function(url){if(video.isConnected)video.src=url;},function(){if(video.isConnected)video.outerHTML='<p class="poia-error">Vídeo indisponível. Atualize a sessão.</p>';});});
  el.querySelectorAll('[data-socialdownload]').forEach(function(button){button.onclick=async function(){try{var url=await ctx.api.signMedia(button.dataset.socialdownload);window.open(url,'_blank','noopener');}catch(e){notice='Não foi possível baixar o vídeo.';redraw();}};});
  el.querySelectorAll('[data-download]').forEach(function(b){b.onclick=async function(){b.disabled=true;try{await ctx.api.download(b.dataset.download);}catch(e){notice=humanError(e);redraw();}finally{b.disabled=false;}};});
  refresh(ctx);
 }
 root.CAPISOL_POSTS_UI={render:render,openForm:openForm,formats:formats,progress:progress};
})(globalThis);
