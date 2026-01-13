-- Default theme settings (matches current globals.css)
INSERT OR REPLACE INTO theme_settings (key, value, category, label) VALUES
  ('color-text', '#2d4a3d', 'colors', 'Text Color'),
  ('color-text-light', '#4a6b5a', 'colors', 'Light Text Color'),
  ('color-bg', '#fefefe', 'colors', 'Background'),
  ('color-bg-alt', '#f5f5f3', 'colors', 'Alt Background'),
  ('color-accent', '#2d4a3d', 'colors', 'Accent Color'),
  ('color-border', '#e0e0dc', 'colors', 'Border Color'),
  ('font-primary', '''Helvetica Neue'', Helvetica, Arial, sans-serif', 'typography', 'Primary Font'),
  ('font-size-base', '16px', 'typography', 'Base Font Size');
