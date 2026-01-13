// lib/renderer.ts
// Renders complete HTML pages for static hosting

import { Artwork, CarouselSlide, PaintingYear, WatercolorSeries } from '@/data/types';

// Security: HTML entity encoding to prevent XSS
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Escape for use in HTML attributes (double-quoted)
function escapeAttr(str: string): string {
  return escapeHtml(str);
}

// Escape for URLs (validates it's a safe URL)
function escapeUrl(url: string): string {
  if (!url) return '';
  // Only allow http, https, mailto, tel protocols
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    return escapeAttr(url);
  }
  // For relative URLs, escape and prefix with /
  if (url.startsWith('/')) {
    return escapeAttr(url);
  }
  return '#'; // Block potentially dangerous URLs
}

// Data types matching what generatePaintingsData/generateWatercolorsData produce
export interface PaintingsData {
  carousel: CarouselSlide[];
  featured: Artwork[];
  years: PaintingYear[];
}

export interface WatercolorsData {
  series: WatercolorSeries[];
}

export interface AboutData {
  bio: {
    birthYear: number;
    birthPlace: string;
    description: { cs: string; en: string };
  };
  exhibitions: Array<{
    year: number;
    name: { cs: string; en: string };
    visible?: boolean;
  }>;
  residencies: Array<{
    year: number;
    name: { cs: string; en: string };
  }>;
  education: Array<{
    years: string;
    name: { cs: string; en: string };
  }>;
}

export interface ContactData {
  email: string;
  phone: string;
  location: { cs: string; en: string };
  intro: { cs: string; en: string };
  social: Array<{
    name: string;
    url: string;
  }>;
}

const CSS = `/* Anna Hálová Portfolio */
:root {
  --color-text: #2d4a3d;
  --color-text-light: #4a6b5a;
  --color-bg: #fefefe;
  --color-bg-alt: #f5f5f3;
  --color-border: #e0e0dc;
  --font-primary: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --max-width: 1200px;
  --header-height: 60px;
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 48px;
  --space-xl: 80px;
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-primary); color: var(--color-text); background: var(--color-bg); line-height: 1.6; }
img { max-width: 100%; height: auto; display: block; }
a { color: var(--color-text); text-decoration: none; }
a:hover { opacity: 0.7; }
button { font-family: inherit; cursor: pointer; border: none; background: none; }
.container { max-width: var(--max-width); margin: 0 auto; padding: 0 var(--space-md); }
.header { position: fixed; top: 0; left: 0; right: 0; height: var(--header-height); background: var(--color-bg); z-index: 1000; display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-md); }
.header__logo { font-size: 18px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; }
.header__nav { display: flex; align-items: center; gap: var(--space-md); }
.nav { display: flex; gap: var(--space-md); }
.nav__link { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; padding: 8px 0; }
.nav__link.active { border-bottom: 1px solid var(--color-text); }
.header__lang a { font-size: 14px; padding: 8px; }
.header__lang a.active { font-weight: 600; }
/* Hamburger Menu */
.hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; width: 28px; height: 28px; padding: 4px; }
.hamburger span { display: block; width: 100%; height: 2px; background-color: var(--color-text); transition: var(--transition-fast); }
.hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger.active span:nth-child(2) { opacity: 0; }
.hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
/* Mobile Navigation - Backdrop */
.nav-backdrop { position: fixed; top: var(--header-height); left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.3); z-index: 998; opacity: 0; visibility: hidden; transition: opacity var(--transition-normal), visibility var(--transition-normal); }
.nav-backdrop.active { opacity: 1; visibility: visible; pointer-events: auto; cursor: pointer; }
/* Mobile Navigation - Slide-in Drawer */
.nav-mobile { position: fixed; top: var(--header-height); right: 0; bottom: 0; width: 280px; max-width: 75vw; background-color: var(--color-bg); padding: var(--space-lg) var(--space-md); flex-direction: column; gap: var(--space-md); z-index: 999; box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15); transform: translateX(100%); transition: transform var(--transition-normal); display: flex; }
.nav-mobile.active { transform: translateX(0); }
.nav-mobile .nav__link { font-size: 18px; padding: 8px 0; border-bottom: 1px solid var(--color-border); display: block; }
.nav-mobile .nav__link:last-child { border-bottom: none; }
main { margin-top: var(--header-height); }
.hero { height: calc(100vh - var(--header-height)); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
.hero img { max-height: 100%; max-width: 100%; object-fit: contain; }
.carousel { position: relative; height: calc(100vh - var(--header-height)); overflow: hidden; }
.carousel__slides { position: relative; height: 100%; }
.carousel__slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: var(--space-lg); opacity: 0; transition: opacity 0.5s ease; }
.carousel__slide.active { opacity: 1; }
.carousel__slide img { max-height: 100%; max-width: 100%; object-fit: contain; }
.carousel__dots { position: absolute; bottom: var(--space-md); left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10; }
.carousel__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-border); border: none; cursor: pointer; padding: 0; transition: background-color 0.2s ease; }
.carousel__dot.active { background: var(--color-text); }
.lightbox { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(254, 254, 254, 0.98); z-index: 2000; align-items: center; justify-content: center; padding: var(--space-lg); }
.lightbox.active { display: flex; }
.lightbox__content { max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center; }
.lightbox__image { max-width: 100%; max-height: calc(90vh - 100px); object-fit: contain; }
.lightbox__info { text-align: center; padding: var(--space-md); }
.lightbox__title { font-size: 18px; margin-bottom: 4px; }
.lightbox__meta { font-size: 14px; color: var(--color-text-light); }
.lightbox__close { position: absolute; top: var(--space-md); right: var(--space-md); font-size: 32px; color: var(--color-text); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; }
.lightbox__nav { position: absolute; top: 50%; transform: translateY(-50%); font-size: 32px; color: var(--color-text); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; }
.lightbox__prev { left: var(--space-md); }
.lightbox__next { right: var(--space-md); }
.text-section { max-width: 750px; margin: 0 auto; padding: var(--space-xl) var(--space-md); text-align: center; font-size: 1.1rem; line-height: 1.8; }
.gallery { padding: var(--space-lg) 0; }
.gallery__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-md); }
.gallery--list .gallery__grid { grid-template-columns: 1fr; max-width: 800px; margin: 0 auto; }
.gallery--list .gallery__image { aspect-ratio: auto; max-height: 70vh; object-fit: contain; }
.gallery__item { cursor: pointer; transition: transform 0.2s ease; }
.gallery__item:hover { transform: translateY(-4px); }
.gallery__image { width: 100%; aspect-ratio: 4/5; object-fit: cover; margin-bottom: var(--space-sm); }
.gallery__title { font-size: 16px; font-weight: 500; margin-bottom: 4px; }
.gallery__meta { font-size: 14px; color: var(--color-text-light); }
.sub-nav { display: flex; flex-wrap: wrap; gap: var(--space-sm); padding: var(--space-md) 0; border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-lg); }
.sub-nav__link { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; padding: 8px 16px; border: 1px solid transparent; }
.sub-nav__link:hover, .sub-nav__link.active { border-color: var(--color-text); }
.about, .contact { max-width: 700px; margin: 0 auto; padding: var(--space-xl) var(--space-md); }
.about__title, .contact__title { margin-bottom: var(--space-lg); }
.about__section { margin-bottom: var(--space-lg); }
.about__section h2 { margin-bottom: var(--space-sm); }
.exhibitions-hidden { display: none; }
.exhibitions-list.expanded .exhibitions-hidden { display: list-item; }
.exhibitions-toggle { margin-top: 1rem; padding: 0.5rem 1rem; font-size: 14px; color: var(--color-text); background: transparent; border: 1px solid var(--color-border); cursor: pointer; transition: all 0.2s ease; }
.exhibitions-toggle:hover { background: var(--color-bg-alt); }
.contact__social { display: flex; gap: var(--space-md); }
.contact__social-link { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
.footer { padding: var(--space-lg) var(--space-md); text-align: center; font-size: 14px; color: var(--color-text-light); border-top: 1px solid var(--color-border); }
@media (max-width: 768px) {
  .nav { display: none; }
  .hamburger { display: flex; }
  .gallery__grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
  .hero { height: calc(80vh - var(--header-height)); }
  .sub-nav { gap: var(--space-xs); padding: var(--space-sm) 0; margin-bottom: var(--space-md); }
  .sub-nav__link { font-size: 13px; padding: 6px 10px; }
  .lightbox__nav { top: auto; }
  .lightbox__prev { left: 4px; }
  .lightbox__next { right: 4px; }
}
@media (max-width: 600px) {
  .gallery__grid { grid-template-columns: 1fr; }
  .sub-nav { flex-wrap: wrap; gap: 8px; padding: 12px 0; margin-bottom: var(--space-sm); }
  .sub-nav__link { font-size: 11px; padding: 5px 10px; border: 1px solid var(--color-border); border-radius: 4px; background-color: var(--color-bg); }
  .sub-nav__link.active { background-color: transparent; color: var(--color-text); border-color: var(--color-text); }
}
`;

// Route configuration
const routes = {
  cs: { paintings: 'malby', watercolors: 'akvarely', about: 'o-mne', contact: 'kontakt' },
  en: { paintings: 'paintings', watercolors: 'watercolors', about: 'about', contact: 'contact' }
};

// Navigation labels
const nav = {
  cs: { paintings: 'Malby', watercolors: 'Akvarely, Tuše', about: 'O mně', contact: 'Kontakt' },
  en: { paintings: 'Paintings', watercolors: 'Watercolors, Ink', about: 'About', contact: 'Contact' }
};

type Locale = 'cs' | 'en';

// Security: Always escape localized content by default
function getLocalized(obj: { cs: string; en: string }, locale: Locale): string {
  const value = obj[locale] || obj.cs;
  return escapeHtml(value);
}

function header(locale: Locale, activePage: string = ''): string {
  const r = routes[locale];
  const n = nav[locale];

  return `
  <header class="header">
    <a href="/${locale}" class="header__logo">Anna Hálová</a>
    <div class="header__nav">
      <nav class="nav">
        <a href="/${locale}/${r.paintings}" class="nav__link ${activePage === 'paintings' ? 'active' : ''}">${n.paintings}</a>
        <a href="/${locale}/${r.watercolors}" class="nav__link ${activePage === 'watercolors' ? 'active' : ''}">${n.watercolors}</a>
        <a href="/${locale}/${r.about}" class="nav__link ${activePage === 'about' ? 'active' : ''}">${n.about}</a>
        <a href="/${locale}/${r.contact}" class="nav__link ${activePage === 'contact' ? 'active' : ''}">${n.contact}</a>
      </nav>
      <div class="header__lang">
        <a href="/cs" ${locale === 'cs' ? 'class="active"' : ''}>CZ</a>
        /
        <a href="/en" ${locale === 'en' ? 'class="active"' : ''}>EN</a>
      </div>
      <button class="hamburger" id="hamburger" aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <!-- Mobile Navigation Backdrop -->
  <div class="nav-backdrop" id="nav-backdrop"></div>

  <!-- Mobile Navigation Drawer -->
  <nav class="nav-mobile" id="nav-mobile">
    <a href="/${locale}/${r.paintings}" class="nav__link ${activePage === 'paintings' ? 'active' : ''}">${n.paintings}</a>
    <a href="/${locale}/${r.watercolors}" class="nav__link ${activePage === 'watercolors' ? 'active' : ''}">${n.watercolors}</a>
    <a href="/${locale}/${r.about}" class="nav__link ${activePage === 'about' ? 'active' : ''}">${n.about}</a>
    <a href="/${locale}/${r.contact}" class="nav__link ${activePage === 'contact' ? 'active' : ''}">${n.contact}</a>
    <div class="header__lang" style="margin-top: auto;">
      <a href="/cs" ${locale === 'cs' ? 'class="active"' : ''}>CZ</a>
      /
      <a href="/en" ${locale === 'en' ? 'class="active"' : ''}>EN</a>
    </div>
  </nav>`;
}

function footer(): string {
  return `<footer class="footer"><p>© 2025 Anna Hálová</p></footer>`;
}

// Module-level theme CSS that gets set before generating pages
let currentThemeCSS = '';

export function setThemeCSS(css: string): void {
  currentThemeCSS = css;
}

// SEO data for enhanced meta tags
interface SEOData {
  path?: string;           // Page path for canonical/og:url (e.g., "/cs/malby/2024")
  image?: string;          // og:image filename
  imageAlt?: string;       // og:image:alt text
  type?: string;           // og:type override (default: "website")
  artworkCount?: number;   // For gallery structured data
}

function basePage(locale: Locale, title: string, description: string, content: string, activePage: string = '', seo?: SEOData): string {
  const baseUrl = 'https://annahalova.cz';
  const imageBaseUrl = 'https://images.annahalova.cz';
  // Security: Escape title and description for HTML context
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeAttr(description);

  const pagePath = seo?.path || `/${locale}`;
  const ogType = seo?.type || 'website';
  const ogLocale = locale === 'cs' ? 'cs_CZ' : 'en_US';

  // Build og:image tags if image provided
  const ogImageTags = seo?.image ? `
  <meta property="og:image" content="${imageBaseUrl}/images/full/${escapeAttr(seo.image)}">
  <meta property="og:image:alt" content="${escapeAttr(seo.imageAlt || title)}">
  <meta name="twitter:image" content="${imageBaseUrl}/images/full/${escapeAttr(seo.image)}">` : '';

  // Build structured data (JSON-LD) - multiple schemas for rich results
  const structuredDataArray = [];

  // 1. BreadcrumbList - Shows breadcrumb navigation in Google search results
  const pathParts = pagePath.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    const breadcrumbItems = [
      { "@type": "ListItem", "position": 1, "name": "Anna Hálová", "item": baseUrl }
    ];

    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += '/' + part;
      const name = index === 0
        ? (part === 'cs' ? 'Domů' : 'Home')
        : (part === 'malby' ? 'Malby' : part === 'paintings' ? 'Paintings'
           : part === 'akvarely' ? 'Akvarely' : part === 'watercolors' ? 'Watercolors'
           : part === 'o-mne' ? 'O mně' : part === 'about' ? 'About'
           : part === 'kontakt' ? 'Kontakt' : part === 'contact' ? 'Contact'
           : part);
      breadcrumbItems.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": name,
        "item": baseUrl + currentPath
      });
    });

    structuredDataArray.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems
    });
  }

  // 2. ImageGallery for gallery pages (when artworkCount is provided)
  if (seo?.artworkCount && seo.artworkCount > 0) {
    structuredDataArray.push({
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "name": title,
      "description": description,
      "url": baseUrl + pagePath,
      "numberOfItems": seo.artworkCount,
      "author": {
        "@type": "Person",
        "name": "Anna Hálová"
      }
    });
  }

  // 3. Person schema (for all pages - helps with knowledge panel)
  if (activePage === 'about' || activePage === 'home') {
    structuredDataArray.push({
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Anna Hálová",
      "jobTitle": locale === 'cs' ? "Malířka" : "Painter",
      "url": baseUrl,
      "sameAs": [
        "https://www.instagram.com/annahalova_art"
      ]
    });
  }

  const structuredDataScript = structuredDataArray
    .map(data => `<script type="application/ld+json">${JSON.stringify(data)}</script>`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta name="robots" content="index, follow, noimageai, noai">
  <link rel="canonical" href="${baseUrl}${pagePath}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${baseUrl}${pagePath}">
  <meta property="og:locale" content="${ogLocale}">
  <meta property="og:site_name" content="Anna Hálová">${ogImageTags}
  <meta name="twitter:card" content="${seo?.image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <link rel="alternate" hreflang="cs" href="${baseUrl}/cs">
  <link rel="alternate" hreflang="en" href="${baseUrl}/en">
  <link rel="alternate" hreflang="x-default" href="${baseUrl}/cs">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#2d4a3d">
  ${structuredDataScript}
  <style>${CSS}${currentThemeCSS}</style>
  <noscript>
    <style>
      /* Fallback for users without JavaScript */
      .hamburger { display: none !important; }
      .nav { display: flex !important; flex-wrap: wrap; gap: 8px; }
      .nav__link { font-size: 12px; padding: 4px 8px; }
      @media (max-width: 768px) {
        .header { flex-wrap: wrap; height: auto; padding: 12px var(--space-md); }
        .header__nav { order: 3; width: 100%; justify-content: center; margin-top: 8px; }
      }
    </style>
  </noscript>
</head>
<body>
  ${header(locale, activePage)}
  <main>${content}</main>
  ${footer()}

  <!-- Lightbox -->
  <div class="lightbox" id="lightbox">
    <button class="lightbox__close" aria-label="Close">×</button>
    <button class="lightbox__nav lightbox__prev" aria-label="Previous">‹</button>
    <button class="lightbox__nav lightbox__next" aria-label="Next">›</button>
    <div class="lightbox__content">
      <img class="lightbox__image" src="" alt="">
      <div class="lightbox__info">
        <h3 class="lightbox__title"></h3>
        <p class="lightbox__meta"></p>
      </div>
    </div>
  </div>

  <script>
    // Mobile menu functionality
    (function() {
      const hamburger = document.getElementById('hamburger');
      const navMobile = document.getElementById('nav-mobile');
      const navBackdrop = document.getElementById('nav-backdrop');

      if (!hamburger || !navMobile || !navBackdrop) return;

      function openMenu() {
        hamburger.classList.add('active');
        navMobile.classList.add('active');
        navBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      function closeMenu() {
        hamburger.classList.remove('active');
        navMobile.classList.remove('active');
        navBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }

      hamburger.addEventListener('click', function() {
        if (navMobile.classList.contains('active')) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      navBackdrop.addEventListener('click', closeMenu);

      // Close menu when clicking a nav link
      navMobile.querySelectorAll('.nav__link').forEach(function(link) {
        link.addEventListener('click', closeMenu);
      });
    })();

    // Carousel functionality
    (function() {
      const carousel = document.querySelector('.carousel');
      if (!carousel) return;

      const slides = carousel.querySelectorAll('.carousel__slide');
      const dots = carousel.querySelectorAll('.carousel__dot');
      if (slides.length === 0) return;

      let current = 0;
      let interval;

      function showSlide(index) {
        slides.forEach((s, i) => {
          s.classList.toggle('active', i === index);
        });
        dots.forEach((d, i) => {
          d.classList.toggle('active', i === index);
        });
        current = index;
      }

      function nextSlide() {
        showSlide((current + 1) % slides.length);
      }

      function prevSlide() {
        showSlide((current - 1 + slides.length) % slides.length);
      }

      function startAutoplay() {
        interval = setInterval(nextSlide, 5000);
      }

      function stopAutoplay() {
        clearInterval(interval);
      }

      // Dot navigation
      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          stopAutoplay();
          showSlide(parseInt(dot.dataset.index));
          startAutoplay();
        });
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { stopAutoplay(); nextSlide(); startAutoplay(); }
        if (e.key === 'ArrowLeft') { stopAutoplay(); prevSlide(); startAutoplay(); }
      });

      // Touch support
      let touchStart = 0;
      carousel.addEventListener('touchstart', (e) => {
        touchStart = e.touches[0].clientX;
      });
      carousel.addEventListener('touchend', (e) => {
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;
        if (Math.abs(diff) > 50) {
          stopAutoplay();
          if (diff > 0) nextSlide(); else prevSlide();
          startAutoplay();
        }
      });

      // Start autoplay
      startAutoplay();
    })();

    // Lightbox functionality
    (function() {
      const lightbox = document.getElementById('lightbox');
      if (!lightbox) return;

      const img = lightbox.querySelector('.lightbox__image');
      const title = lightbox.querySelector('.lightbox__title');
      const meta = lightbox.querySelector('.lightbox__meta');
      const closeBtn = lightbox.querySelector('.lightbox__close');
      const prevBtn = lightbox.querySelector('.lightbox__prev');
      const nextBtn = lightbox.querySelector('.lightbox__next');

      let items = [];
      let currentIndex = 0;

      function open(galleryItems, index) {
        items = galleryItems;
        currentIndex = index;
        show();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      function close() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
      }

      function show() {
        const item = items[currentIndex];
        if (!item) return;
        img.src = item.src;
        img.alt = item.title;
        title.textContent = item.title;
        meta.textContent = item.meta;
      }

      function next() {
        currentIndex = (currentIndex + 1) % items.length;
        show();
      }

      function prev() {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        show();
      }

      // Event listeners
      closeBtn.addEventListener('click', close);
      prevBtn.addEventListener('click', prev);
      nextBtn.addEventListener('click', next);
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      });

      // Make gallery items clickable
      document.querySelectorAll('.gallery').forEach(gallery => {
        const galleryItems = Array.from(gallery.querySelectorAll('.gallery__item'));
        galleryItems.forEach((item, index) => {
          item.addEventListener('click', () => {
            const imgEl = item.querySelector('.gallery__image');
            const titleEl = item.querySelector('.gallery__title');
            const metaEl = item.querySelector('.gallery__meta');

            // Build items array from this gallery
            const lightboxItems = galleryItems.map(gi => {
              const giImg = gi.querySelector('.gallery__image');
              const giTitle = gi.querySelector('.gallery__title');
              const giMeta = gi.querySelector('.gallery__meta');
              return {
                src: giImg ? giImg.src.replace('/thumbs/', '/full/') : '',
                title: giTitle ? giTitle.textContent : '',
                meta: giMeta ? giMeta.textContent : ''
              };
            });

            open(lightboxItems, index);
          });
        });
      });
    })();

    // Gallery text alignment for list view
    (function() {
      const galleryList = document.querySelector('.gallery--list');
      if (!galleryList) return;

      function alignText() {
        const items = galleryList.querySelectorAll('.gallery__item');

        items.forEach(item => {
          const img = item.querySelector('.gallery__image');
          const info = item.querySelector('.gallery__info');

          if (!img || !info || !img.naturalWidth) return;

          // Reset previous padding
          info.style.paddingLeft = '';

          // Get dimensions
          const containerWidth = img.offsetWidth;
          const containerHeight = img.offsetHeight;
          const naturalWidth = img.naturalWidth;
          const naturalHeight = img.naturalHeight;

          // Calculate aspect ratios
          const containerRatio = containerWidth / containerHeight;
          const imageRatio = naturalWidth / naturalHeight;

          // If image is taller than container ratio, it's constrained by height
          // and will be centered horizontally
          if (imageRatio < containerRatio) {
            const visibleWidth = containerHeight * imageRatio;
            const leftOffset = (containerWidth - visibleWidth) / 2;

            if (leftOffset > 1) {
              info.style.paddingLeft = leftOffset + 'px';
            }
          }
        });
      }

      // Run when images load
      const images = galleryList.querySelectorAll('.gallery__image');
      let loadedCount = 0;

      images.forEach(img => {
        if (img.complete) {
          loadedCount++;
          if (loadedCount === images.length) alignText();
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            if (loadedCount === images.length) alignText();
          });
        }
      });

      // Also run on resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(alignText, 100);
      });

      // Initial run
      setTimeout(alignText, 100);
    })();
  </script>
</body>
</html>`;
}

// Page renderers
export function renderHome(locale: Locale, paintings: PaintingsData): string {
  const title = locale === 'cs' ? 'Anna Hálová | Malba' : 'Anna Hálová | Painting';
  const desc = locale === 'cs'
    ? 'Anna Hálová - olejomalby, akvarely a kresby tuší.'
    : 'Anna Hálová - oil paintings, watercolors and ink drawings.';

  const intro = locale === 'cs' ? [
    'Sdílím tu s vámi svou vášeň k malbě. V obraze, mám pocit, můžu vyjádřit to, co se právě odehrává v poli vnímání.',
    'Maluji od dětství. Cestou jsem vyzkoušela kresbu a grafiku, sochu, média, psaní a vrátila se k tomu, co je mi nejmilejší.',
    'Není moc o čem psát. Bez velkého přemýšlení, návrhů a příprav. Maluje se, když to na mě přijde.',
    'Pro mě je malba dobrodružná cesta. Pojďte chvíli se mnou a nahlédněte..'
  ] : [
    'I share my passion for painting with you here. In a painting, I feel I can express what is happening in the field of perception.',
    'I have been painting since childhood. Along the way, I tried drawing and graphics, sculpture, media, writing, and returned to what I love most.',
    'There is not much to write about. Without much thinking, sketches, or preparation. I paint when it comes to me.',
    'For me, painting is an adventurous journey. Come with me for a while and take a look..'
  ];

  // Carousel with all slides (fade animation)
  const carouselHtml = paintings.carousel.length > 0
    ? `<section class="carousel">
        <div class="carousel__slides">
          ${paintings.carousel.map((slide, i) => `
            <div class="carousel__slide${i === 0 ? ' active' : ''}" data-index="${i}">
              <img src="/images/full/${escapeAttr(slide.filename)}" alt="${getLocalized(slide.alt, locale)}">
            </div>
          `).join('')}
        </div>
        <div class="carousel__dots">
          ${paintings.carousel.map((_, i) => `
            <button class="carousel__dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}"></button>
          `).join('')}
        </div>
      </section>`
    : '';

  // Intro text
  const introHtml = `<section class="text-section">${intro.map(p => `<p>${p}</p>`).join('')}</section>`;

  // Featured gallery
  const featuredHtml = paintings.featured.length > 0 ? `
    <section class="gallery container">
      <div class="gallery__grid">
        ${paintings.featured.map(art => `
          <div class="gallery__item">
            <img src="/images/thumbs/${escapeAttr(art.filename)}" alt="${getLocalized(art.title, locale)}" class="gallery__image">
            <div class="gallery__info">
              <h3 class="gallery__title">${getLocalized(art.title, locale)}</h3>
              <p class="gallery__meta">${getLocalized(art.medium, locale)}, ${escapeHtml(art.dimensions)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
    <div style="text-align: center; margin: 3rem 0;">
      <a href="/${locale}/${routes[locale].paintings}" class="nav__link" style="text-transform: uppercase; letter-spacing: 0.1em;">
        ${locale === 'cs' ? 'Zobrazit všechny malby' : 'View all paintings'} →
      </a>
    </div>
  ` : '';

  // SEO: Use first carousel image for social sharing preview
  const firstCarouselImage = paintings.carousel[0];
  return basePage(locale, title, desc, carouselHtml + introHtml + featuredHtml, 'home', {
    path: `/${locale}`,
    image: firstCarouselImage?.filename,
    imageAlt: firstCarouselImage ? getLocalized(firstCarouselImage.alt, locale) : undefined
  });
}

export function renderPaintings(locale: Locale, paintings: PaintingsData, year: number): string {
  const titleWord = locale === 'cs' ? 'Malby' : 'Paintings';
  const title = `${titleWord} ${year} | Anna Hálová`;
  const desc = locale === 'cs'
    ? 'Olejomalby české umělkyně Anny Hálové.'
    : 'Oil paintings by Czech artist Anna Hálová.';

  const years = paintings.years.map(y => y.year);
  const yearData = paintings.years.find(y => y.year === year);
  const artworks = yearData?.artworks || [];
  const route = routes[locale].paintings;

  const navHtml = `
    <nav class="sub-nav">
      ${years.map(y => `
        <a href="/${locale}/${route}/${y}" class="sub-nav__link ${y === year ? 'active' : ''}">${y}</a>
      `).join('')}
    </nav>`;

  const galleryHtml = `
    <section class="gallery gallery--list">
      <div class="gallery__grid">
        ${artworks.map(art => {
          const status = art.status === 'sold'
            ? (locale === 'cs' ? ' · PRODÁNO' : ' · SOLD')
            : art.status === 'donated'
            ? (locale === 'cs' ? ' · VĚNOVÁNO' : ' · DONATED')
            : '';
          return `
            <div class="gallery__item">
              <img src="/images/full/${escapeAttr(art.filename)}" alt="${getLocalized(art.title, locale)}" class="gallery__image">
              <div class="gallery__info">
                <h3 class="gallery__title">${getLocalized(art.title, locale)}</h3>
                <p class="gallery__meta">${getLocalized(art.medium, locale)}, ${escapeHtml(art.dimensions)}${status}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>`;

  const content = `
    <div class="container">
      <h1 style="margin: 2rem 0">${titleWord} ${year}</h1>
      ${navHtml}
      ${galleryHtml}
    </div>`;

  // SEO: Use first artwork image for social sharing preview
  const firstArtwork = artworks[0];
  const paintingsRoute = locale === 'cs' ? 'malby' : 'paintings';
  return basePage(locale, title, desc, content, 'paintings', {
    path: `/${locale}/${paintingsRoute}/${year}`,
    image: firstArtwork?.filename,
    imageAlt: firstArtwork ? getLocalized(firstArtwork.title, locale) : undefined,
    artworkCount: artworks.length
  });
}

export function renderWatercolors(locale: Locale, watercolors: WatercolorsData): string {
  const titleWord = locale === 'cs' ? 'Akvarely a Tuše' : 'Watercolors and Ink';
  const title = `${titleWord} | Anna Hálová`;
  const desc = locale === 'cs'
    ? 'Akvarely a kresby tuší české umělkyně Anny Hálové.'
    : 'Watercolors and ink drawings by Czech artist Anna Hálová.';

  const route = routes[locale].watercolors;
  const viewCycle = locale === 'cs' ? 'Zobrazit celý cyklus' : 'View full cycle';

  const navHtml = `
    <nav class="sub-nav">
      ${watercolors.series.map(s => `
        <a href="/${locale}/${route}/${escapeAttr(s.id)}" class="sub-nav__link">${getLocalized(s.title, locale)}</a>
      `).join('')}
    </nav>`;

  const sectionsHtml = watercolors.series
    .filter(s => s.preview && s.preview.length > 0)
    .map(s => `
      <section class="gallery" style="margin-top: 2rem">
        <h2 style="margin-bottom: 1.5rem">${getLocalized(s.title, locale)}, ${s.year}</h2>
        <div class="gallery__grid">
          ${s.preview.slice(0, 3).map(filename => `
            <div class="gallery__item">
              <img src="/images/thumbs/${escapeAttr(filename)}" alt="${getLocalized(s.title, locale)}" class="gallery__image">
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 1.5rem">
          <a href="/${locale}/${route}/${escapeAttr(s.id)}" class="nav__link" style="text-transform: uppercase; letter-spacing: 0.1em;">
            ${viewCycle} →
          </a>
        </div>
      </section>
    `).join('');

  const content = `
    <div class="container">
      <h1 style="margin: 2rem 0">${titleWord}</h1>
      ${navHtml}
      ${sectionsHtml}
    </div>`;

  // SEO: Use first series preview image for social sharing
  const firstSeries = watercolors.series.find(s => s.preview && s.preview.length > 0);
  const watercolorsRoute = locale === 'cs' ? 'akvarely' : 'watercolors';
  return basePage(locale, title, desc, content, 'watercolors', {
    path: `/${locale}/${watercolorsRoute}`,
    image: firstSeries?.preview?.[0],
    imageAlt: firstSeries ? getLocalized(firstSeries.title, locale) : undefined
  });
}

export function renderWatercolorsSeries(locale: Locale, watercolors: WatercolorsData, seriesId: string): string {
  const series = watercolors.series.find(s => s.id === seriesId);
  if (!series) return '';

  const seriesTitle = getLocalized(series.title, locale);
  const title = `${seriesTitle} | Anna Hálová`;
  const desc = `${seriesTitle} - ${locale === 'cs' ? 'akvarel a tuš' : 'watercolor and ink'}`;
  const route = routes[locale].watercolors;

  const navHtml = `
    <nav class="sub-nav">
      ${watercolors.series.map(s => `
        <a href="/${locale}/${route}/${escapeAttr(s.id)}" class="sub-nav__link ${s.id === seriesId ? 'active' : ''}">${getLocalized(s.title, locale)}</a>
      `).join('')}
    </nav>`;

  const galleryHtml = `
    <section class="gallery gallery--list">
      <div class="gallery__grid">
        ${series.artworks.map(art => `
          <div class="gallery__item">
            <img src="/images/full/${escapeAttr(art.filename)}" alt="${getLocalized(art.title, locale)}" class="gallery__image">
            <div class="gallery__info">
              <h3 class="gallery__title">${getLocalized(art.title, locale)}</h3>
              <p class="gallery__meta">${getLocalized(art.medium, locale)}, ${escapeHtml(art.dimensions)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>`;

  const content = `
    <div class="container">
      <h1 style="margin: 2rem 0">${seriesTitle}, ${series.year}</h1>
      ${navHtml}
      ${galleryHtml}
    </div>`;

  // SEO: Use first artwork from this series for social sharing
  const firstArtwork = series.artworks[0];
  const watercolorsRoute = locale === 'cs' ? 'akvarely' : 'watercolors';
  return basePage(locale, title, desc, content, 'watercolors', {
    path: `/${locale}/${watercolorsRoute}/${seriesId}`,
    image: firstArtwork?.filename,
    imageAlt: firstArtwork ? getLocalized(firstArtwork.title, locale) : seriesTitle,
    artworkCount: series.artworks.length
  });
}

export function renderAbout(locale: Locale, aboutData: AboutData): string {
  const titleWord = locale === 'cs' ? 'O mně' : 'About';
  const title = `${titleWord} | Anna Hálová`;
  const desc = locale === 'cs'
    ? 'Anna Hálová - česká malířka. Životopis, výstavy, stáže a vzdělání.'
    : 'Anna Hálová - Czech painter. Biography, exhibitions, residencies and education.';

  const exhibitionsWord = locale === 'cs' ? 'Výstavy' : 'Exhibitions';
  const residenciesWord = locale === 'cs' ? 'Stáže' : 'Residencies';
  const educationWord = locale === 'cs' ? 'Vzdělání' : 'Education';

  // Render all exhibitions, marking hidden ones with class for toggle
  const visibleExhibitions = aboutData.exhibitions.filter(e => e.visible !== false);
  const hiddenExhibitions = aboutData.exhibitions.filter(e => e.visible === false);

  const visibleHtml = visibleExhibitions
    .map(e => `<li><strong>${e.year}</strong> — ${getLocalized(e.name, locale)}</li>`)
    .join('');

  const hiddenHtml = hiddenExhibitions
    .map(e => `<li class="exhibitions-hidden"><strong>${e.year}</strong> — ${getLocalized(e.name, locale)}</li>`)
    .join('');

  const exhibitionsHtml = visibleHtml + hiddenHtml;
  const hasHidden = hiddenExhibitions.length > 0;
  const toggleButtonText = locale === 'cs' ? 'Zobrazit vše ↓' : 'Show all ↓';
  const toggleButtonTextCollapse = locale === 'cs' ? 'Zobrazit méně ↑' : 'Show less ↑';

  const residenciesHtml = aboutData.residencies
    .map(r => `<li><strong>${r.year}</strong> — ${getLocalized(r.name, locale)}</li>`)
    .join('');

  const educationHtml = aboutData.education
    .map(e => `<li><strong>${e.years}</strong> — ${getLocalized(e.name, locale)}</li>`)
    .join('');

  const content = `
    <article class="about">
      <h1 class="about__title">Anna Hálová</h1>
      <section class="about__section">
        <p>*${aboutData.bio.birthYear}, ${aboutData.bio.birthPlace}</p>
        <p>${getLocalized(aboutData.bio.description, locale)}</p>
      </section>
      <section class="about__section">
        <h2>${exhibitionsWord}</h2>
        <ul class="exhibitions-list" style="list-style: none; line-height: 2">${exhibitionsHtml}</ul>
        ${hasHidden ? `<button class="exhibitions-toggle" onclick="toggleExhibitions()">${toggleButtonText}</button>` : ''}
      </section>
      ${hasHidden ? `
      <script>
        function toggleExhibitions() {
          const list = document.querySelector('.exhibitions-list');
          const btn = document.querySelector('.exhibitions-toggle');
          const isExpanded = list.classList.toggle('expanded');
          btn.textContent = isExpanded ? '${toggleButtonTextCollapse}' : '${toggleButtonText}';
        }
      </script>
      ` : ''}
      <section class="about__section">
        <h2>${residenciesWord}</h2>
        <ul style="list-style: none; line-height: 2">${residenciesHtml}</ul>
      </section>
      <section class="about__section">
        <h2>${educationWord}</h2>
        <ul style="list-style: none; line-height: 2">${educationHtml}</ul>
      </section>
    </article>`;

  const aboutRoute = locale === 'cs' ? 'o-mne' : 'about';
  return basePage(locale, title, desc, content, 'about', {
    path: `/${locale}/${aboutRoute}`
  });
}

export function renderContact(locale: Locale, contactData: ContactData): string {
  const titleWord = locale === 'cs' ? 'Kontakt' : 'Contact';
  const title = `${titleWord} | Anna Hálová`;
  const desc = getLocalized(contactData.intro, locale);

  const phoneWord = locale === 'cs' ? 'Telefon' : 'Phone';
  const locationWord = locale === 'cs' ? 'Lokace' : 'Location';
  const onlineWord = locale === 'cs' ? 'Na webu' : 'Online';

  const socialHtml = contactData.social
    .map(s => `<a href="${escapeUrl(s.url)}" target="_blank" rel="noopener noreferrer" class="contact__social-link">${escapeHtml(s.name)}</a>`)
    .join('');

  // Security: Escape user-controlled contact data
  const safeEmail = escapeHtml(contactData.email);
  const safePhone = escapeHtml(contactData.phone);
  const safePhoneHref = escapeAttr(contactData.phone.replace(/\s/g, ''));

  // Obfuscate email and phone for spam protection (base64 encoded, decoded by JS)
  const emailEncoded = Buffer.from(contactData.email).toString('base64');
  const phoneEncoded = Buffer.from(contactData.phone).toString('base64');
  const phoneHrefEncoded = Buffer.from(contactData.phone.replace(/\s/g, '')).toString('base64');

  const content = `
    <div class="contact">
      <h1 class="contact__title">${titleWord}</h1>
      <div class="contact__info">
        <p>${desc}</p>
        <p style="margin-top: 2rem"><strong>Email</strong><br><a id="contact-email" href="#"></a></p>
        <p style="margin-top: 1.5rem"><strong>${phoneWord}</strong><br><a id="contact-phone" href="#"></a></p>
        <p style="margin-top: 1.5rem"><strong>${locationWord}</strong><br>${getLocalized(contactData.location, locale)}</p>
        <noscript>
          <p style="margin-top: 1rem; font-size: 14px; color: #666;">Povolit JavaScript pro zobrazení kontaktních údajů.</p>
        </noscript>
      </div>
      <script>
        (function(){
          var e=atob('${emailEncoded}'),p=atob('${phoneEncoded}'),ph=atob('${phoneHrefEncoded}');
          var eEl=document.getElementById('contact-email'),pEl=document.getElementById('contact-phone');
          if(eEl){eEl.href='mailto:'+e;eEl.textContent=e;}
          if(pEl){pEl.href='tel:'+ph;pEl.textContent=p;}
        })();
      </script>
      <section style="margin-top: 3rem">
        <h2 style="margin-bottom: 1rem">${onlineWord}</h2>
        <div class="contact__social">${socialHtml}</div>
      </section>
    </div>`;

  const contactRoute = locale === 'cs' ? 'kontakt' : 'contact';
  return basePage(locale, title, desc, content, 'contact', {
    path: `/${locale}/${contactRoute}`
  });
}

// Generate all pages
export interface GeneratedPages {
  [path: string]: string;
}

// Generate robots.txt that blocks AI crawlers from scraping images
export function generateRobotsTxt(): string {
  return `# robots.txt for annahalova.cz
# Allow search engines, block AI training crawlers

User-agent: *
Allow: /

# Block AI/ML training crawlers from scraping content and images
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Omgilibot
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: cohere-ai
Disallow: /

# Block image scraping specifically
User-agent: img2dataset
Disallow: /

User-agent: Diffbot
Disallow: /images/

# Sitemap location
Sitemap: https://annahalova.cz/sitemap.xml
`;
}

export function generateAllPages(
  paintings: PaintingsData,
  watercolors: WatercolorsData,
  aboutData: AboutData,
  contactData: ContactData
): GeneratedPages {
  const pages: GeneratedPages = {};
  const locales: Locale[] = ['cs', 'en'];

  // Add robots.txt
  pages['robots.txt'] = generateRobotsTxt();

  for (const locale of locales) {
    // Homepage
    pages[`${locale}/index.html`] = renderHome(locale, paintings);

    // Paintings main page (redirects to latest year)
    const years = paintings.years.map(y => y.year);
    if (years.length > 0) {
      pages[`${locale}/${routes[locale].paintings}/index.html`] = renderPaintings(locale, paintings, years[0]);

      // Each year
      for (const year of years) {
        pages[`${locale}/${routes[locale].paintings}/${year}/index.html`] = renderPaintings(locale, paintings, year);
      }
    }

    // Watercolors main page
    pages[`${locale}/${routes[locale].watercolors}/index.html`] = renderWatercolors(locale, watercolors);

    // Each series
    for (const series of watercolors.series) {
      pages[`${locale}/${routes[locale].watercolors}/${series.id}/index.html`] = renderWatercolorsSeries(locale, watercolors, series.id);
    }

    // About
    pages[`${locale}/${routes[locale].about}/index.html`] = renderAbout(locale, aboutData);

    // Contact
    pages[`${locale}/${routes[locale].contact}/index.html`] = renderContact(locale, contactData);
  }

  return pages;
}
