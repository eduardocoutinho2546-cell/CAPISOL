import {resolve,relative,basename,join} from 'node:path';
import {statSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const FORMATS=Object.freeze({
 reels:{width:1080,height:1920,maxSeconds:180},
 square:{width:1080,height:1080,maxSeconds:600},
 youtube:{width:1920,height:1080,maxSeconds:14400}
});
export function renderPlan({source,root,outputRoot,profile,startSec=0,durationSec=45,rightsConfirmed=false}){
 if(!rightsConfirmed)throw Error('direitos_nao_confirmados');
 if(!Object.hasOwn(FORMATS,profile))throw Error('perfil_invalido');
 if(typeof source!=='string'||typeof root!=='string'||typeof outputRoot!=='string')throw Error('caminho_invalido');
 const src=resolve(root,source),base=resolve(root),dest=resolve(outputRoot);
 const rel=relative(base,src);
 if(rel.startsWith('..')||rel.startsWith('/')||rel==='')throw Error('arquivo_fora_da_pasta_autorizada');
 if(!Number.isFinite(startSec)||startSec<0||!Number.isFinite(durationSec)||durationSec<=0||durationSec>FORMATS[profile].maxSeconds)throw Error('janela_invalida');
 const {width,height}=FORMATS[profile];
 const output=join(dest,basename(src).replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_')+'-'+profile+'.mp4');
 const vf=`scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`;
 const args=['-hide_banner','-nostdin','-y','-ss',String(startSec),'-i',src,'-t',String(durationSec),
  '-vf',vf,'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',output];
 return {command:'ffmpeg',args,output,rightsConfirmed,profile,mode:'requires_explicit_execution'};
}
export function processMedia(plan,{execute=false}={}){
 if(!execute)return {...plan,executed:false};
 if(process.env.CAPISOL_MEDIA_APPROVED!=='true')throw Error('execucao_sem_aprovacao_do_operador');
 if(!plan.rightsConfirmed||plan.command!=='ffmpeg')throw Error('plano_nao_autorizado');
 const source=plan.args[plan.args.indexOf('-i')+1];
 if(!statSync(source).isFile())throw Error('fonte_invalida');
 mkdirSync(resolve(plan.output,'..'),{recursive:true});
 const result=spawnSync('ffmpeg',plan.args,{shell:false,timeout:600000,stdio:'pipe',maxBuffer:1024*1024});
 if(result.error||result.status!==0)throw Error('ffmpeg_falhou');
 return {executed:true,output:plan.output};
}
if(process.argv[1]&&process.argv[1].endsWith('clipper.mjs')){
 const spec=JSON.parse(process.argv[2]||'{}');
 const plan=renderPlan(spec);
 console.log(JSON.stringify(processMedia(plan,{execute:process.argv.includes('--execute')}),null,2));
}
