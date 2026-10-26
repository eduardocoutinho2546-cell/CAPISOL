import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
for(const path of ['blog/index.html','blog/redacao.html']){
 const html=readFileSync(path,'utf8');assert.match(html,/supabase|SUPABASE|capisol_blog_feed/);assert.match(html,/CAPISOL/);
 assert.doesNotMatch(html,/service_role|SUPABASE_SERVICE_ROLE_KEY/);
 const script=(html.match(/<script type="module">([\s\S]*?)<\/script>/)||[])[1];
 assert.ok(script, 'script presente em '+path);
 const dir=mkdtempSync(join(tmpdir(),'capisol-blog-test-'));
 try{const dest=join(dir,'script.mjs');writeFileSync(dest,script);execFileSync('node',['--check',dest],{stdio:'pipe'});}
 finally{rmSync(dir,{recursive:true,force:true})}
 console.log('Sintaxe aprovada',path);
}
const publicHTML=readFileSync('blog/index.html','utf8');
assert.match(publicHTML,/capisol_blog_feed/);assert.match(publicHTML,/textContent/);
const editorial=readFileSync('blog/redacao.html','utf8');
assert.match(editorial,/capisol_blog_context/);assert.match(editorial,/capisol_blog_set_approver/);assert.match(editorial,/confirm\(/);
console.log('Blog público, guardrails editoriais e API read-only verificados.');
