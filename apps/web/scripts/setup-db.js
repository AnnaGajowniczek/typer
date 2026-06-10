const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.log('[setup-db] DATABASE_URL not set, skipping')
    return
  }

  // Parsuj URL żeby połączyć się bez nazwy bazy (na wypadek gdy nie istnieje)
  const url = new URL(process.env.DATABASE_URL)
  const dbName = url.pathname.replace('/', '')

  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: url.password,
  })

  try {
    console.log(`[setup-db] Creating database '${dbName}' if not exists...`)
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.query(`USE \`${dbName}\``)

    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8')
    const statements = schema
      .split(';')
      .map(s => s.replace(/--[^\n]*/g, '').trim())
      .filter(Boolean)

    console.log('[setup-db] Running schema...')
    for (const stmt of statements) {
      try {
        await conn.query(stmt)
      } catch (err) {
        if (err.errno === 1061) continue // indeks już istnieje
        throw err
      }
    }

    // Korekty nazw druzyn
    await conn.query("UPDATE teams SET name = 'RPA' WHERE name = 'Republika Południowej Afryki'")

    // Uprawnienia admina
    await conn.query(
      "UPDATE users SET is_admin = TRUE WHERE email IN ('anna@itss.pl', 'annaX@itss.pl')"
    )

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
