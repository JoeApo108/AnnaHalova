// app/admin/login/layout.tsx
'use client'

import { useEffect } from 'react'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-dark-mode')
    if (saved === 'true') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return children
}
