import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function GET() {
  const [rows] = await pool.execute(
    'SELECT registration_open FROM app_settings WHERE id = 1'
  ) as [RowDataPacket[], unknown]
  const open = rows.length === 0 ? true : Boolean(rows[0].registration_open)
  return NextResponse.json({ registration_open: open })
}
