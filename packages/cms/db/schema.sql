-- Anna Halova CMS Database Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at INTEGER DEFAULT (unixepoch()),
  last_login INTEGER
);

-- Artworks table (core content)
CREATE TABLE IF NOT EXISTS artworks (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  title_cs TEXT NOT NULL,
  title_en TEXT NOT NULL,
  medium_cs TEXT,
  medium_en TEXT,
  description_cs TEXT,
  description_en TEXT,
  dimensions TEXT,
  year INTEGER,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'donated', 'private')),
  category TEXT NOT NULL CHECK (category IN ('painting', 'watercolor', 'ink')),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  is_draft INTEGER DEFAULT 1,
  published_snapshot TEXT  -- JSON snapshot of last published state for discard feature
);

-- Galleries table (albums/collections)
CREATE TABLE IF NOT EXISTS galleries (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('year', 'series', 'carousel', 'featured')),
  name_cs TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_cs TEXT,
  description_en TEXT,
  category TEXT CHECK (category IN ('painting', 'watercolor', 'ink')),
  year INTEGER,
  series_key TEXT,
  is_visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  published_snapshot TEXT  -- JSON snapshot of last published state for discard feature
);

-- Gallery items junction table with ordering
CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  UNIQUE(gallery_id, artwork_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_items_position ON gallery_items(gallery_id, position);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_year ON artworks(year);

-- Theme settings table
CREATE TABLE IF NOT EXISTS theme_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT CHECK (category IN ('colors', 'typography', 'spacing')),
  label TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  published_snapshot TEXT  -- JSON snapshot of last published state for discard feature
);

-- Publish log table
CREATE TABLE IF NOT EXISTS publish_log (
  id TEXT PRIMARY KEY,
  published_by TEXT REFERENCES users(id),
  published_at INTEGER DEFAULT (unixepoch()),
  status TEXT CHECK (status IN ('success', 'failed', 'pending')),
  commit_hash TEXT,
  notes TEXT
);

-- Deletion log table (tracks deleted items for publish)
CREATE TABLE IF NOT EXISTS deletion_log (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('artwork', 'gallery')),
  item_id TEXT NOT NULL,
  item_name TEXT,
  deleted_at INTEGER DEFAULT (unixepoch()),
  published_at INTEGER
);
