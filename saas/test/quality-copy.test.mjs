import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.mjs', import.meta.url), 'utf8');

test('painel do legado não trata contatos prospectados como vendas qualificadas', () => {
  assert.match(app, /Leads e prospecção/);
  assert.match(app, /nem todo cadastro é uma oportunidade qualificada/);
  assert.match(app, /atribuir apenas oportunidades validadas à equipe comercial/);
  assert.doesNotMatch(app, /Distribuir \$\{q\.leads_without_owner\} lead\(s\) sem vendedor/);
});
