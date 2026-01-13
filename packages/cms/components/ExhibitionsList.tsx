'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Exhibition {
  year: number
  name: { cs: string; en: string }
  visible: boolean
}

interface ExhibitionsListProps {
  exhibitions: Exhibition[]
  locale: 'cs' | 'en'
}

export default function ExhibitionsList({ exhibitions, locale }: ExhibitionsListProps) {
  const [expanded, setExpanded] = useState(false)
  const t = useTranslations('about')

  const visibleExhibitions = expanded
    ? exhibitions
    : exhibitions.filter((e) => e.visible)

  return (
    <>
      <ul className={`exhibitions-list ${expanded ? 'expanded' : ''}`} style={{ listStyle: 'none', lineHeight: 2 }}>
        {visibleExhibitions.map((exhibition, index) => (
          <li key={index} className={!exhibition.visible ? 'exhibitions-hidden' : ''}>
            <strong>{exhibition.year}</strong> — {exhibition.name[locale]}
          </li>
        ))}
      </ul>
      {exhibitions.some((e) => !e.visible) && (
        <button className="exhibitions-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? `${t('showLess')} ↑` : `${t('showAll')} ↓`}
        </button>
      )}
    </>
  )
}
