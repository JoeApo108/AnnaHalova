#!/usr/bin/env node
// scripts/create-admin.js
// Usage: node scripts/create-admin.js <email> <password> [name] [--remote]

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { execSync } = require('child_process')

async function createAdmin() {
  const args = process.argv.slice(2)
  const isRemote = args.includes('--remote')
  const filteredArgs = args.filter(a => a !== '--remote')

  const email = filteredArgs[0]
  const password = filteredArgs[1]
  const name = filteredArgs[2] || 'Admin'

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [name] [--remote]')
    console.error('  --remote  Execute on remote D1 database (default: local)')
    process.exit(1)
  }

  const id = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 10)

  const sql = `INSERT INTO users (id, email, name, password_hash, role) VALUES ('${id}', '${email}', '${name}', '${passwordHash}', 'admin');`

  const remoteFlag = isRemote ? '--remote' : ''
  const cmd = `npx wrangler d1 execute annahalova-cms ${remoteFlag} --command="${sql}"`

  console.log(`Creating admin user: ${email}`)
  console.log(`Database: ${isRemote ? 'remote' : 'local'}`)

  try {
    if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
      console.error('Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set')
      console.error('  Set it with: export CLOUDFLARE_ACCOUNT_ID=your-account-id')
      process.exit(1)
    }
    execSync(cmd, {
      stdio: 'inherit'
    })
    console.log('\n✓ Admin user created successfully!')
  } catch (error) {
    console.error('\n✗ Failed to create admin user')
    process.exit(1)
  }
}

createAdmin()
