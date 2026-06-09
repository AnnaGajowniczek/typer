import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function GET() {
  const [rows] = await pool.execute(`
    SELECT t.id, t.name, g.name AS group_name
    FROM teams t
    LEFT JOIN \`groups\` g ON g.id = t.group_id
    ORDER BY g.name, t.name
  `) as [RowDataPacket[], unknown]
  return NextResponse.json(rows)
}
