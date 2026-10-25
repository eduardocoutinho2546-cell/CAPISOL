import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLead, messageWithOptOut } from '../../outreach/policy.mjs';

test('blocks outreach without documented basis', () => {
  const result = evaluateLead({phone: '556892490347', source: 'google_places'});
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('no_documented_contact_basis'));
});

test('allows first touch only with opt-in and trusted source', () => {
  const result = evaluateLead({phone: '556892490347', source: 'inbound_form', whatsappOptIn: true, sequenceStage: 'first_touch'}, {sentToday: 0});
  assert.equal(result.eligible, true);
});

test('stops opted-out or previously unanswered contacts', () => {
  const result = evaluateLead({phone: '556892490347', source: 'inbound_form', whatsappOptIn: true, optedOut: true, attemptsWithoutReply: 1});
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('suppressed_or_opted_out'));
  assert.ok(result.reasons.includes('no_reply_stop_rule'));
});

test('enforces daily cap and cooldown', () => {
  const result = evaluateLead({phone: '556892490347', source: 'inbound_form', whatsappOptIn: true, lastContactAt: '2026-10-24T10:00:00.000Z'}, {now: '2026-10-25T10:00:00.000Z', sentToday: 20});
  assert.ok(result.reasons.includes('daily_cap_reached'));
  assert.ok(result.reasons.includes('cooldown_active'));
});

test('adds opt-out instruction to outbound text', () => {
  assert.match(messageWithOptOut('Olá, tudo bem?'), /SAIR/);
  assert.equal(messageWithOptOut('Responda SAIR se preferir.'), 'Responda SAIR se preferir.');
});
