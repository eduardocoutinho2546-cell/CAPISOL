const TIMEOUT_MS = Number(process.env.GATEWAY_HTTP_TIMEOUT_MS || 12_000);

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 500) }; }
    if (!response.ok) {
      const error = new Error(`provider_http_${response.status}`);
      error.providerStatus = response.status;
      error.providerBody = body;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

function liveAllowed(job) {
  return process.env.GATEWAY_MODE === 'live' && process.env.ALLOW_LIVE_PUBLISH === 'true' && job.approvedAt;
}

export function integrationStatus() {
  return {
    mode: process.env.GATEWAY_MODE || 'demo',
    livePublishEnabled: process.env.GATEWAY_MODE === 'live' && process.env.ALLOW_LIVE_PUBLISH === 'true',
    instagram: {
      configured: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
      capability: 'publish_media',
      note: 'Requires a public media URL and explicit approval timestamp.'
    },
    tiktok: {
      configured: Boolean(process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_ADVERTISER_ID),
      capability: 'ads_api',
      note: 'Organic TikTok publishing is not claimed by this adapter; advertiser/campaign prerequisites are required.'
    },
    whatsapp: {
      configured: Boolean(process.env.RESPOND_IO_TOKEN && process.env.RESPOND_IO_CHANNEL_ID),
      capability: 'respond_io_message',
      note: 'Requires a connected Respond.io channel and recipient opt-in.'
    }
  };
}

export async function executeJob(job) {
  if (!liveAllowed(job)) {
    return { status: 'dry_run', provider: job.provider, reason: 'live mode, provider credentials, and approval are all required' };
  }
  if (job.provider === 'instagram') return publishInstagram(job);
  if (job.provider === 'whatsapp') return sendRespondIo(job);
  if (job.provider === 'tiktok_ads') return createTikTokAd(job);
  throw new Error(`unsupported_provider_${job.provider}`);
}

async function publishInstagram(job) {
  if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) throw new Error('instagram_not_configured');
  if (!job.payload?.mediaUrl) throw new Error('instagram_media_url_required');
  const base = `https://graph.facebook.com/v20.0/${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}`;
  const container = await requestJson(`${base}/media`, {
    method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({ image_url: job.payload.mediaUrl, caption: job.payload.caption || '', access_token: process.env.INSTAGRAM_ACCESS_TOKEN })
  });
  const published = await requestJson(`${base}/media_publish`, {
    method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({ creation_id: container.id, access_token: process.env.INSTAGRAM_ACCESS_TOKEN })
  });
  return { status: 'published', provider: 'instagram', providerId: published.id };
}

async function sendRespondIo(job) {
  if (!process.env.RESPOND_IO_TOKEN || !process.env.RESPOND_IO_CHANNEL_ID) throw new Error('respond_io_not_configured');
  if (!job.payload?.contactId || !job.payload?.text) throw new Error('whatsapp_contact_and_text_required');
  const base = (process.env.RESPOND_IO_BASE_URL || 'https://api.respond.io').replace(/\/$/, '');
  const result = await requestJson(`${base}/v2/contact/message/send`, {
    method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${process.env.RESPOND_IO_TOKEN}` },
    body: JSON.stringify({ channelId: process.env.RESPOND_IO_CHANNEL_ID, contactId: job.payload.contactId, message: { type: 'text', text: job.payload.text } })
  });
  return { status: 'sent', provider: 'respond_io', providerId: result.id || result.messageId || null };
}

async function createTikTokAd(job) {
  if (!process.env.TIKTOK_ACCESS_TOKEN || !process.env.TIKTOK_ADVERTISER_ID) throw new Error('tiktok_ads_not_configured');
  if (!job.payload?.adgroupId || !Array.isArray(job.payload?.creatives)) throw new Error('tiktok_adgroup_and_creatives_required');
  const result = await requestJson('https://business-api.tiktok.com/open_api/v1.3/ad/create/', {
    method: 'POST', headers: { 'content-type': 'application/json', 'Access-Token': process.env.TIKTOK_ACCESS_TOKEN },
    body: JSON.stringify({ advertiser_id: process.env.TIKTOK_ADVERTISER_ID, adgroup_id: job.payload.adgroupId, creatives: job.payload.creatives })
  });
  return { status: 'submitted', provider: 'tiktok_ads', providerId: result?.data?.request_id || null };
}
