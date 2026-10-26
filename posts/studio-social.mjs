/* CAPISOL Estúdio Social: composição de vídeo no navegador. Sem token, API paga ou envio externo. */
const PROFILES = Object.freeze({
  reels: {label:'Reels / Stories · 9:16',width:540,height:960},
  feed: {label:'Feed · 4:5',width:540,height:675},
  square:{label:'Quadrado · 1:1',width:540,height:540}
});
const MAX_BYTES=80*1024*1024;
function clean(x,n=400){return String(x||'').normalize('NFKC').replace(/[\u0000-\u001F<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);}
function link(raw) {
  const value=clean(raw,500);if(!value)return '';
  let url;try{url=new URL(value);}catch{throw Error('Cole um link HTTPS válido.')}
  if(url.protocol!=='https:'||!url.hostname||url.username||url.password||url.port||/(?:^localhost$|\.local$|^127\.|^10\.|^192\.168\.|^169\.254\.|^\[|^\d+$)/i.test(url.hostname))throw Error('Este endereço não pode ser usado como referência.');
  return url.href;
}
export function buildPlan(input){
  const mode=input.mode==='fala'?'fala':'motion',profile=PROFILES[input.profile]?input.profile:'reels';
  const title=clean(input.title,100),idea=clean(input.idea,650),reference=link(input.reference);
  if(!title||title.length<3)throw Error('Informe um título com pelo menos três caracteres.');
  if(!idea&& !reference)throw Error('Escreva uma instrução ou informe um link de referência.');
  if(input.hasVideo&& !input.rights)throw Error('Confirme que pode usar o vídeo enviado.');
  if(mode==='fala'&&!input.hasVideo)throw Error('Para vídeo falando, envie a gravação.');
  const parts=(idea||title).split(/[.!?;]\s+/).filter(Boolean).map(x=>clean(x,120)).slice(0,4);
  const lines=[title,...parts.filter(x=>x.toLowerCase()!==title.toLowerCase())].slice(0,4);
  const duration=mode==='motion'?12:Math.min(45,Math.max(5,Number(input.duration)||30));
  const cta=clean(input.cta||'Converse com a equipe CAPISOL.',110);
  return {title,idea,reference,profile,mode,duration,hasVideo:!!input.hasVideo,rightsConfirmed:!!input.rights,
    frames:lines.length?lines:[title],cta,description:idea||'Referência fornecida; conteúdo da página não foi lido automaticamente.',
    warning:reference?'Link registrado como inspiração. O conteúdo do site externo não foi analisado; o material usa suas instruções e um design original.':'',
    caption:(title+' ☀️\n\n'+(idea||'Quer entender melhor? Fale com a CAPISOL.')+'\n\n'+cta).slice(0,1500),
    hashtags:'#CAPISOL #EnergiaSolar #RioBranco',size:PROFILES[profile]};
}
export function makePost(plan,id,path){
  if(!/^[0-9a-f-]{36}$/.test(id)||!new RegExp('^posts-social/'+id+'/final\\.(webm|mp4)$').test(path))throw Error('Caminho de arquivo inválido.');
  return {titulo:plan.title,formato:plan.profile==='reels'?'ReelsCapa':'VideoSocial',rede:'instagram',
    tipo:'video',origem:'estudio-social-local',criado:new Date().toISOString(),status:'Para aprovar',
    legenda:plan.caption,hashtags:plan.hashtags,roteiro:plan.description,referencia:plan.reference,
    validacao:'Vídeo composto localmente; confirmar fatos, áudio, direitos e identidade antes de publicar.',
    video:path,duracao:plan.duration,modelo:plan.mode,marca:[
    ['Vídeo/imagens próprios ou com autorização',false],['Áudio e músicas autorizados',false],
    ['Logo e identidade visual conferidos',false],['Afirmações técnicas e CTA revisados',false]],
    geracao:{origem:'composição local',revisaoHumana:true}};
}
export function verifyFile(file){
  if(!file)return;
  if(!/^video\/(mp4|webm|quicktime|x-m4v)$/i.test(file.type))throw Error('Use vídeo MP4, MOV ou WebM.');
  if(file.size>MAX_BYTES)throw Error('O vídeo excede 80 MB; faça um corte mais curto.');
}
function el(t,a={},text=''){const n=document.createElement(t);for(const[k,v]of Object.entries(a))n.setAttribute(k,v);if(text)n.textContent=text;return n;}
function fillMultiline(g,text,x,y,maxWidth,lineH,lines=3){
  let words=text.split(/\s+/),line='',all=[];for(const word of words){const s=line?line+' '+word:word;if(g.measureText(s).width>maxWidth&&line){all.push(line);line=word;}else line=s;}
  if(line)all.push(line);all.slice(0,lines).forEach((str,i)=>g.fillText(str,x,y+i*lineH,maxWidth));
}
function drawFrame(canvas,video,logo,plan,time) {
 const g=canvas.getContext('2d',{alpha:false}),w=canvas.width,h=canvas.height,phase=(time%plan.duration)/plan.duration;
 const grad=g.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#022C5E');grad.addColorStop(1,'#041A38');g.fillStyle=grad;g.fillRect(0,0,w,h);
 if(video&&video.readyState>=2){const iw=video.videoWidth,ih=video.videoHeight,scale=Math.max(w/iw,h/ih);if(iw&&ih)g.drawImage(video,(w-iw*scale)/2,(h-ih*scale)/2,iw*scale,ih*scale);}
 else{
   g.save();g.globalAlpha=.35;g.strokeStyle='#F6B800';g.lineWidth=4;
   for(let k=0;k<9;k++){const yy=h*(.16+k*.105);g.beginPath();g.moveTo(w*.05,yy+Math.sin(phase*6+k)*9);g.lineTo(w*.95,yy-65);g.stroke();}
   g.restore();
 }
 const overlay=g.createLinearGradient(0,0,0,h);overlay.addColorStop(0,'rgba(2,44,94,.85)');overlay.addColorStop(.52,'rgba(2,44,94,.1)');overlay.addColorStop(1,'rgba(2,44,94,.92)');g.fillStyle=overlay;g.fillRect(0,0,w,h);
 // Faixa original da marca: não redesenhar a capivara.
 g.fillStyle='#FDB803';g.fillRect(24,36+12*Math.sin(phase*6),84,7);
 if(logo&&logo.complete&&logo.naturalWidth){const scale=Math.min(185/logo.naturalWidth,70/logo.naturalHeight);g.fillStyle='rgba(255,255,255,.94)';g.fillRect(20,53,200,82);g.drawImage(logo,25,59,logo.naturalWidth*scale,logo.naturalHeight*scale);}
 else {g.font='bold 26px Arial';g.fillStyle='#fff';g.fillText('CAPISOL',24,91);}
 const ix=Math.min(plan.frames.length-1,Math.floor(phase*plan.frames.length)),headline=plan.frames[ix];
 g.font='bold '+(w>500?'39':'32')+'px Arial';g.fillStyle='#fff';g.textAlign='left';
 fillMultiline(g,headline,24,h*.53,w-48,49,4);
 g.fillStyle='#FDB803';g.fillRect(24,h-145,Math.max(64,w*.21),5);
 g.font='bold 23px Arial';g.fillStyle='#fff';fillMultiline(g,plan.cta,24,h-103,w-48,28,2);
 g.font='15px Arial';g.fillStyle='#FBE5A2';g.fillText('CAPISOL Energia Solar · Acre',24,h-26,w-48);
}
function preferredMime(){
 if(typeof MediaRecorder==='undefined')throw Error('Este navegador não permite exportar vídeo. Abra no Chrome atualizado.');
 for(const type of ['video/webm;codecs=vp8,opus','video/webm','video/mp4'])if(MediaRecorder.isTypeSupported(type))return type;
 throw Error('O navegador não oferece formato de gravação compatível.');
}
async function loadVideo(file){
 if(!file)return null;
 const v=document.createElement('video');v.preload='metadata';v.playsInline=true;v.crossOrigin='anonymous';
 v.src=URL.createObjectURL(file);
 try{await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=()=>reject(Error('Não foi possível abrir o vídeo.'));});}
 catch(e){URL.revokeObjectURL(v.src);throw e}
 if(!Number.isFinite(v.duration)||v.duration<=0||v.duration>1800){URL.revokeObjectURL(v.src);throw Error('Duração do vídeo não suportada.');}
 return v;
}
export async function renderClip(plan,file,onProgress=()=>{}){
 if(!HTMLCanvasElement.prototype.captureStream)throw Error('Seu navegador não suporta exportação de vídeo a partir da tela.');
 const v=await loadVideo(file),c=document.createElement('canvas');c.width=plan.size.width;c.height=plan.size.height;
 const logo=new Image();logo.src=new URL('../bio/logo.png',import.meta.url).href;
 const duration=v?Math.min(v.duration,plan.duration):plan.duration;
 let audioCtx=null,stream=c.captureStream(24);
 if(v){
   try{
     audioCtx=new (window.AudioContext||window.webkitAudioContext)();
     const src=audioCtx.createMediaElementSource(v),dest=audioCtx.createMediaStreamDestination();src.connect(dest);
     for(const track of dest.stream.getAudioTracks())stream.addTrack(track);
     await audioCtx.resume();
   }catch(e){if(audioCtx)await audioCtx.close();URL.revokeObjectURL(v.src);throw Error('Não foi possível preservar o áudio deste vídeo no navegador.');}
 }
 const mime=preferredMime(),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2200000});
 const chunks=[];
 let timer,raf,stopped=false;
 const done=new Promise((resolve,reject)=>{rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onerror=()=>reject(Error('Não foi possível gravar o vídeo.'));rec.onstop=()=>{const blob=new Blob(chunks,{type:mime});blob.size>1000?resolve(blob):reject(Error('A gravação não produziu um arquivo de vídeo.'));};});
 const stop=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);if(rec.state!=='inactive')rec.stop();for(const t of stream.getTracks())t.stop();if(v){v.pause();URL.revokeObjectURL(v.src);}if(audioCtx)audioCtx.close().catch(()=>{});};
 try{
  drawFrame(c,v,logo,plan,0);rec.start(500);const start=performance.now();
  if(v){v.currentTime=0;try{await v.play();}catch{throw Error('Seu navegador bloqueou a reprodução. Toque novamente no botão de gerar.');}}
  const animate=now=>{const elapsed=(now-start)/1000;drawFrame(c,v,logo,plan,elapsed);onProgress(Math.min(100,Math.floor(elapsed/duration*100)));if(elapsed>=duration||v&&v.ended){stop();}else raf=requestAnimationFrame(animate);};
  raf=requestAnimationFrame(animate);
  timer=setTimeout(stop,(duration+3)*1000);
  return {blob:await done,extension:mime.includes('mp4')?'mp4':'webm',duration};
 }finally{clearTimeout(timer);stop();}
}
export function openStudio(ctx){
 if(!ctx||!ctx.isOwner||!ctx.api?.saveSocial)throw Error('Estúdio indisponível nesta sessão.');
 const dialog=el('dialog',{class:'poia-dialog capisol-studio'});
 dialog.style.maxWidth='720px';dialog.style.width='min(720px,calc(100% - 24px))';
 const form=el('form');const head=el('h2',{},'Estúdio Social · CAPISOL');form.append(head);
 form.append(el('p',{class:'poia-note'},'Envie um vídeo seu ou crie um Motion com texto. Composição local, sem gastos em APIs. Você revisa antes de publicar.'));
 function field(label,name,type,placeholder){const wrapper=el('label'),input=el(type==='textarea'?'textarea':'input',{name,placeholder:placeholder||''});if(type!=='textarea')input.type=type;wrapper.append(document.createTextNode(label),input);form.append(wrapper);return input;}
 const title=field('Título / primeira frase','title','text','Ex.: Você sabe quanto seu sistema está gerando?');title.maxLength=100;title.required=true;
 const idea=field('Instrução / mensagem principal','idea','textarea','O que deve ser mostrado e dito?');idea.maxLength=650;idea.rows=4;
 const reference=field('Link de inspiração (opcional)','reference','url','https://...');
 const upload=field('Vídeo próprio para editar (MP4, MOV, WebM, até 80 MB)','media','file');upload.accept='video/mp4,video/webm,video/quicktime,video/x-m4v';
 const row=el('div',{class:'poia-actions'});form.append(row);
 const mode=el('select',{name:'mode'});[['motion','Motion com textos animados'],['fala','Meu vídeo falando + marca']].forEach(([v,label])=>mode.append(el('option',{value:v},label)));
 const profile=el('select',{name:'profile'});Object.entries(PROFILES).forEach(([v,o])=>profile.append(el('option',{value:v},o.label)));
 const modeL=el('label',{},'Tipo');modeL.append(mode);const profileL=el('label',{},'Formato');profileL.append(profile);row.append(modeL,profileL);
 const cta=field('Chamada para ação','cta','text','Converse com a equipe CAPISOL.');cta.maxLength=110;
 const rights=el('input',{type:'checkbox',name:'rights'}),rightsLabel=el('label');rightsLabel.append(rights,document.createTextNode(' Tenho direitos/consentimentos necessários para usar o material.'));form.append(rightsLabel);
 const status=el('p',{role:'status',class:'poia-note'},'Pronto para preparar.');form.append(status);
 const preview=el('div');form.append(preview);
 const buttons=el('div',{class:'poia-actions'});
 const cancel=el('button',{type:'button',class:'b b-sec'},'Fechar');
 const save=el('button',{type:'submit',class:'b b-pri'},'Gerar vídeo e enviar para Posts prontos');
 buttons.append(cancel,save);form.append(buttons);dialog.append(form);document.body.append(dialog);dialog.showModal();
 cancel.onclick=()=>{dialog.close();dialog.remove();};dialog.addEventListener('close',()=>dialog.remove());
 form.onsubmit=async e=>{
 e.preventDefault();save.disabled=true;cancel.disabled=true;preview.replaceChildren();
 try{
  const file=upload.files?.[0];verifyFile(file);
  const p=buildPlan({title:title.value,idea:idea.value,reference:reference.value,mode:mode.value,profile:profile.value,hasVideo:!!file,rights:rights.checked,cta:cta.value});
  if(p.warning)status.textContent=p.warning;
  status.textContent='Montando vídeo… '+(p.warning||'');
  const out=await renderClip(p,file,percent=>{status.textContent='Exportando vídeo '+percent+'%';});
  const blob=out.blob;
  const video=el('video',{controls:'',playsinline:'',style:'max-height:320px;width:100%;background:#022C5E;border-radius:12px'});
  video.src=URL.createObjectURL(blob);video.onloadeddata=()=>{};
  const dl=el('a',{class:'b b-sec',download:'CAPISOL-estudio.'+out.extension,href:video.src},'Baixar vídeo');
  preview.append(video,el('p',{},'Prévia local — '+Math.round(blob.size/1024)+' KB'),dl);
  status.textContent='Vídeo concluído. Salvando no Post prontos…';
  await ctx.api.saveSocial(p,blob,out.extension);
  status.textContent='Salvo em Posts prontos → Para aprovar. Vídeo e legenda aguardam revisão.';
  save.textContent='Salvo';save.disabled=true;cancel.disabled=false;
  await ctx.reloadPosts?.();
 }catch(err){status.textContent=(err&&err.message)||'Não foi possível gerar o vídeo.';save.disabled=false;cancel.disabled=false;}
 };
}
