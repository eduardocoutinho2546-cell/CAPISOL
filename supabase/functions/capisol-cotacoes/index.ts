import {createClient} from "npm:@supabase/supabase-js@2.76.1";
import {parseCotacaoTexto,verificarCotacao} from "./parse.mjs";
import {simular} from "./price.mjs";

const approved=new Set((Deno.env.get("CAPISOL_ALLOWED_ORIGINS")||"https://capisolar.netlify.app,https://capisol.com.br,https://www.capisol.com.br,https://eduardocoutinho2546-cell.github.io").split(",").map(x=>x.trim()).filter(Boolean));
const headers=(req)=>{
 const origin=req.headers.get("origin")||"";
 return {"content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin",
  "access-control-allow-origin":approved.has(origin)?origin:"null",
  "access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, apikey, content-type",
  "x-content-type-options":"nosniff"};
};
const reply=(req,data,status=200)=>new Response(JSON.stringify(data),{status,headers:headers(req)});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
 if(req.method!=="POST")return reply(req,{error:"metodo_nao_permitido"},405);
 const origin=req.headers.get("origin");if(origin&&!approved.has(origin))return reply(req,{error:"origem_nao_autorizada"},403);
 const auth=req.headers.get("authorization")||"";
 if(!/^Bearer\s+\S+$/.test(auth))return reply(req,{error:"autenticacao_necessaria"},401);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!key)return reply(req,{error:"ambiente_incompleto"},503);
 const db=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const token=auth.slice(7);
 const {data:{user},error:authErr}=await db.auth.getUser(token);
 if(authErr||!user)return reply(req,{error:"sessao_invalida"},401);
 const {data:owner,error:ownerErr}=await db.rpc("eh_dono");
 const {data:member,error:memberErr}=await db.rpc("eh_membro");
 const podeSolicitar=!memberErr&&member===true;
 if((ownerErr||owner!==true)&&!podeSolicitar)return reply(req,{error:"sem_permissao"},403);
 if(Number(req.headers.get("content-length")||0)>100000)return reply(req,{error:"payload_grande"},413);
 let body;try{const raw=await req.text();if(raw.length>100000)return reply(req,{error:"payload_grande"},413);body=JSON.parse(raw);}catch{return reply(req,{error:"json_invalido"},400)}
 if(!body||typeof body!=="object"||Array.isArray(body))return reply(req,{error:"json_invalido"},400);
 if((ownerErr||owner!==true)&&!["solicitar","fila","tabela"].includes(body.action))return reply(req,{error:"somente_socio"},403);
 try{
  switch(body.action){
   case "status":return reply(req,{online:true,versao:"1.0.0",fornecedor:"PDF-autorizado",ssw:"link-oficial-sem-cpf",compra_automatica:false,proposta_automatica:false});
   case "tracking":return reply(req,{url:"https://ssw.inf.br/2/rastreamento_pf",modo:"portal_oficial",cpf_enviado:false,status:"consulta_manual_ou_contrato_transportadora"});
   case "parse": {
    const q=body.texto?parseCotacaoTexto(body.texto):verificarCotacao(body.cotacao);
    return reply(req,{cotacao:q,processamento:"rascunho",compra_automatica:false});
   }
   case "importar": {
    const q=body.texto?parseCotacaoTexto(body.texto):verificarCotacao(body.cotacao);
    if(q.erros.length)return reply(req,{erro:"cotacao_invalida",campos:q},422);
    const hash=String(body.pdf_sha256||"").toLowerCase();
    if(!/^[0-9a-f]{64}$/.test(hash))return reply(req,{error:"hash_pdf_obrigatorio"},422);
    const row={numero:q.numero,emissao:q.emissao.split("/").reverse().join("-"),validade:q.validade,kwp:q.kwp,
     produtos:q.produtos,frete:q.frete,seguro:q.seguro,total:q.total,pdf_hash:hash,
     situacao:"pendente_conferencia",criado_por:user.id};
    const {data:inserted,error:writeErr}=await db.from("capisol_cotacoes_ia").insert(row).select("id,numero,validade,situacao").single();
    if(writeErr)return reply(req,{error:writeErr.code==="23505"?"cotacao_duplicada":"falha_armazenar_cotacao"},writeErr.code==="23505"?409:500);
    return reply(req,{registro:inserted,situacao:"pendente_conferencia",compra_automatica:false},201);
   }
   case "listar":{
    const {data,error}=await db.from("capisol_cotacoes_ia").select("id,numero,emissao,validade,kwp,total,situacao,criado_em").order("criado_em",{ascending:false}).limit(30);
    if(error)return reply(req,{error:"falha_consulta"},500);return reply(req,{cotacoes:data||[]});
   }
   case "solicitar":{
    const input=body.entrada||{},template=String(body.template_id||""),finalidade="venda_direta";
    if(!/^p[0-9]{2}$/.test(template))return reply(req,{error:"template_invalido"},422);
    const zip=String(input.shipping_zip||"").replace(/\D/g,"");
    const kwh=Number(input.target_kwh),kwp=Number(input.kwp);
    const structure=String(input.structure_type||"").toLowerCase();
    if(!/^\d{8}$/.test(zip)||!Number.isFinite(kwh)||kwh<=0||!Number.isFinite(kwp)||kwp<=0||!["metalica","ceramica","fibrocimento","solo","telha_metalica","telha_ceramica","telha_fibrocimento"].includes(structure))return reply(req,{error:"dados_tecnicos_incompletos"},422);
    const entrada={shipping_zip:zip,target_kwh:kwh,kwp,structure_type:structure,roof_type:String(input.roof_type||"").slice(0,40),module_count:Number(input.module_count||0),cable_extra_m:Number(input.cable_extra_m||0),labor_brl:Number(input.labor_brl||0),inverter_kw:Number(input.inverter_kw||0)};
    if(Object.values(entrada).some(v=>typeof v==="number"&&(!Number.isFinite(v)||v<0)))return reply(req,{error:"numero_invalido"},422);
    const {data:created,error:createErr}=await db.from("capisol_fila_belenergy").insert({template_id:template,finalidade,entrada,criado_por:user.id}).select("id,estado,template_id,criado_em").single();
    if(createErr)return reply(req,{error:"falha_criar_fila"},500);
    return reply(req,{solicitacao:created,estado:"pendente",compra_automatica:false},201);
   }
   case "fila":{
    const {data,error}=await db.from("capisol_fila_belenergy").select("id,template_id,finalidade,estado,erro_codigo,cotacao_numero,cotacao_total,cotacao_validade,criado_em").order("criado_em",{ascending:false}).limit(50);
    if(error)return reply(req,{error:"falha_consultar_fila"},500);
    return reply(req,{fila:data||[]});
   }
   case "tabela":{
    const {data,error}=await db.from("capisol_tabela_fornecedor").select("*").order("template_id",{ascending:true});
    if(error)return reply(req,{error:"tabela_aguardando_configuracao"},503);
    return reply(req,{custos:data||[],atualizacao_pretendida:"segunda, quarta e sexta, 07:00 America/Rio_Branco",compras_automaticas:false});
   }
   case "simular":{
    const preview=simular(body.parametros||{});
    return reply(req,{...preview,alerta:"Sem aprovação de margem e regime fiscal, não enviar ao cliente."});
   }
   default:return reply(req,{error:"acao_nao_suportada"},400);
  }
 }catch{return reply(req,{error:"entrada_invalida"},422)}
});

