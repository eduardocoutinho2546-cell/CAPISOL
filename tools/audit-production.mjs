import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const failures = []; const warnings = [];
const files = fs.readdirSync(root, {recursive:true}).filter(f => typeof f === 'string' && !f.startsWith('.git/') && !f.includes('node_modules/'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = files.filter(f => f.endsWith('.html'));
const source = html.map(read).join('\n');
const check = (name, ok, message) => (ok ? console.log(`PASS ${name}`) : failures.push(`FAIL ${name}: ${message}`));
const warn = (name, message) => { warnings.push(`WARN ${name}: ${message}`); console.log(`WARN ${name}: ${message}`); };

check('biblioteca integral', fs.existsSync(path.join(root,'biblioteca/capacidades.json')), 'manifesto ausente');
const library = JSON.parse(read('biblioteca/capacidades.json'));
check('72 categorias preservadas', library.total_categorias === 72 && library.capacidades.length === 72, `${library.total_categorias} categorias`);
check('funções do anexo preservadas', library.total_funcoes > 2000, `${library.total_funcoes} funções`);
check('runtime safety', fs.existsSync(path.join(root,'biblioteca/runtime-safety.mjs')), 'helpers ausentes');
check('auditoria base', fs.existsSync(path.join(root,'tools/audit-capisol.mjs')), 'auditoria base ausente');
check('backup runbook', fs.existsSync(path.join(root,'docs/CAPISOL_BACKUP_E_RECUPERACAO.md')), 'runbook ausente');
check('healthcheck workflow', fs.existsSync(path.join(root,'.github/workflows/auditar-capisol.yml')), 'workflow ausente');

for (const f of html) {
  const size = fs.statSync(path.join(root,f)).size;
  if (size > 1024 * 1024) warn(`peso ${f}`, `${Math.round(size/1024)} KiB; dividir o monólito antes de ampliar`);
  if (/<script[^>]+src="https?:\/\//i.test(read(f)) && !/integrity=/i.test(read(f))) warn(`CDN sem SRI ${f}`, 'fixar integridade ou empacotar localmente');
}
if (/fetch\s*\(/.test(source) && !/AbortController/.test(source)) warn('rede sem AbortController', 'requisições podem ficar penduradas');
if (/localStorage/.test(source)) warn('storage local', 'não é backup nem armazenamento de produção; limitar a demo');
if (/supabase\.co/.test(source) && !/service_role/.test(source)) console.log('PASS chave pública somente no cliente');
check('sem service_role no cliente', !/service_role|sk-[A-Za-z0-9]{20,}/i.test(source), 'segredo encontrado');
check('manifesto JSON válido', (() => { try { JSON.parse(read('manus-routes.json')); return true; } catch { return false; } })(), 'JSON inválido');
check('scripts principais sintáticos', (() => { try { execFileSync('node',['--check',path.join(root,'biblioteca/runtime-safety.mjs')]); execFileSync('node',['--check',path.join(root,'tools/audit-capisol.mjs')]); return true; } catch { return false; } })(), 'erro de sintaxe');

console.log(`\nResumo: ${failures.length} falhas, ${warnings.length} alertas`);
for (const x of failures) console.error(x);
if (failures.length) process.exit(1);
