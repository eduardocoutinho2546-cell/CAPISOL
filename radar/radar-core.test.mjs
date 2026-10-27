import test from 'node:test';
import assert from 'node:assert/strict';
import {urlPublica,validarRegistro,chaveRegistro,pontuarRegistro,montarCartao,leadParaFunil} from './radar-core.mjs';

const base={
 tipo:'cliente',nome:'Mercado Exemplo',municipio:'Rio Branco',uf:'AC',
 fonteTipo:'site_empresarial',fonteUrl:'https://example.org/contato',
 observadoEm:'2026-10-26',evidencia:'Atividade comercial listada no site corporativo',
 verificado:true, sinais:['consumo_diurno']
};
test('permite somente fonte pública HTTPS',()=>{
 assert.equal(urlPublica('https://example.org/contato'),true);
 for (const url of ['http://example.org','https://localhost/a','https://127.0.0.1/a',
 'https://admin:pass@example.org','https://example.org:8443','https://foo.local/a'])
  assert.equal(urlPublica(url),false,url);
});
test('bloqueia importacao do Google Maps e origem sem verificacao',()=>{
 assert.ok(validarRegistro({...base,fonteUrl:'https://www.google.com/maps/place/x'}).includes('nao_persistir_conteudo_google_maps'));
 assert.ok(validarRegistro({...base,verificado:false}).includes('fonte_nao_conferida'));
 assert.ok(validarRegistro({...base,fonteTipo:'google_maps_scraper'}).includes('origem_invalida'));
});
test('competidor exige anuncio identificado e nao aceita ROAS inventado',()=>{
 const ok={...base,tipo:'concorrente',fonteTipo:'biblioteca_anuncios',fonteUrl:'https://www.facebook.com/ads/library/?id=111',identificador:'AD-111',evidencia:'Oferta visivel no anuncio'};
 assert.deepEqual(validarRegistro(ok),[]);
 assert.ok(validarRegistro({...ok,roas:4}).includes('metricas_de_terceiros_nao_comprovadas'));
 assert.ok(validarRegistro({...ok,identificador:''}).includes('anuncio_identificado_na_biblioteca_obrigatorio'));
});
test('classifica sinais, nao confunde potencial com venda',()=>{
 const p=pontuarRegistro({...base,sinais:['consumo_diurno','conta_elevada','interesse_confirmado']});
 assert.equal(p.prioridade,'P1');
 assert.match(p.aviso,/não intenção de compra/);
});
test('evita duplicidade entre reconsultas e municipios',()=>{
 assert.equal(chaveRegistro(base),chaveRegistro({...base,fonteUrl:'https://example.org/outra'}));
 assert.notEqual(chaveRegistro(base),chaveRegistro({...base,municipio:'Bujari'}));
});
test('lead inicia qualificacao com contato bloqueado',()=>{
 const c=montarCartao(base);
 const lead=leadParaFunil(c);
 assert.equal(lead.etapa,'Qualificar');
 assert.equal(lead.whatsappOptIn,false);
 assert.equal(lead.contatoAutomatizado,false);
 assert.equal(lead.lawfulBasis,null);
 assert.throws(()=>leadParaFunil({...c,tipo:'parceiro'}));
});
test('datas impossiveis e ausencia de municipio bloqueadas',()=>{
 assert.ok(validarRegistro({...base,observadoEm:'2026-02-31'}).includes('data_invalida'));
 assert.ok(validarRegistro({...base,municipio:''}).includes('territorio_invalido'));
});
