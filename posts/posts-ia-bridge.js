/* Installed inside the existing Supabase closure. Never owns an API secret. */
(function(root){
 'use strict';
 root.installCapisolPostsBridge=function(sb,getUser){
  function error(message){var e=new Error('posts_ia');e.userMessage=message;return e;}
  function path(p){if(!/^posts-ia\/[0-9a-f-]{36}\/[0-4]\.png$/.test(p||''))throw error('Caminho de imagem inválido.');return p;}
  function session(){var user=getUser();if(!user)throw error('Faça login novamente.');return user;}
  function mediaPath(p){if(!/^posts-social\/[0-9a-f-]{36}\/final\.(webm|mp4)$/.test(p||''))throw error('Caminho de vídeo inválido.');return p;}
  async function invoke(action,body){
   session();var r=await sb.functions.invoke('posts-ia',{body:Object.assign({},body,{action:action})});
   if(r.error){
    var data;try{data=await r.error.context.json();}catch(ignore){}
    throw error(data&&data.error&&data.error.message||'O gerador ainda não está disponível. Confira a ativação no servidor.');
   }
   if(!r.data||!r.data.ok||!r.data.job)throw error('A geração não confirmou o resultado. Verifique o pedido antes de tentar novamente.');
   return r.data.job;
  }
  return{
   create:function(input){return invoke('create',input);},
   get:function(id){return invoke('get',{id:id});},
   step:function(id,confirmRetry){return invoke('step',{id:id,confirmRetry:confirmRetry===true});},
   list:async function(){
    var user=session(),r=await sb.from('posts_ia_jobs').select('id').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(10);
    if(r.error)throw error('O gerador ainda não está ativado. Os posts existentes continuam disponíveis.');
    return(r.data||[]).map(function(j){return j.id;});
   },
   posts:async function(){session();var r=await sb.from('docs').select('id,data').eq('col','posts');if(r.error)throw error('Não foi possível atualizar os posts.');return(r.data||[]).map(function(p){return Object.assign({},p.data,{id:p.id});});},
   sign:async function(p){session();var r=await sb.storage.from('arquivos').createSignedUrl(path(p),3600);if(r.error||!r.data)throw error('Imagem indisponível. Atualize sua sessão.');return r.data.signedUrl;},
   signMedia:async function(p){session();var r=await sb.storage.from('arquivos').createSignedUrl(mediaPath(p),1800);if(r.error||!r.data)throw error('Vídeo não disponível.');return r.data.signedUrl;},
   saveSocial:async function(plan,blob,ext){
    var user=session();var permitted=await sb.rpc('eh_dono');
    if(permitted.error||permitted.data!==true)throw error('Somente um sócio pode enviar rascunhos de vídeos.');
    if(!blob||blob.size<1000||blob.size>80*1024*1024||!['webm','mp4'].includes(ext))throw error('Vídeo inválido ou acima de 80 MB.');
    var id=root.crypto.randomUUID(),p='posts-social/'+id+'/final.'+ext;
    var m=await import('./studio-social.mjs');var draft=m.makePost(plan,id,p);
    var upload=await sb.storage.from('arquivos').upload(p,blob,{contentType:ext==='webm'?'video/webm':'video/mp4',upsert:false,cacheControl:'3600'});
    if(upload.error)throw error('O vídeo foi gerado, mas o envio para a biblioteca privada falhou. Baixe a cópia local e confira permissões.');
    var saved=await sb.from('docs').insert({col:'posts',id:id,data:draft});
    if(saved.error){await sb.storage.from('arquivos').remove([p]).catch(function(){});throw error('O vídeo foi gerado, mas não foi possível cadastrar o post. Baixe a cópia local.');}
    return {id:id,path:p};
   },
   shareApproved:async function(post){
    session();
    if(!post||post.status!=='Aprovado')throw error('Apenas conteúdo aprovado pode ser enviado a um aplicativo de rede social.');
    var rights=await sb.rpc('capisol_blog_context');
    if(rights.error||rights.data?.can_approve!==true)throw error('Este usuário pode baixar os materiais, mas não pode publicar. Apenas um dos três aprovadores pode compartilhar.');
    var p=(typeof post.video==='string'&&mediaPath(post.video))||(Array.isArray(post.assets)&&post.assets.length?path(post.assets[0]):null);
    if(!p)throw error('Esta publicação não tem arquivo privado disponível para compartilhar. Faça o download do material.');
    if(!root.navigator||typeof root.navigator.share!=='function')throw error('Compartilhamento nativo não disponível neste navegador. Baixe o arquivo e abra a rede social manualmente.');
    var out=await sb.storage.from('arquivos').download(p);
    if(out.error||!out.data)throw error('Não foi possível buscar a mídia aprovada para compartilhar.');
    var extension=p.split('.').pop().toLowerCase(),mime=extension==='png'?'image/png':extension==='mp4'?'video/mp4':'video/webm';
    var file=new File([out.data],'CAPISOL-publicacao.'+extension,{type:mime});
    if(typeof root.navigator.canShare==='function'&&!root.navigator.canShare({files:[file]}))throw error('Esta rede ou navegador não aceita compartilhar este arquivo. Use Baixar.');
    await root.navigator.share({files:[file],title:String(post.titulo||'CAPISOL Energia Solar').slice(0,100),text:(String(post.legenda||'')+'\n'+String(post.hashtags||'')).slice(0,1500)});
    return {opened:true,providerReceipt:false,message:'O aplicativo recebeu o pedido de compartilhamento. A publicação na rede ainda precisa ser confirmada pelo responsável.'};
   },
   download:async function(p){
    session();var r=await sb.storage.from('arquivos').download(path(p));if(r.error||!r.data)throw error('Não foi possível baixar a imagem.');
    var u=URL.createObjectURL(r.data),a=document.createElement('a');a.href=u;a.download='CAPISOL-'+p.split('/').slice(-2).join('-');document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},5000);
   }
  };
 };
})(globalThis);
