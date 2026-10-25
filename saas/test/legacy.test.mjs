import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
test('all inline application scripts parse',()=>{let n=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/src=|application\/json/.test(m[1]))continue;new vm.Script(m[2]);n++;}assert.ok(n>0);});
test('monthly targets return defined metrics and preserve coverage calculation',()=>{
 const source=html.match(/function metasCalc\(\)\{[\s\S]*?\n\}/)[0];
 const ctx={METAS:()=>({ret1:5000,ret2:5000,demais:2000,giro:3000,mix:{1000:100}}),CF:()=>({metaSistemas:10}),n0:x=>Number(x)||0,folhaMes:()=>0,S:{assinaturas:[]},soma:(a,f)=>a.reduce((n,x)=>n+f(x),0),mensalVigente:()=>0,KITS:['1000'],cfCalc:()=>({lucro:2000,rec:18500,k:{kwp:8}}),locSede:()=>({}),cima100:x=>Math.ceil(x/100)*100};
 vm.createContext(ctx);vm.runInContext(source,ctx);const result=ctx.metasCalc();assert.equal(result.nMeta,10);assert.equal(result.nNec,8);assert.equal(result.nEq,6);assert.equal(result.metaRs,185000);assert.equal(result.nPiso,0);
});
test('lowest estimated price uses cost coverage, never zero',()=>{
 const source=html.match(/function precos3\(r,kwh\)\{[\s\S]*?return \{pret:[^\n]+/)[0];
 const ctx={CF:()=>({pret:{}}),n0:x=>Number(x)||0,cima100:x=>Math.ceil(x/100)*100,margNeg:()=>1000};vm.createContext(ctx);vm.runInContext(source,ctx);
 const r=ctx.precos3({rec:18500,pPiso:15000,kf:10000,cs:3000,comP:.05,ali:.06,serv:false},1000);assert.equal(r.men,15000);assert.ok(r.lMen>0);
});
test('edge function dependencies match the browser review contract',()=>{
 assert.equal(fs.readFileSync(new URL('../domain.mjs',import.meta.url),'utf8'),fs.readFileSync(new URL('../../supabase/functions/capisol-office/domain.mjs',import.meta.url),'utf8'));
 assert.equal(fs.readFileSync(new URL('../../biblioteca/setores-operacionais.json',import.meta.url),'utf8'),fs.readFileSync(new URL('../../supabase/functions/capisol-office/sectors.json',import.meta.url),'utf8'));
});
