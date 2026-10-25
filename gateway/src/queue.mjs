import { mkdir, readFile, rename, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

function queuePath() { return resolve(process.env.GATEWAY_QUEUE_FILE || './data/gateway-queue.json'); }
async function load(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
// Filesystem lock also protects separate processes using the same local queue.
// A stale lock fails closed: inspect before removing it; never replay uncertain sends.
async function transaction(fn) {
  const path = queuePath();
  await mkdir(dirname(path), { recursive: true });
  const lock = `${path}.lock`;
  let acquired = false;
  for (let attempt = 0; attempt < 500; attempt++) {
    try { await mkdir(lock); acquired = true; break; }
    catch (error) { if (error.code !== 'EEXIST') throw error; await new Promise(r => setTimeout(r, 10)); }
  }
  if (!acquired) throw new Error('queue_busy_inspect_lock');
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const items = await load(path);
    const result = fn(items);
    await writeFile(temporary, JSON.stringify(items, null, 2), { mode: 0o600 });
    await rename(temporary, path);
    return result;
  } finally { await rm(temporary, { force: true }); await rm(lock, { recursive: true, force: true }); }
}
export function redact() { return '[REDACTED]'; }
export async function enqueue(item) {
  if (typeof item.id !== 'string' || !/^[\w.-]{1,160}$/.test(item.id)) throw new Error('invalid_idempotency_key');
  return transaction(items => {
    const existing = items.find(entry => entry.id === item.id);
    if (existing) return { item: existing, duplicate: true };
    const safe = { ...item, status: 'queued', createdAt: new Date().toISOString(), attempts: 0 };
    items.push(safe); return { item: safe, duplicate: false };
  });
}
export async function listQueue() { return load(queuePath()); }
export async function update(id, patch) {
  return transaction(items => {
    const index = items.findIndex(entry => entry.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
    return items[index];
  });
}
export async function claim(id) {
  return transaction(items => {
    const item = items.find(entry => entry.id === id);
    if (!item) return { item: null, claimed: false };
    // accepted/running/uncertain are never automatically resubmitted.
    if (item.status !== 'queued') return { item, claimed: false };
    item.status = 'running'; item.attempts += 1; item.updatedAt = new Date().toISOString();
    return { item, claimed: true };
  });
}
export function publicItem(item) {
  if (Array.isArray(item)) return item.map(publicItem);
  if (!item || typeof item !== 'object') return item;
  return Object.fromEntries(Object.entries(item).map(([key, value]) => [key,
    /token|secret|password|authorization|api.?key/i.test(key) ? redact() : publicItem(value)]));
}
