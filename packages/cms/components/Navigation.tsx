'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getRoutes } from '@/lib/routes'

interface NavigationProps {
  locale: 'cs' | 'en'
  className?: string
  onLinkClick?: () => void
}

export default function Navigation({ locale, className, onLinkClick }: NavigationProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const routes = getRoutes(locale)

  const links = [
    { href: `/${locale}/${routes.paintings}`, label: t('paintings'), pattern: /malby|paintings/ },
    { href: `/${locale}/${routes.watercolors}`, label: t('watercolors'), pattern: /akvarely|watercolors/ },
    { href: `/${locale}/${routes.about}`, label: t('about'), pattern: /o-mne|about/ },
    { href: `/${locale}/${routes.contact}`, label: t('contact'), pattern: /kontakt|contact/ },
  ]

  return (
    <nav className={className}>
      {links.map((link) => {
        const isActive = link.pattern.test(pathname)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav__link ${isActive ? 'active' : ''}`}
            onClick={onLinkClick}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
