// /api/claude.js - SECURED VERSION

// Simple in-memory rate limiter (works on Vercel)
const rateLimits = new Map();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 20; // 20 requests per hour per IP

// Daily spend tracker
let dailySpend = 0;
let lastResetDate = new Date().toDateString();
const DAILY_LIMIT = 3; // $3/day circuit breaker

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- PROTECTION 1: Rate Limiting by IP ---
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             'unknown';
  
  const now = Date.now();
  const userRequests = rateLimits.get(ip) || [];
  
  // Clean old requests outside window
  const recentRequests = userRequests.filter(time => now - time < WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Try again in an hour.',
      resetIn: Math.ceil((WINDOW_MS - (now - recentRequests[0])) / 60000) + ' minutes'
    });
  }
  
  recentRequests.push(now);
  rateLimits.set(ip, recentRequests);

  // --- PROTECTION 2: Daily Circuit Breaker ---
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySpend = 0;
    lastResetDate = today;
  }
  
  if (dailySpend >= DAILY_LIMIT) {
    return res.status(503).json({ 
      error: 'Daily API budget reached. Service temporarily paused for cost control.',
      message: 'This helps keep Pathlight free during beta. Try again tomorrow!'
    });
  }

  // --- PROTECTION 3: Request Validation ---
  const { model, max_tokens, messages, system } = req.body;
  
  // Only allow our specific model
  if (model && model !== 'claude-sonnet-4-20250514') {
    return res.status(400).json({ error: 'Invalid model specified' });
  }
  
  // Cap maximum tokens to prevent massive requests
  if (max_tokens && max_tokens > 4000) {
    return res.status(400).json({ error: 'Token limit exceeded. Max 4000 tokens.' });
  }
  
  // Validate messages array
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }
  
  if (messages.length > 50) {
    return res.status(400).json({ error: 'Too many messages. Max 50 per request.' });
  }
  
  // Validate each message
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return res.status(400).json({ error: 'Invalid message structure' });
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ error: 'Invalid message role' });
    }
  }

  // --- PROTECTION 4: Sanitized Request Body ---
  const sanitizedBody = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: Math.min(max_tokens || 4000, 4000),
    messages: messages,
    ...(system && { system }), // Optional system prompt
  };

  try {
    // Make API call with sanitized inputs
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(sanitizedBody),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ 
        error: 'AI service error',
        message: data.error?.message || 'Something went wrong'
      });
    }

    // --- PROTECTION 5: Cost Tracking ---
    // Rough cost calculation (update based on actual pricing)
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const estimatedCost = (inputTokens / 1_000_000 * 3) + (outputTokens / 1_000_000 * 15);
    dailySpend += estimatedCost;
    
    // Log for monitoring
    console.log(`API Call - IP: ${ip}, Cost: $${estimatedCost.toFixed(4)}, Daily Total: $${dailySpend.toFixed(2)}`);

    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'Unable to process request. Please try again.'
    });
  }
}
