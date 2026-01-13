# Anna Hálová Portfolio

Monorepo for the artist portfolio website.

## Structure

```
packages/
├── cms/       # Admin CMS + API (Next.js on Cloudflare Workers)
└── frontend/  # Public portfolio site (Cloudflare Worker serving from R2)
```

## Development

```bash
# Install all dependencies
npm install

# Run CMS dev server
npm run dev:cms

# Run frontend dev server
npm run dev:frontend
```

## Deployment

```bash
# Deploy both
npm run deploy

# Deploy individually
npm run deploy:cms
npm run deploy:frontend
```

