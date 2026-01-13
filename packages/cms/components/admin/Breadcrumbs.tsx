'use client'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

/**
 * Accessible breadcrumb navigation component.
 *
 * Features:
 * - W3C WAI-ARIA compliant (aria-label, aria-current)
 * - Schema.org BreadcrumbList structured data
 * - Visual separator between items
 * - Last item is non-clickable (current page)
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Dashboard', href: '/admin' },
 *   { label: 'Artworks', href: '/admin/artworks' },
 *   { label: 'Zimní krajina' } // Current page, no href
 * ]} />
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol
        className="breadcrumbs__list"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li
              key={item.href || item.label}
              className="breadcrumbs__item"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {isLast ? (
                <span
                  itemProp="name"
                  aria-current="page"
                  className="breadcrumbs__current"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  itemProp="item"
                  className="breadcrumbs__link"
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
