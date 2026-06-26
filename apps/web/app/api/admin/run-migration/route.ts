import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-sync-secret')
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }

  const log: string[] = []

  try {
    // 1. Dodaj kolumnę bracket_pos
    try {
      await pool.execute('ALTER TABLE matches ADD COLUMN bracket_pos SMALLINT NULL')
      log.push('ALTER TABLE: dodano bracket_pos')
    } catch {
      log.push('ALTER TABLE: bracket_pos już istnieje')
    }

    // 2. Popraw daty/godziny 1/16 finału (ROW_NUMBER po starts_at)
    await pool.execute(`
      UPDATE matches m
      JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
        FROM matches WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 4)
      ) ranked ON m.id = ranked.id
      SET m.starts_at = CASE ranked.rn
        WHEN 1  THEN '2026-06-28 19:00:00' WHEN 2  THEN '2026-06-29 17:00:00'
        WHEN 3  THEN '2026-06-29 20:30:00' WHEN 4  THEN '2026-06-30 01:00:00'
        WHEN 5  THEN '2026-06-30 17:00:00' WHEN 6  THEN '2026-06-30 21:00:00'
        WHEN 7  THEN '2026-07-01 01:00:00' WHEN 8  THEN '2026-07-01 16:00:00'
        WHEN 9  THEN '2026-07-01 20:00:00' WHEN 10 THEN '2026-07-02 00:00:00'
        WHEN 11 THEN '2026-07-02 19:00:00' WHEN 12 THEN '2026-07-02 23:00:00'
        WHEN 13 THEN '2026-07-03 03:00:00' WHEN 14 THEN '2026-07-03 18:00:00'
        WHEN 15 THEN '2026-07-03 22:00:00' WHEN 16 THEN '2026-07-04 01:30:00'
      END
      WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = 4)
    `)
    log.push('Daty 1/16 finału: OK')

    // 3. Popraw daty 1/8 finału
    await pool.execute(`
      UPDATE matches m
      JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
        FROM matches WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 5)
      ) ranked ON m.id = ranked.id
      SET m.starts_at = CASE ranked.rn
        WHEN 1 THEN '2026-07-04 17:00:00' WHEN 2 THEN '2026-07-04 21:00:00'
        WHEN 3 THEN '2026-07-05 20:00:00' WHEN 4 THEN '2026-07-06 00:00:00'
        WHEN 5 THEN '2026-07-06 19:00:00' WHEN 6 THEN '2026-07-07 00:00:00'
        WHEN 7 THEN '2026-07-07 16:00:00' WHEN 8 THEN '2026-07-07 20:00:00'
      END
      WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = 5)
    `)
    log.push('Daty 1/8 finału: OK')

    // 4. Popraw daty ćwierćfinałów
    await pool.execute(`
      UPDATE matches m
      JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY starts_at, id) AS rn
        FROM matches WHERE round_id = (SELECT id FROM rounds WHERE order_nr = 6)
      ) ranked ON m.id = ranked.id
      SET m.starts_at = CASE ranked.rn
        WHEN 1 THEN '2026-07-09 20:00:00' WHEN 2 THEN '2026-07-10 19:00:00'
        WHEN 3 THEN '2026-07-11 21:00:00' WHEN 4 THEN '2026-07-12 01:00:00'
      END
      WHERE m.round_id = (SELECT id FROM rounds WHERE order_nr = 6)
    `)
    log.push('Daty ćwierćfinałów: OK')

    // 5. Popraw daty półfinałów i finału
    await pool.execute(`UPDATE matches SET starts_at = '2026-07-14 19:00:00' WHERE round_id=(SELECT id FROM rounds WHERE order_nr=7) ORDER BY starts_at LIMIT 1`)
    await pool.execute(`UPDATE matches SET starts_at = '2026-07-15 19:00:00' WHERE round_id=(SELECT id FROM rounds WHERE order_nr=7) ORDER BY starts_at DESC LIMIT 1`)
    await pool.execute(`UPDATE matches SET starts_at = '2026-07-19 19:00:00' WHERE round_id=(SELECT id FROM rounds WHERE order_nr=8)`)
    log.push('Daty półfinałów i finału: OK')

    // 6. Ustaw bracket_pos wg oficjalnej drabinki FIFA
    const bracketPositions: [number, string, number][] = [
      [4, '2026-06-29 20:30:00',  1], [4, '2026-06-30 21:00:00',  2],
      [4, '2026-06-28 19:00:00',  3], [4, '2026-06-30 01:00:00',  4],
      [4, '2026-06-29 17:00:00',  5], [4, '2026-06-30 17:00:00',  6],
      [4, '2026-07-01 01:00:00',  7], [4, '2026-07-01 16:00:00',  8],
      [4, '2026-07-02 23:00:00',  9], [4, '2026-07-02 19:00:00', 10],
      [4, '2026-07-02 00:00:00', 11], [4, '2026-07-01 20:00:00', 12],
      [4, '2026-07-03 03:00:00', 13], [4, '2026-07-04 01:30:00', 14],
      [4, '2026-07-03 22:00:00', 15], [4, '2026-07-03 18:00:00', 16],
      [5, '2026-07-04 21:00:00',  1], [5, '2026-07-04 17:00:00',  2],
      [5, '2026-07-05 20:00:00',  3], [5, '2026-07-06 00:00:00',  4],
      [5, '2026-07-06 19:00:00',  5], [5, '2026-07-07 00:00:00',  6],
      [5, '2026-07-07 20:00:00',  7], [5, '2026-07-07 16:00:00',  8],
      [6, '2026-07-09 20:00:00',  1], [6, '2026-07-11 21:00:00',  2],
      [6, '2026-07-10 19:00:00',  3], [6, '2026-07-12 01:00:00',  4],
      [7, '2026-07-14 19:00:00',  1], [7, '2026-07-15 19:00:00',  2],
      [8, '2026-07-19 19:00:00',  1],
    ]
    for (const [orderNr, startsAt, pos] of bracketPositions) {
      await pool.execute(
        `UPDATE matches SET bracket_pos = ? WHERE round_id = (SELECT id FROM rounds WHERE order_nr = ?) AND starts_at = ?`,
        [pos, orderNr, startsAt]
      )
    }
    log.push('bracket_pos (31 meczów): OK')

    return NextResponse.json({ message: 'Migracja zakończona pomyślnie.', log })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg, log }, { status: 500 })
  }
}
