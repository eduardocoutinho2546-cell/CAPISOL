import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const index = fs.readFileSync(`${root}/index.html`, 'utf8');
const intelligence = fs.readFileSync(`${root}/inteligencia/index.html`, 'utf8');
const cotacoes = fs.readFileSync(`${root}/inteligencia/cotacoes-panel.mjs`, 'utf8');
const tokenDemo = fs.readFileSync(`${root}/acesso/index.html`, 'utf8');
const minerDemo = fs.readFileSync(`${root}/inteligencia/minerador.html`, 'utf8');
const report = [];
const pass = (name, detail) => report.push(`PASS ${name}: ${detail}`);
const fail = (name, detail) => { report.push(`FAIL ${name}: ${detail}`); process.exitCode = 1; };

function check(name, fn, detail) {
  try { fn(); pass(name, detail); } catch (error) { fail(name, error.message); }
}

const agentsMatch = index.match(/var ESC_AGENTES=(\[.*?\]);/s);
check('catálogo de agentes', () => {
  assert.ok(agentsMatch, 'ESC_AGENTES não encontrado');
  const agents = JSON.parse(agentsMatch[1]);
  assert.equal(agents.length, 191, `esperados 191 agentes, encontrados ${agents.length}`);
  const ids = agents.map(([id]) => id);
  assert.equal(new Set(ids).size, ids.length, 'há IDs de agentes duplicados');
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/, `ID inválido: ${id}`);
}, '191 IDs únicos e normalizados');

check('BelEnergy seguro', () => {
  assert.match(intelligence, /painelCotacoesBelEnergy/);
  assert.match(intelligence, /cotacoes-panel\.mjs/);
  assert.match(cotacoes, /application\/pdf/);
  assert.match(cotacoes, /pdf_sha256/);
  assert.doesNotMatch(cotacoes, /service_role|secret_key/i);
}, 'painel, PDF, hash e ausência de segredo');

check('alçada de desconto', () => {
  assert.match(index, /ALCADA_PAD=\{n1:500/);
  assert.match(index, /limAprov\(\)/);
  assert.match(index, /Pedir desconto/);
}, 'R$ 500 e aprovação estão codificados no fluxo');

check('unidades de geração', () => {
  assert.match(index, /Geração \(kWh\/mês\)/);
  assert.match(index, /Potência \(kWp\)/);
  assert.match(index, /gerAnual/);
}, 'kWh/mês, kWp e kWh/ano separados');

check('WhatsApp sem envio silencioso', () => {
  assert.match(index, /target="_blank"/);
  assert.match(index, /Mensagem pronta no WhatsApp|Abrir no WhatsApp/);
}, 'atendimento preparado por mensagem explícita');

check('Guardião de Acessos', () => {
  assert.match(index, /guardiao-acessos/);
  assert.match(index, /sem armazenar senhas/);
}, 'agente de segurança e escalonamento definido');

check('demos de tokens e mineração', () => {
  assert.match(tokenDemo, /crypto\.subtle\.digest/);
  assert.match(tokenDemo, /tokenHash/);
  assert.match(tokenDemo, /Revogar/);
  assert.doesNotMatch(tokenDemo, /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}/);
  assert.match(minerDemo, /Simular nova varredura/);
  assert.match(minerDemo, /Aprovar/);
  assert.match(minerDemo, /Bloquear/);
}, 'hash, revogação, fila, aprovação e bloqueio presentes');

check('documentação operacional', () => {
  for (const file of [
    'docs/CAPISOL_BRANDING_E_DIFERENCIAL.md',
    'docs/CAPISOL_PLANO_COMERCIAL_ACRE.md',
    'docs/CAPISOL_STATUS_INTEGRACOES.md',
    'docs/CAPISOL_GUARDIAO_DE_ACESSOS.md',
    'docs/CAPISOL_MINERADOR_E_TOKENS.md',
    'agents/minerador-oportunidades.md',
    'agents/gestor-tokens.md',
    'manus-routes.json',
    'docs/CAPISOL_AUDITORIA_GITHUB_E_PLANO_LUCRO_2026-10-24.md',
  ]) assert.ok(fs.existsSync(`${root}/${file}`), `${file} não encontrado`);
}, 'branding, plano, status e auditoria presentes');

console.log(report.join('\n'));
if (process.exitCode) process.exit(1);
