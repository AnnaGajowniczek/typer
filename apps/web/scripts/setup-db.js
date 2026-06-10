const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.log('[setup-db] DATABASE_URL not set, skipping')
    return
  }

  console.log('[setup-db] Connecting...')
  const conn = await mysql.createConnection(process.env.DATABASE_URL)

  try {
    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8')
    const statements = schema
      .split(';')
      .map(s => s.replace(/--[^\n]*/g, '').trim())
      .filter(Boolean)

    console.log('[setup-db] Running schema...')
    for (const stmt of statements) {
      await conn.query(stmt)
    }

    const [[{ count }]] = await conn.query('SELECT COUNT(*) as count FROM rounds')
    if (Number(count) === 0) {
      console.log('[setup-db] Seeding data...')
      const seed = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8')
      const seedStatements = seed
        .split(';')
        .map(s => s.replace(/--[^\n]*/g, '').trim())
        .filter(Boolean)
      for (const stmt of seedStatements) {
        await conn.query(stmt)
      }
      console.log('[setup-db] Seed complete')
    } else {
      console.log('[setup-db] Data already exists, skipping seed')
    }
  } finally {
    await conn.end()
  }

  console.log('[setup-db] Done')
}

setup().catch(err => {
  console.error('[setup-db] Error:', err.message)
  process.exit(1)
})
