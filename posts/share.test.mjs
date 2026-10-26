import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';import fs from 'node:fs';
import {File} from 'node:buffer';
const code=fs.readFileSync(new URL('./posts-ia-bridge.js',import.meta.url),'utf8');
const fixture='posts-social/39c7af10-9d19-4e11-96bc-4bea99c43f00/final.webm';
function setup(allowed=true){
 let shared;
 const environment={console,File,Blob,navigator:{canShare:()=>true,share:async payload=>{shared=payload;}}};
 environment.globalThis=environment;
 vm.createContext(environment);
 vm.runInContext(code,environment,{filename:'posts-ia-bridge.js'});
 const sb={
   rpc:async name=>({data:name==='capisol_blog_context'?{can_approve:allowed}:true,error:null}),
   storage:{from:()=>({download:async()=>({data:new Blob(['vid001'],{type:'video/webm'}),error:null})})}
 };
 const api=environment.installCapisolPostsBridge(sb,()=>({id:'test-user'}));
 return{api,getShared:()=>shared};
}
test('aprovador pode abrir compartilhamento nativo sem marcar como publicado',async()=>{
 const {api,getShared}=setup(true);
 const result=await api.shareApproved({status:'Aprovado',titulo:'CAPISOL Energia Solar',legenda:'Conteúdo autorizado',video:fixture});
 assert.equal(result.providerReceipt,false);
 assert.equal(result.opened,true);
 assert.equal(getShared().files.length,1);
 assert.match(getShared().text,/Conteúdo autorizado/);
});
test('qualquer pessoa pode obter conteúdo pelo fluxo existente, mas não pode publicar',async()=>{
 const {api}=setup(false);
 await assert.rejects(api.shareApproved({status:'Aprovado',video:fixture}),/pode baixar os materiais/);
});
test('rascunho não é compartilhável mesmo por aprovador',async()=>{
 const {api}=setup(true);
 await assert.rejects(api.shareApproved({status:'Para aprovar',video:fixture}),/Apenas conteúdo aprovado/);
});
