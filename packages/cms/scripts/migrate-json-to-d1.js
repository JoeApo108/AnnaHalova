#!/usr/bin/env node
/**
 * Migration script to convert existing JSON data to D1 SQL
 * Run: node scripts/migrate-json-to-d1.js > db/migrate-data.sql
 */

const fs = require('fs');
const path = require('path');

// Escape single quotes for SQL
function esc(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Generate UUID-like ID
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Read JSON files
const dataDir = path.join(__dirname, '../data');
const paintings = JSON.parse(fs.readFileSync(path.join(dataDir, 'paintings.json'), 'utf-8'));
const watercolors = JSON.parse(fs.readFileSync(path.join(dataDir, 'watercolors.json'), 'utf-8'));

const sql = [];
const insertedArtworkIds = new Set();

sql.push('-- Migration: Import existing JSON data to D1');
sql.push('-- Generated: ' + new Date().toISOString());
sql.push('');

// ===================
// PAINTINGS
// ===================
sql.push('-- =====================================');
sql.push('-- PAINTINGS');
sql.push('-- =====================================');
sql.push('');

// Insert all paintings from years (source of truth for artwork data)
sql.push('-- Artworks (paintings)');
for (const yearData of paintings.years) {
  for (const artwork of yearData.artworks) {
    if (insertedArtworkIds.has(artwork.id)) continue;
    insertedArtworkIds.add(artwork.id);

    sql.push(`INSERT INTO artworks (id, filename, title_cs, title_en, medium_cs, medium_en, dimensions, year, status, category, is_draft) VALUES ('${esc(artwork.id)}', '${esc(artwork.filename)}', '${esc(artwork.title.cs)}', '${esc(artwork.title.en)}', '${esc(artwork.medium?.cs || '')}', '${esc(artwork.medium?.en || '')}', '${esc(artwork.dimensions || '')}', ${artwork.year || yearData.year}, '${artwork.status || 'available'}', 'painting', 0);`);
  }
}
sql.push('');

// Create year galleries
sql.push('-- Galleries (painting years)');
for (const yearData of paintings.years) {
  const galleryId = `paintings-${yearData.year}`;
  sql.push(`INSERT INTO galleries (id, slug, type, name_cs, name_en, category, year, sort_order) VALUES ('${galleryId}', '${galleryId}', 'year', 'Malby ${yearData.year}', 'Paintings ${yearData.year}', 'painting', ${yearData.year}, ${2030 - yearData.year});`);
}
sql.push('');

// Gallery items for years
sql.push('-- Gallery items (painting years)');
for (const yearData of paintings.years) {
  const galleryId = `paintings-${yearData.year}`;
  yearData.artworks.forEach((artwork, index) => {
    sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', '${galleryId}', '${artwork.id}', ${index});`);
  });
}
sql.push('');

// Create carousel gallery
sql.push('-- Gallery: Carousel');
sql.push(`INSERT INTO galleries (id, slug, type, name_cs, name_en, category, sort_order) VALUES ('carousel', 'carousel', 'carousel', 'Carousel', 'Carousel', 'painting', 0);`);

// Map carousel filenames to artwork IDs
const filenameToId = new Map();
for (const yearData of paintings.years) {
  for (const artwork of yearData.artworks) {
    filenameToId.set(artwork.filename, artwork.id);
  }
}

sql.push('-- Gallery items: Carousel');
paintings.carousel.forEach((item, index) => {
  const artworkId = filenameToId.get(item.filename);
  if (artworkId) {
    sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', 'carousel', '${artworkId}', ${index});`);
  }
});
sql.push('');

// Create featured gallery
sql.push('-- Gallery: Featured');
sql.push(`INSERT INTO galleries (id, slug, type, name_cs, name_en, category, sort_order) VALUES ('featured', 'featured', 'featured', 'Vybrané práce', 'Featured Works', 'painting', 1);`);

sql.push('-- Gallery items: Featured');
paintings.featured.forEach((item, index) => {
  sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', 'featured', '${item.id}', ${index});`);
});
sql.push('');

// ===================
// WATERCOLORS
// ===================
sql.push('-- =====================================');
sql.push('-- WATERCOLORS');
sql.push('-- =====================================');
sql.push('');

// Insert all watercolors
sql.push('-- Artworks (watercolors)');
for (const series of watercolors.series) {
  for (const artwork of series.artworks) {
    if (insertedArtworkIds.has(artwork.id)) continue;
    insertedArtworkIds.add(artwork.id);

    // Use series title if artwork has no title
    const titleCs = artwork.title.cs || series.title.cs;
    const titleEn = artwork.title.en || series.title.en;

    sql.push(`INSERT INTO artworks (id, filename, title_cs, title_en, medium_cs, medium_en, dimensions, year, status, category, is_draft) VALUES ('${esc(artwork.id)}', '${esc(artwork.filename)}', '${esc(titleCs)}', '${esc(titleEn)}', '${esc(artwork.medium?.cs || '')}', '${esc(artwork.medium?.en || '')}', '${esc(artwork.dimensions || '')}', ${artwork.year || series.year || 2025}, 'available', 'watercolor', 0);`);
  }
}
sql.push('');

// Create series galleries
sql.push('-- Galleries (watercolor series)');
watercolors.series.forEach((series, index) => {
  const galleryId = `watercolors-${series.id}`;
  sql.push(`INSERT INTO galleries (id, slug, type, name_cs, name_en, category, year, series_key, sort_order) VALUES ('${galleryId}', '${galleryId}', 'series', '${esc(series.title.cs)}', '${esc(series.title.en)}', 'watercolor', ${series.year || 2025}, '${series.id}', ${index});`);
});
sql.push('');

// Gallery items for series
sql.push('-- Gallery items (watercolor series)');
for (const series of watercolors.series) {
  const galleryId = `watercolors-${series.id}`;
  series.artworks.forEach((artwork, index) => {
    sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', '${galleryId}', '${artwork.id}', ${index});`);
  });
}
sql.push('');

sql.push('-- Migration complete');
sql.push(`-- Total artworks: ${insertedArtworkIds.size}`);
sql.push(`-- Paintings: ${paintings.years.reduce((sum, y) => sum + y.artworks.length, 0)}`);
sql.push(`-- Watercolors: ${watercolors.series.reduce((sum, s) => sum + s.artworks.length, 0)}`);

// Output
console.log(sql.join('\n'));
