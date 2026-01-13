'use client'

import Link from 'next/link'
import { useState } from 'react'
import Navigation from './Navigation'
import LanguageSwitcher from './LanguageSwitcher'

interface HeaderProps {
  locale: 'cs' | 'en'
}

export default function Header({ locale }: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen)
    document.body.style.overflow = !mobileNavOpen ? 'hidden' : ''
  }

  const closeMobileNav = () => {
    setMobileNavOpen(false)
    document.body.style.overflow = ''
  }

  return (
    <>
      <header className="header">
        <Link href={`/${locale}`} className="header__logo">
          Anna Hálová
        </Link>

        <div className="header__nav">
          <Navigation locale={locale} className="nav" />
          <LanguageSwitcher locale={locale} />
          <button
            className={`hamburger ${mobileNavOpen ? 'active' : ''}`}
            aria-label="Menu"
            onClick={toggleMobileNav}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <nav className={`nav-mobile ${mobileNavOpen ? 'active' : ''}`}>
        <Navigation locale={locale} onLinkClick={closeMobileNav} />
        <LanguageSwitcher locale={locale} style={{ marginTop: '2rem' }} />
      </nav>
    </>
  )
}
