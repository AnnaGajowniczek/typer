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

    // Korekta godzin meczów 15-16 czerwca (źródło: Al Jazeera)
    await conn.query(`
      UPDATE matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      SET m.starts_at = '2026-06-15 16:00:00'
      WHERE t1.name = 'Hiszpania' AND m.starts_at = '2026-06-15 17:00:00'
    `)
    await conn.query(`
      UPDATE matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      SET m.starts_at = '2026-06-15 19:00:00'
      WHERE t1.name = 'Belgia' AND m.starts_at = '2026-06-15 22:00:00'
    `)
    await conn.query(`
      UPDATE matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      SET m.starts_at = '2026-06-16 01:00:00'
      WHERE t1.name = 'Iran' AND m.starts_at = '2026-06-16 04:00:00'
    `)
    // Korekta dat wszystkich rund playoff wg oficjalnego harmonogramu FIFA
    // Idempotentna: sortuje mecze po starts_at i przypisuje dokładne godziny
    const playoffFixes = {
      4: [ // 1/16 finału: 28 cze – 4 lip
        '2026-06-28 19:00:00', '2026-06-29 17:00:00', '2026-06-29 20:30:00',
        '2026-06-30 01:00:00', '2026-06-30 17:00:00', '2026-06-30 21:00:00',
        '2026-07-01 01:00:00', '2026-07-01 16:00:00', '2026-07-01 20:00:00',
        '2026-07-02 00:00:00', '2026-07-02 19:00:00', '2026-07-02 23:00:00',
        '2026-07-03 03:00:00', '2026-07-03 18:00:00', '2026-07-03 22:00:00',
        '2026-07-04 01:30:00',
      ],
      5: [ // 1/8 finału: 4–7 lip
        '2026-07-04 17:00:00', '2026-07-04 21:00:00',
        '2026-07-05 20:00:00', '2026-07-06 00:00:00',
        '2026-07-06 19:00:00', '2026-07-07 00:00:00',
        '2026-07-07 16:00:00', '2026-07-07 20:00:00',
      ],
      6: [ // Ćwierćfinały: 9–12 lip
        '2026-07-09 20:00:00', '2026-07-10 19:00:00',
        '2026-07-11 21:00:00', '2026-07-12 01:00:00',
      ],
      7: [ // Półfinały: 14–15 lip
        '2026-07-14 19:00:00', '2026-07-15 19:00:00',
      ],
      8: [ // Finał: 19 lip
        '2026-07-19 19:00:00',
      ],
    }
    for (const [orderNr, dates] of Object.entries(playoffFixes)) {
      const caseWhen = dates.map((d, i) => `WHEN ${i + 1} THEN '${d}'`).join(' ')
      await conn.query(`
        UPDATE matches m
        JOIN (
          SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
          FROM matches
          WHERE round_id = (SELECT id FROM rounds WHERE order_nr = ${Number(orderNr)})
        ) ranked ON m.id = ranked.id
        SET m.starts_at = CASE ranked.rn ${caseWhen} END
        WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = ${Number(orderNr)})
      `)
    }
    console.log('[setup-db] Korekty dat playoff zastosowane')

    // Dodaj kolumnę bracket_pos jeśli nie istnieje
    try {
      await conn.query('ALTER TABLE matches ADD COLUMN bracket_pos SMALLINT NULL')
      console.log('[setup-db] Dodano kolumnę bracket_pos')
    } catch (e) { /* kolumna już istnieje */ }

    // Ustaw bracket_pos dla meczów playoff po skorygowanych czasach
    // Kolejność wg oficjalnej drabinki FIFA MŚ 2026 (pary: pos1+pos2→R16#1, itp.)
    const bracketPositions = [
      // [order_nr, starts_at, bracket_pos]
      [4, '2026-06-29 20:30:00',  1],
      [4, '2026-06-30 21:00:00',  2],
      [4, '2026-06-28 19:00:00',  3],
      [4, '2026-06-30 01:00:00',  4],
      [4, '2026-06-29 17:00:00',  5],
      [4, '2026-06-30 17:00:00',  6],
      [4, '2026-07-01 01:00:00',  7],
      [4, '2026-07-01 16:00:00',  8],
      [4, '2026-07-02 23:00:00',  9],
      [4, '2026-07-02 19:00:00', 10],
      [4, '2026-07-02 00:00:00', 11],
      [4, '2026-07-01 20:00:00', 12],
      [4, '2026-07-03 03:00:00', 13],
      [4, '2026-07-04 01:30:00', 14],
      [4, '2026-07-03 22:00:00', 15],
      [4, '2026-07-03 18:00:00', 16],
      [5, '2026-07-04 21:00:00',  1],
      [5, '2026-07-04 17:00:00',  2],
      [5, '2026-07-05 20:00:00',  3],
      [5, '2026-07-06 00:00:00',  4],
      [5, '2026-07-06 19:00:00',  5],
      [5, '2026-07-07 00:00:00',  6],
      [5, '2026-07-07 20:00:00',  7],
      [5, '2026-07-07 16:00:00',  8],
      [6, '2026-07-09 20:00:00',  1],
      [6, '2026-07-11 21:00:00',  2],
      [6, '2026-07-10 19:00:00',  3],
      [6, '2026-07-12 01:00:00',  4],
      [7, '2026-07-14 19:00:00',  1],
      [7, '2026-07-15 19:00:00',  2],
      [8, '2026-07-19 19:00:00',  1],
    ]
    for (const [orderNr, startsAt, pos] of bracketPositions) {
      await conn.query(
        `UPDATE matches SET bracket_pos = ?
         WHERE round_id = (SELECT id FROM rounds WHERE order_nr = ?)
           AND starts_at = ?`,
        [pos, orderNr, startsAt]
      )
    }
    console.log('[setup-db] Pozycje drabinkowe (bracket_pos) ustawione')

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
