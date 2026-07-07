// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor'
}

export interface JWTPayload {
  id: string
  role: string
  tv?: number // token version — must match users.token_version (revocation)
  exp?: number
}

export type AuthEvent = 'login_success' | 'login_failure' | 'password_change' | 'logout'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: JWTPayload, secret: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)

  // Security: Reduced expiration from 7d to 4h for admin panel
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('4h')
    .sign(secretKey)
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret)
    // Pin algorithm to prevent alg-confusion / "none" acceptance
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] })
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  return cookies[name] || null
}

// Verify a raw cookie token: signature + expiry + token_version, then load the user.
// Returns null on any failure. Used by both requireAuth (API) and the admin SSR layout.
export async function verifySession(token: string | null, env: CloudflareEnv): Promise<User | null> {
  if (!token) return null

  const payload = await verifyToken(token, env.JWT_SECRET)
  if (!payload) return null

  const user = await env.DB.prepare(
    'SELECT id, email, name, role, token_version FROM users WHERE id = ?'
  ).bind(payload.id).first<User & { token_version: number }>()
  if (!user) return null

  // Reject tokens minted before the current version (logout / password change)
  if ((payload.tv ?? 0) !== (user.token_version ?? 0)) return null

  return { id: user.id, email: user.email, name: user.name, role: user.role as User['role'] }
}

export async function requireAuth(request: Request, env: CloudflareEnv): Promise<User | Response> {
  const user = await verifySession(getCookie(request, 'auth_token'), env)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

// RBAC: call after requireAuth to gate admin-only routes. Returns a 403 Response
// if the user is not an admin, else null. (No routes gated yet — helper only.)
export function requireAdmin(user: User): Response | null {
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: admin role required' }, { status: 403 })
  }
  return null
}

// Revoke all existing sessions for a user (bumps token_version)
export async function bumpTokenVersion(env: CloudflareEnv, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    'UPDATE users SET token_version = token_version + 1 WHERE id = ? RETURNING token_version'
  ).bind(userId).first<{ token_version: number }>()
  return row?.token_version ?? 0
}

// Best-effort audit log; never blocks the request on failure
export async function logAuthEvent(
  env: CloudflareEnv,
  event: AuthEvent,
  opts: { email?: string | null; userId?: string | null; ip?: string | null }
): Promise<void> {
  try {
    await env.DB.prepare(
      'INSERT INTO auth_log (id, event, email, user_id, ip) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), event, opts.email ?? null, opts.userId ?? null, opts.ip ?? null).run()
  } catch (e) {
    console.error('auth_log write failed:', e)
  }
}
