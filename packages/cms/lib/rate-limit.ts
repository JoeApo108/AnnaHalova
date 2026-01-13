// lib/rate-limit.ts
// Rate limiting for authentication endpoints using D1 storage

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

// In-memory store for rate limiting (per-isolate, resets on cold start)
// For production with multiple workers, consider using D1 or KV
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMITS
): RateLimitResult {
  const config = RATE_LIMITS[action]
  const key = `${action}:${identifier}`
  const now = Date.now()

  const record = rateLimitStore.get(key)

  // If no record or window expired, create new window
  if (!record || now > record.resetAt) {
    const resetAt = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt,
    }
  }

  // Increment count
  record.count++
  rateLimitStore.set(key, record)

  // Check if over limit
  if (record.count > config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    }
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - record.count,
    resetAt: record.resetAt,
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
