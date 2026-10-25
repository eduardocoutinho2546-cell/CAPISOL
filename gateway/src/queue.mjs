import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function queuePath() {
  return resolve(process.env.GATEWAY_QUEUE_FILE || './data/gateway-queue.json');
}

async function load() {
  try {
    return JSON.parse(await readFile(queuePath(), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function save(items) {
  const path = queuePath();
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, JSON.stringify(items, null, 2), { mode: 0o600 });
  await rename(temporary, path);
}

export function redact(value) {
  if (typeof value !== 'string') return value;
  if (value.length <= 8) return '[REDACTED]';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export async function enqueue(item) {
  const items = await load();
  const existing = items.find((entry) => entry.id === item.id);
  if (existing) return { item: existing, duplicate: true };
  const safe = {
    ...item,
    status: 'queued',
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  items.push(safe);
  await save(items);
  return { item: safe, duplicate: false };
}

export async function listQueue() {
  return load();
}

export async function update(id, patch) {
  const items = await load();
  const index = items.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
  await save(items);
  return items[index];
}

export function publicItem(item) {
  const clone = structuredClone(item);
  if (clone.payload?.accessToken) clone.payload.accessToken = redact(clone.payload.accessToken);
  if (clone.payload?.token) clone.payload.token = redact(clone.payload.token);
  return clone;
}
