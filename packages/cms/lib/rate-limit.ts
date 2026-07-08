// lib/rate-limit.ts
// Durable rate limiting backed by D1 (shared across all Worker isolates)

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// Default configs for different actions
export const RATE_LIMITS = {
  login: { windowMs: 60 * 1000, maxAttempts: 5 },           // 5 attempts per minute
  passwordChange: { windowMs: 60 * 60 * 1000, maxAttempts: 3 }, // 3 per hour
  upload: { windowMs: 60 * 1000, maxAttempts: 10 },         // 10 uploads per minute
} as const

// Atomic check-and-increment against the rate_limits table. A single UPSERT either
// starts a fresh window (when the previous one expired) or increments the counter,
// so the limit holds globally instead of per-isolate.
export async function checkRateLimit(
  env: CloudflareEnv,
  identifier: string,
  action: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action]
  const key = `${action}:${identifier}`
  const now = Date.now()
  const freshReset = now + config.windowMs

  const row = await env.DB.prepare(`
    INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= ?3 THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= ?3 THEN ?2 ELSE rate_limits.reset_at END
    RETURNING count, reset_at
  `).bind(key, freshReset, now).first<{ count: number; reset_at: number }>()

  const count = row?.count ?? 1
  const resetAt = row?.reset_at ?? freshReset

  // Opportunistic cleanup: rows for other keys whose window expired are dead
  // weight (one permanent row per bot IP otherwise). Rows are few, so an
  // unconditional DELETE per check is cheaper than scheduling a cron.
  await env.DB.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').bind(now).run()

  return {
    allowed: count <= config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - count),
    resetAt,
  }
}

// Get client IP from request (Cloudflare Workers)
export function getClientIP(request: Request): string {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0].trim()
    || 'unknown'
}

// Create rate limit response with proper headers
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too many attempts. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  )
}
