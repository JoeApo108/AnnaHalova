// app/admin/layout.tsx
// Root admin layout - just imports CSS, no header/footer
// Authenticated pages use (dashboard)/layout.tsx for header/footer
import './admin.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                if (localStorage.getItem('admin-dark-mode') === 'true') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })()
          `,
        }}
      />
      {children}
    </>
  )
}
