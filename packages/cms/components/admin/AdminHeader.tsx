// components/admin/AdminHeader.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useLayoutEffect } from 'react'

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // Initialize with false for hydration safety (inline script in layout.tsx handles initial dark class)
  const [darkMode, setDarkMode] = useState(false)

  // Read localStorage after mount to sync React state with stored preference
  useEffect(() => {
    const stored = localStorage.getItem('admin-dark-mode') === 'true'
    setDarkMode(stored)
  }, [])

  // Sync dark mode class with document on changes
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('admin-dark-mode', String(newValue))
    document.documentElement.classList.toggle('dark', newValue)
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <Link href="/admin" className="admin-header__logo">
          CMS
        </Link>
        <nav className="admin-header__nav">
          <Link href="/admin/artworks" className={isActive('/admin/artworks') ? 'active' : ''}>
            Artworks
          </Link>
          <Link href="/admin/galleries" className={isActive('/admin/galleries') ? 'active' : ''}>
            Galleries
          </Link>
          <Link href="/admin/theme" className={isActive('/admin/theme') ? 'active' : ''}>
            Theme
          </Link>
          <Link href="/admin/publish" className={isActive('/admin/publish') ? 'active' : ''}>
            Publish
          </Link>
        </nav>
      </div>
      <div className="admin-header__right">
        <Link
          href="/admin/settings"
          className={`admin-btn admin-btn-secondary ${isActive('/admin/settings') ? 'active' : ''}`}
          style={{ padding: '8px 12px', textDecoration: 'none' }}
        >
          ⚙️ Settings
        </Link>
        <button
          onClick={toggleDarkMode}
          className="admin-btn admin-btn-secondary"
          style={{ padding: '8px 12px', fontSize: '16px' }}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button onClick={handleLogout} className="admin-btn admin-btn-secondary">
          Logout
        </button>
        <button
          className="admin-header__hamburger"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileNavOpen}
        >
          ☰
        </button>
      </div>
      {/* Mobile menu drawer */}
      {mobileNavOpen && (
        <div className="admin-header__mobile-menu">
          <Link href="/admin/artworks" className={isActive('/admin/artworks') ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>
            Artworks
          </Link>
          <Link href="/admin/galleries" className={isActive('/admin/galleries') ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>
            Galleries
          </Link>
          <Link href="/admin/theme" className={isActive('/admin/theme') ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>
            Theme
          </Link>
          <Link href="/admin/publish" className={isActive('/admin/publish') ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>
            Publish
          </Link>
          <Link href="/admin/settings" className={isActive('/admin/settings') ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>
            ⚙️ Settings
          </Link>
          <button onClick={toggleDarkMode}>
            {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  )
}
