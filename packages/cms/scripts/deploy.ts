import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Configuration
const PKG_DIR = resolve(__dirname, '..');
const ROOT_NODE_MODULES = resolve(PKG_DIR, '../../node_modules');

// Use system temp dir to escape monorepo context completely
const BUILD_DIR = join(tmpdir(), 'cms-build-' + Date.now());

// Files/Dirs to copy (Source whitelist)
const COPY_LIST = [
  'app',
  'components',
  'context',
  'data',
  'db',
  'hooks',
  'i18n',
  'lib',
  'messages',
  'public',
  'scripts',
  'env.d.ts',
  'middleware.ts',
  'next-env.d.ts',
  'open-next.config.ts',
  'package.json',
  'tsconfig.json',
  'wrangler.jsonc',
  'eslint.config.mjs'
];

// Simple Next Config (No monorepo paths, forcing standalone)
const CLEAN_NEXT_CONFIG = `
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default withNextIntl(nextConfig);
`;

const log = (msg: string) => console.log(`\n🚀 ${msg}`);
const run = (cmd: string, cwd: string) => {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
};

async function deploy() {
  try {
    // 1. Prepare Clean Build Directory
    log(`Preparing clean build environment at ${BUILD_DIR}...`);
    if (existsSync(BUILD_DIR)) {
      rmSync(BUILD_DIR, { recursive: true, force: true });
    }
    mkdirSync(BUILD_DIR);

    // 2. Copy Source Files
    log('Copying source files...');
    for (const item of COPY_LIST) {
      const src = join(PKG_DIR, item);
      const dest = join(BUILD_DIR, item);
      if (existsSync(src)) {
        cpSync(src, dest, { recursive: true });
      } else {
        // Optional items warning
        // console.warn(`⚠️  Warning: Source item not found: ${item}`);
      }
    }

    // Checking for .env files
    const envFiles = readdirSync(PKG_DIR).filter(f => f.startsWith('.env'));
    for (const env of envFiles) {
        cpSync(join(PKG_DIR, env), join(BUILD_DIR, env));
    }

    // 3. Install Dependencies
    log('Installing dependencies (Isolated)...');
    run('npm install --no-audit --no-fund --prefer-offline', BUILD_DIR);

    // 4. Create Clean Config
    log('Creating clean next.config.ts...');
    writeFileSync(join(BUILD_DIR, 'next.config.ts'), CLEAN_NEXT_CONFIG);

    // 5. Build Next.js
    log('Building Next.js application (Isolated)...');
    run('npx next build', BUILD_DIR);

    // 6. Build OpenNext
    log('Building OpenNext Cloudflare worker...');
    run('npx opennextjs-cloudflare build --skipNextBuild', BUILD_DIR);

    // 7. Deploy
    log('Deploying to Cloudflare...');
    run('npx opennextjs-cloudflare deploy', BUILD_DIR);

    log('✅ Deployment successful!');
    
    // Cleanup
    log('Cleaning up...');
    try {
      rmSync(BUILD_DIR, { recursive: true, force: true });
    } catch (e) {
      console.warn('⚠️  Failed to cleanup temp dir:', e);
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
