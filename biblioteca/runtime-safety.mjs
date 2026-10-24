/** CAPISOL runtime safety: browser-safe, dependency-free helpers. */
export function withTimeout(promise, ms = 12000, label = 'operação') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} excedeu ${ms} ms`)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

export async function retry(task, { attempts = 3, baseMs = 300, shouldRetry = () => true } = {}) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try { return await task(i); } catch (error) {
      last = error;
      if (i === attempts - 1 || !shouldRetry(error, i)) throw error;
      await new Promise(resolve => setTimeout(resolve, baseMs * (2 ** i) + Math.random() * 100));
    }
  }
  throw last;
}

export function boundedJson(value, maxBytes = 256 * 1024) {
  const encoded = JSON.stringify(value);
  if (new TextEncoder().encode(encoded).byteLength > maxBytes) {
    throw new Error(`payload excede o limite de ${maxBytes} bytes`);
  }
  return encoded;
}

export function safeExternalUrl(value, allowedHosts = []) {
  const url = new URL(value, window.location.href);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('protocolo externo bloqueado');
  if (allowedHosts.length && !allowedHosts.includes(url.hostname)) throw new Error('host externo não permitido');
  return url.href;
}

export function redact(value) {
  return String(value)
    .replace(/(authorization|token|secret|password|senha|apikey|api_key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/sb_(publishable|secret)_[A-Za-z0-9_-]+/g, 'sb_[REDACTED]');
}
