import test from 'node:test';
import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import { integrationStatus, executeJob } from '../src/adapters.mjs';
import { enqueue, listQueue } from '../src/queue.mjs';

process.env.GATEWAY_MODE = 'demo';
process.env.ALLOW_LIVE_PUBLISH = 'false';
process.env.GATEWAY_QUEUE_FILE = '/tmp/capisol-gateway-test-queue.json';
await unlink(process.env.GATEWAY_QUEUE_FILE).catch(() => {});

 test('status reports demo mode and unconfigured channels safely', () => {
  const status = integrationStatus();
  assert.equal(status.mode, 'demo');
  assert.equal(status.livePublishEnabled, false);
  assert.equal(status.instagram.configured, false);
  assert.equal(status.tiktok.configured, false);
  assert.equal(status.whatsapp.configured, false);
});

test('enqueue is idempotent', async () => {
  const first = await enqueue({id: 'same-job', provider: 'instagram', payload: {mediaUrl: 'https://example.com/a.jpg'}});
  const second = await enqueue({id: 'same-job', provider: 'instagram', payload: {mediaUrl: 'https://example.com/other.jpg'}});
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal((await listQueue()).filter((item) => item.id === 'same-job').length, 1);
});

test('demo execution never calls a provider', async () => {
  const result = await executeJob({provider: 'instagram', payload: {mediaUrl: 'https://example.com/a.jpg'}});
  assert.equal(result.status, 'dry_run');
});
