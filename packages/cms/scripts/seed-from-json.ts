import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Configuration
const PKG_DIR = resolve(__dirname, '..');
const DATA_DIR = join(PKG_DIR, 'data');
const DB_NAME = 'annahalova-cms';

// Escape single quotes for SQL
function esc(str: string | undefined): string {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Generate UUID-like ID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface Artwork {
  id: string;
  filename: string;
  title: { cs: string; en: string };
  medium?: { cs: string; en: string };
  dimensions?: string;
  year?: number;
  status?: string;
}

interface YearData {
  year: number;
  artworks: Artwork[];
}

interface CarouselItem {
  filename: string;
}

interface FeaturedItem {
  id: string;
}

interface Series {
  id: string;
  title: { cs: string; en: string };
  year?: number;
  artworks: Artwork[];
}

interface PaintingsData {
  years: YearData[];
  carousel: CarouselItem[];
  featured: FeaturedItem[];
}

interface WatercolorsData {
  series: Series[];
}

const log = (msg: string) => console.log(`\n🌱 ${msg}`);

async function seed() {
  try {
    log('Reading JSON data files...');

    const paintings: PaintingsData = JSON.parse(
      readFileSync(join(DATA_DIR, 'paintings.json'), 'utf-8')
    );
    const watercolors: WatercolorsData = JSON.parse(
      readFileSync(join(DATA_DIR, 'watercolors.json'), 'utf-8')
    );

    const sql: string[] = [];
    const insertedArtworkIds = new Set<string>();

    sql.push('-- Seed: Import JSON data to D1');
    sql.push('-- Generated: ' + new Date().toISOString());
    sql.push('');

    // ===================
    // PAINTINGS
    // ===================
    log('Processing paintings...');

    // Insert all paintings from years
    for (const yearData of paintings.years) {
      for (const artwork of yearData.artworks) {
        if (insertedArtworkIds.has(artwork.id)) continue;
        insertedArtworkIds.add(artwork.id);

        sql.push(`INSERT OR REPLACE INTO artworks (id, filename, title_cs, title_en, medium_cs, medium_en, dimensions, year, status, category, is_draft) VALUES ('${esc(artwork.id)}', '${esc(artwork.filename)}', '${esc(artwork.title.cs)}', '${esc(artwork.title.en)}', '${esc(artwork.medium?.cs)}', '${esc(artwork.medium?.en)}', '${esc(artwork.dimensions)}', ${artwork.year || yearData.year}, '${artwork.status || 'available'}', 'painting', 0);`);
      }
    }

    // Create year galleries
    for (const yearData of paintings.years) {
      const galleryId = `paintings-${yearData.year}`;
      sql.push(`INSERT OR REPLACE INTO galleries (id, slug, type, name_cs, name_en, category, year, sort_order, is_visible) VALUES ('${galleryId}', '${galleryId}', 'year', 'Malby ${yearData.year}', 'Paintings ${yearData.year}', 'painting', ${yearData.year}, ${2030 - yearData.year}, 1);`);
    }

    // Gallery items for years
    for (const yearData of paintings.years) {
      const galleryId = `paintings-${yearData.year}`;
      // Delete existing items first
      sql.push(`DELETE FROM gallery_items WHERE gallery_id = '${galleryId}';`);
      yearData.artworks.forEach((artwork, index) => {
        sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', '${galleryId}', '${artwork.id}', ${index});`);
      });
    }

    // Create carousel gallery
    sql.push(`INSERT OR REPLACE INTO galleries (id, slug, type, name_cs, name_en, category, sort_order, is_visible) VALUES ('carousel', 'carousel', 'carousel', 'Carousel', 'Carousel', 'painting', 0, 1);`);

    // Map carousel filenames to artwork IDs
    const filenameToId = new Map<string, string>();
    for (const yearData of paintings.years) {
      for (const artwork of yearData.artworks) {
        filenameToId.set(artwork.filename, artwork.id);
      }
    }

    // Carousel items
    sql.push(`DELETE FROM gallery_items WHERE gallery_id = 'carousel';`);
    paintings.carousel.forEach((item, index) => {
      const artworkId = filenameToId.get(item.filename);
      if (artworkId) {
        sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', 'carousel', '${artworkId}', ${index});`);
      }
    });

    // Create featured gallery
    sql.push(`INSERT OR REPLACE INTO galleries (id, slug, type, name_cs, name_en, category, sort_order, is_visible) VALUES ('featured', 'featured', 'featured', 'Vybrané práce', 'Featured Works', 'painting', 1, 1);`);

    // Featured items
    sql.push(`DELETE FROM gallery_items WHERE gallery_id = 'featured';`);
    paintings.featured.forEach((item, index) => {
      sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', 'featured', '${item.id}', ${index});`);
    });

    // ===================
    // WATERCOLORS
    // ===================
    log('Processing watercolors...');

    // Insert all watercolors
    for (const series of watercolors.series) {
      for (const artwork of series.artworks) {
        if (insertedArtworkIds.has(artwork.id)) continue;
        insertedArtworkIds.add(artwork.id);

        const titleCs = artwork.title.cs || series.title.cs;
        const titleEn = artwork.title.en || series.title.en;

        sql.push(`INSERT OR REPLACE INTO artworks (id, filename, title_cs, title_en, medium_cs, medium_en, dimensions, year, status, category, is_draft) VALUES ('${esc(artwork.id)}', '${esc(artwork.filename)}', '${esc(titleCs)}', '${esc(titleEn)}', '${esc(artwork.medium?.cs)}', '${esc(artwork.medium?.en)}', '${esc(artwork.dimensions)}', ${artwork.year || series.year || 2025}, 'available', 'watercolor', 0);`);
      }
    }

    // Create series galleries
    watercolors.series.forEach((series, index) => {
      const galleryId = `watercolors-${series.id}`;
      sql.push(`INSERT OR REPLACE INTO galleries (id, slug, type, name_cs, name_en, category, year, series_key, sort_order, is_visible) VALUES ('${galleryId}', '${galleryId}', 'series', '${esc(series.title.cs)}', '${esc(series.title.en)}', 'watercolor', ${series.year || 2025}, '${series.id}', ${index}, 1);`);
    });

    // Gallery items for series
    for (const series of watercolors.series) {
      const galleryId = `watercolors-${series.id}`;
      sql.push(`DELETE FROM gallery_items WHERE gallery_id = '${galleryId}';`);
      series.artworks.forEach((artwork, index) => {
        sql.push(`INSERT INTO gallery_items (id, gallery_id, artwork_id, position) VALUES ('${uuid()}', '${galleryId}', '${artwork.id}', ${index});`);
      });
    }

    // Write to temp file
    const tempFile = join(PKG_DIR, '.seed-temp.sql');
    writeFileSync(tempFile, sql.join('\n'));

    log(`Executing ${sql.length} SQL statements against D1...`);

    try {
      execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file=${tempFile}`, {
        stdio: 'inherit',
        cwd: PKG_DIR
      });
    } finally {
      // Cleanup temp file
      try {
        unlinkSync(tempFile);
      } catch {}
    }

    log('✅ Seed complete!');
    log(`Total artworks: ${insertedArtworkIds.size}`);
    log(`Paintings: ${paintings.years.reduce((sum, y) => sum + y.artworks.length, 0)}`);
    log(`Watercolors: ${watercolors.series.reduce((sum, s) => sum + s.artworks.length, 0)}`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
