// Cloudflare Environment Bindings
declare global {
  interface CloudflareEnv {
    DB: D1Database
    R2: R2Bucket
    JWT_SECRET: string
    GITHUB_TOKEN?: string
    R2_PUBLIC_URL: string
  }
}

export {}
