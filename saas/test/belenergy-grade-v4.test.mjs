import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
test('gestão CAPISOL lê somente resumo autorizado da grade 770',()=>{
 assert.match(app,/rpc\('capisol_grade_v4_resumo'/);
 assert.match(app,/data\.gradeV4/);
 assert.match(app,/function renderBelEnergyV4/);
 assert.match(app,/grade\.pendentes_conferencia/);
 assert.match(app,/grade\.conferidas/);
 assert.match(app,/27 on-grid Auxsol/);
});
test('não transforma PDF detectado em venda ou preço homologado',()=>{
 assert.match(app,/PDF detectado não significa cotação aprovada/);
 assert.match(app,/Planejamento ≠ preço de fornecedor aprovado/);
});