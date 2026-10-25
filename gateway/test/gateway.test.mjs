import test from 'node:test';
import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import { integrationStatus, executeJob } from '../src/adapters.mjs';
import { enqueue, listQueue, claim, update, publicItem } from '../src/queue.mjs';

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

test('concurrent enqueues preserve every item and one idempotent job', async () => {
  const results = await Promise.all(Array.from({length: 20}, (_, i) => enqueue({id: `parallel-${i % 10}`, payload: {}})));
  assert.equal(results.filter(x => !x.duplicate).length, 10);
  assert.equal((await listQueue()).filter(x => x.id.startsWith('parallel-')).length, 10);
});
test('only one caller can claim a job and accepted sends cannot replay', async () => {
  await enqueue({id: 'claim-once', payload: {}});
  const claims = await Promise.all(Array.from({length: 8}, () => claim('claim-once')));
  assert.equal(claims.filter(x => x.claimed).length, 1);
  await update('claim-once', {status: 'accepted'});
  assert.equal((await claim('claim-once')).claimed, false);
  await update('claim-once', {status: 'uncertain'});
  assert.equal((await claim('claim-once')).claimed, false);
});
test('responses recursively redact credentials without revealing fragments', () => {
  const result = publicItem({payload: {nested: [{apiKey: 'secret', token: 'abcd123456789'}]}, status: 'accepted'});
  assert.equal(result.payload.nested[0].apiKey, '[REDACTED]');
  assert.equal(result.payload.nested[0].token, '[REDACTED]');
  assert.equal(result.status, 'accepted');
});
