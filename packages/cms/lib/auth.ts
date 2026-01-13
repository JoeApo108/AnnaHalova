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
  exp?: number
}

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
    const { payload } = await jwtVerify(token, secretKey)
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

export async function requireAuth(request: Request, env: CloudflareEnv): Promise<User | Response> {
  const token = getCookie(request, 'auth_token')

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token, env.JWT_SECRET)

  if (!payload) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await env.DB.prepare(
    'SELECT id, email, name, role FROM users WHERE id = ?'
  ).bind(payload.id).first<User>()

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 401 })
  }

  return user
}
