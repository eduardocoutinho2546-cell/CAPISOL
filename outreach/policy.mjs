const DEFAULTS = {
  dailyCap: Number(process.env.OUTREACH_DAILY_CAP || 20),
  cooldownDays: Number(process.env.OUTREACH_COOLDOWN_DAYS || 7),
  maxAttemptsWithoutReply: 1,
};

function daysBetween(a, b) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function evaluateLead(lead, context = {}) {
  const reasons = [];
  const now = context.now || new Date().toISOString();
  const policy = {...DEFAULTS, ...(context.policy || {})};
  const sentToday = Number(context.sentToday || 0);
  const normalizedPhone = String(lead.phone || lead.fone || '').replace(/\D/g, '');

  if (!normalizedPhone || normalizedPhone.length < 12) reasons.push('phone_missing_or_invalid');
  if (lead.suppressed || lead.optedOut || lead.status === 'do_not_contact') reasons.push('suppressed_or_opted_out');
  if (lead.hasReplied || lead.status === 'replied') reasons.push('reply_requires_human_followup');
  if ((lead.attemptsWithoutReply || 0) >= policy.maxAttemptsWithoutReply) reasons.push('no_reply_stop_rule');
  if (lead.lastContactAt && daysBetween(lead.lastContactAt, now) < policy.cooldownDays) reasons.push('cooldown_active');
  if (!lead.whatsappOptIn && lead.lawfulBasis !== 'documented_legitimate_interest') reasons.push('no_documented_contact_basis');
  if (!lead.source || ['scraped_private_data', 'purchased_unverified_list'].includes(lead.source)) reasons.push('untrusted_source');
  if (sentToday >= policy.dailyCap) reasons.push('daily_cap_reached');
  if (lead.sequenceStage && lead.sequenceStage !== 'first_touch') reasons.push('sequence_requires_review');

  return {
    eligible: reasons.length === 0,
    reasons,
    normalizedPhone,
    requiredNextStep: reasons.length ? 'do_not_send' : 'human_approval_and_template_review',
    policy: {dailyCap: policy.dailyCap, cooldownDays: policy.cooldownDays, maxAttemptsWithoutReply: policy.maxAttemptsWithoutReply},
  };
}

export function messageWithOptOut(text) {
  const base = String(text || '').trim();
  if (!base) throw new Error('message_required');
  if (/parar|sair|não receber|nao receber/i.test(base)) return base;
  return `${base}\n\nSe não quiser receber contato, responda SAIR.`;
}
