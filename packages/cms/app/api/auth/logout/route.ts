// app/api/auth/logout/route.ts
export async function POST() {
  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      }
    }
  )
}
