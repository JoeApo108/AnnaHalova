// app/admin/(dashboard)/layout.tsx
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PublishIndicator } from '@/components/admin/PublishIndicator'
import { ToastProvider } from '@/components/admin/ToastProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
