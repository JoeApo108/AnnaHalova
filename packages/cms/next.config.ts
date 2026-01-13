import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Monorepo root where node_modules/next is installed
const workspaceRoot = path.join(__dirname, '../..')

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Required for monorepo - both must point to same workspace root
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
}

export default withNextIntl(nextConfig)
