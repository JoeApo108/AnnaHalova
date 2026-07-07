// app/admin/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifySession } from '@/lib/auth'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PublishIndicator } from '@/components/admin/PublishIndicator'
import { ToastProvider } from '@/components/admin/ToastProvider'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Security: verify JWT signature + expiry + token_version before rendering.
  // Middleware only checks the cookie exists (can't read JWT_SECRET); this is the real gate.
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await verifySession((await cookies()).get('auth_token')?.value ?? null, env)
  if (!user) {
    redirect('/admin/login/')
  }

  return (
    <ToastProvider>
      <div className="admin-layout">
        <AdminHeader />
        <main className="admin-main">
          {children}
        </main>
        <footer className="admin-footer">
          <PublishIndicator />
        </footer>
      </div>
    </ToastProvider>
  )
}
