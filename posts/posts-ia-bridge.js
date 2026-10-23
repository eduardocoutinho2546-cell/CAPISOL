/* Installed inside the existing Supabase closure. Never owns an API secret. */
(function(root){
 'use strict';
 root.installCapisolPostsBridge=function(sb,getUser){
  function error(message){var e=new Error('posts_ia');e.userMessage=message;return e;}
  function path(p){if(!/^posts-ia\/[0-9a-f-]{36}\/[0-4]\.png$/.test(p||''))throw error('Caminho de imagem inválido.');return p;}
  function session(){var user=getUser();if(!user)throw error('Faça login novamente.');return user;}
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
   download:async function(p){
    session();var r=await sb.storage.from('arquivos').download(path(p));if(r.error||!r.data)throw error('Não foi possível baixar a imagem.');
    var u=URL.createObjectURL(r.data),a=document.createElement('a');a.href=u;a.download='CAPISOL-'+p.split('/').slice(-2).join('-');document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},5000);
   }
  };
 };
})(globalThis);
