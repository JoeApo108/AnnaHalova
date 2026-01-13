export function getRoutes(locale: string) {
  return locale === 'en'
    ? { paintings: 'paintings', watercolors: 'watercolors', about: 'about', contact: 'contact' }
    : { paintings: 'malby', watercolors: 'akvarely', about: 'o-mne', contact: 'kontakt' }
}
