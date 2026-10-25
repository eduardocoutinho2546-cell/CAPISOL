import http from 'node:http';
import crypto from 'node:crypto';
import { enqueue, listQueue, publicItem, update, claim } from './queue.mjs';
import { executeJob, integrationStatus } from './adapters.mjs';
import { evaluateLead, messageWithOptOut } from '../../outreach/policy.mjs';

const port = Number(process.env.GATEWAY_PORT || 8787);
const mode = process.env.GATEWAY_MODE || 'demo';
const adminToken = process.env.GATEWAY_ADMIN_TOKEN || '';

function json(response, status, body) {
  response.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': process.env.GATEWAY_CORS_ORIGIN || '*', 'access-control-allow-headers': 'content-type, authorization, idempotency-key'});
  response.end(JSON.stringify(body));
}

function authorized(request) {
  if (mode === 'demo' && !adminToken) return true;
  return Boolean(adminToken && request.headers.authorization === `Bearer ${adminToken}`);
}

async function body(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 256_000) throw new Error('payload_too_large');
  }
  return raw ? JSON.parse(raw) : {};
}

function idempotency(request, payload) {
  return request.headers['idempotency-key'] || payload.id || crypto.randomUUID();
}

async function route(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'OPTIONS') return json(response, 204, {});
  if (request.method === 'GET' && url.pathname === '/health') return json(response, 200, {ok: true, service: 'capisol-gateway', mode});
  if (request.method === 'GET' && url.pathname === '/v1/integrations/status') return json(response, 200, integrationStatus());
  if (!authorized(request)) return json(response, 401, {error: 'unauthorized'});
  if (request.method === 'GET' && url.pathname === '/v1/queue') return json(response, 200, (await listQueue()).map(publicItem));

  if (request.method === 'POST' && url.pathname === '/v1/outreach/evaluate') {
    const payload = await body(request);
    return json(response, 200, evaluateLead(payload.lead || payload, payload.context || {}));
  }

  if (request.method === 'POST' && url.pathname === '/v1/outreach/queue') {
    const payload = await body(request);
    const decision = evaluateLead(payload.lead || {}, payload.context || {});
    if (!decision.eligible) return json(response, 422, {status: 'blocked', decision});
    const text = messageWithOptOut(payload.text);
    const job = {
      id: idempotency(request, payload),
      provider: 'whatsapp',
      payload: {contactId: payload.contactId, text, phone: decision.normalizedPhone},
      approvedAt: payload.approvedAt || null,
      outreachDecision: decision,
    };
    const result = await enqueue(job);
    return json(response, result.duplicate ? 200 : 202, publicItem(result.item));
  }

  if (request.method === 'POST' && url.pathname === '/v1/queue') {
    const payload = await body(request);
    if (!['instagram', 'tiktok_ads', 'tiktok_content', 'whatsapp', 'whatsapp_cloud'].includes(payload.provider)) return json(response, 400, {error: 'unsupported_provider'});
    if (!payload.payload || typeof payload.payload !== 'object') return json(response, 400, {error: 'payload_required'});
    const job = { id: idempotency(request, payload), provider: payload.provider, payload: payload.payload, approvedAt: payload.approvedAt || null };
    const result = await enqueue(job);
    return json(response, result.duplicate ? 200 : 202, publicItem(result.item));
  }

  const executeMatch = url.pathname.match(/^\/v1\/queue\/([^/]+)\/execute$/);
  if (request.method === 'POST' && executeMatch) {
    const id = executeMatch[1];
    const { item: job, claimed } = await claim(id);
    if (!job) return json(response, 404, {error: 'job_not_found'});
    if (!claimed) return json(response, job.status === 'running' || job.status === 'uncertain' ? 409 : 200, publicItem(job));
    try {
      const result = await executeJob(job);
      const updated = await update(id, result);
      return json(response, result.status === 'dry_run' ? 200 : 201, publicItem(updated));
    } catch (error) {
      const updated = await update(id, {status: 'uncertain', error: 'provider_execution_not_confirmed', providerStatus: error.providerStatus || null});
      return json(response, 502, publicItem(updated));
    }
  }
  return json(response, 404, {error: 'not_found'});
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => json(response, error.message === 'payload_too_large' ? 413 : 400, {error: error.message}));
});

if (mode !== 'demo' && adminToken.length < 32) throw new Error('GATEWAY_ADMIN_TOKEN must have at least 32 characters in live mode');
server.listen(port, adminToken ? (process.env.GATEWAY_HOST || '127.0.0.1') : '127.0.0.1', () => console.log(`CAPISOL gateway listening on ${port} mode=${mode}`));
