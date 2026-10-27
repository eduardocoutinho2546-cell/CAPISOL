import test from 'node:test';
import assert from 'node:assert/strict';
import {avaliarDuplaValidacao,normalizarDuplaValidacao} from './dupla-validacao.mjs';
const data={placesStatus:'encontrado',placeId:'ChIJ123456789abc',placesConsultadoEm:'2026-10-26',
 fonteIndependenteStatus:'confirmado',fonteIndependenteUrl:'https://empresa.com.br/sobre',
 fonteConferidaEm:'2026-10-26',tipoEstabelecimento:'alugado',imovelDisponivel:true};
test('duas fontes independentes para promover',()=>{const r=avaliarDuplaValidacao(data);assert.equal(r.completa,true);assert.equal(r.localParaInstalacaoConfirmado,true);});
test('google isolado nao autoriza CRM',()=>{const r=avaliarDuplaValidacao({...data,fonteIndependenteUrl:'https://www.google.com/maps'});assert.equal(r.completa,false);});
test('empresa sem ficha Maps ou sede pode entrar para qualificacao sem presumir aptidao',()=>{
 const r=avaliarDuplaValidacao({...data,placesStatus:'nao_encontrado',placeId:'',tipoEstabelecimento:'sem_sede',imovelDisponivel:false});
 assert.equal(r.completa,true);assert.equal(r.localParaInstalacaoConfirmado,false);
 assert.match(r.alertaImovel,/não é desqualificação automática/);
});
test('sem consulta e sem fonte empresarial nao entra',()=>{assert.equal(avaliarDuplaValidacao({}).completa,false)});
test('persistir somente place ID, estado e fonte independente',()=>{
 const r=normalizarDuplaValidacao({...data,placeName:'NOME DO GOOGLE',rating:4.8,telefonePlaces:'xxx'});
 assert.equal(r.placeName,undefined);assert.equal(r.telefonePlaces,undefined);
});
