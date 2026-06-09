import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function GET() {
  const [rows] = await pool.execute(
    'SELECT id, display_name FROM users ORDER BY display_name'
  ) as [import("mysql2").RowDataPacket[], unknown]
  return NextResponse.json(rows)
}
