'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface LanguageSwitcherProps {
  locale: 'cs' | 'en'
  style?: React.CSSProperties
}

export default function LanguageSwitcher({ locale, style }: LanguageSwitcherProps) {
  const pathname = usePathname()

  // Convert path between locales
  const getAlternateLocalePath = () => {
    const newLocale = locale === 'cs' ? 'en' : 'cs'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    return newPath
  }

  return (
    <div className="header__lang" style={style}>
      <Link
        href={locale === 'cs' ? pathname : getAlternateLocalePath()}
        className={locale === 'cs' ? 'active' : ''}
      >
        CZ
      </Link>
      <span>/</span>
      <Link
        href={locale === 'en' ? pathname : getAlternateLocalePath()}
        className={locale === 'en' ? 'active' : ''}
      >
        EN
      </Link>
    </div>
  )
}
