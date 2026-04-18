// ═══════════════════════════════════════════════
// /api/claude — Anthropic proxy with rate limiting
//
// Protection layers:
//   1. Per-IP request count (20 per 10 minutes)
//   2. Per-IP token budget (150k tokens per hour)
//   3. Max tokens guard per request (hard ceiling of 4500)
//   4. Request payload size limit
//   5. 55-second timeout on Anthropic API calls
//
// Note: Uses in-memory storage. Vercel serverless instances
// don't share memory, so limits apply per-instance. For stricter
// enforcement, migrate to Vercel KV. This still catches runaway
// loops from a single user hitting the same instance repeatedly.
// ═══════════════════════════════════════════════

// In-memory rate limit store. Keyed by IP.
// { ip: { requests: [timestamps], tokens: [{ at, count }] } }
const rateLimitStore = new Map();

const REQUEST_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const REQUEST_LIMIT = 20; // 20 requests per 10 min

const TOKEN_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const TOKEN_LIMIT = 150_000; // 150k tokens per hour

const MAX_TOKENS_PER_REQUEST = 4500; // hard ceiling on any single call

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function checkRateLimit(ip, estimatedTokens) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { requests: [], tokens: [] };

  // Prune old entries
  entry.requests = entry.requests.filter((t) => now - t < REQUEST_WINDOW_MS);
  entry.tokens = entry.tokens.filter((e) => now - e.at < TOKEN_WINDOW_MS);

  // Check request count
  if (entry.requests.length >= REQUEST_LIMIT) {
    return {
      ok: false,
      reason: 'Too many requests. Please wait a few minutes.',
      retryAfter: 60,
    };
  }

  // Check token budget
  const tokensUsed = entry.tokens.reduce((sum, e) => sum + e.count, 0);
  if (tokensUsed + estimatedTokens > TOKEN_LIMIT) {
    return {
      ok: false,
      reason: 'Session token budget exceeded. Please try again later.',
      retryAfter: 300,
    };
  }

  // Record this request
  entry.requests.push(now);
  entry.tokens.push({ at: now, count: estimatedTokens });
  rateLimitStore.set(ip, entry);

  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Payload size guard
  const payloadSize = JSON.stringify(req.body).length;
  if (payloadSize > 100_000) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  // Max tokens guard — don't let the client request absurd completions
  const requestedMaxTokens = Number(req.body?.max_tokens) || 250;
  if (requestedMaxTokens > MAX_TOKENS_PER_REQUEST) {
    return res.status(400).json({
      error: `max_tokens exceeds limit of ${MAX_TOKENS_PER_REQUEST}`,
    });
  }

  // Estimate token cost (input tokens roughly = chars / 4, plus max output)
  const estimatedInputTokens = Math.ceil(payloadSize / 4);
  const estimatedTotalTokens = estimatedInputTokens + requestedMaxTokens;

  // Rate limit check
  const ip = getIP(req);
  const check = checkRateLimit(ip, estimatedTotalTokens);
  if (!check.ok) {
    res.setHeader('Retry-After', check.retryAfter);
    return res.status(429).json({ error: check.reason });
  }

  try {
    // 55-second timeout — stays under Vercel's 60s maxDuration
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    // If the upstream call errored, forward status
    if (!response.ok) {
      console.error('Anthropic API error:', response.status, data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Anthropic API timed out after 55s');
      return res.status(504).json({
        error: 'AI response took too long. Please try again.',
      });
    }
    console.error('Claude API error:', error);
    return res.status(500).json({ error: 'Failed to call Claude API' });
  }
}
