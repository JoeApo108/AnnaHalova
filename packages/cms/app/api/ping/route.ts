// app/api/ping/route.ts
export async function GET() {
  return Response.json({ pong: true, time: Date.now() })
}
