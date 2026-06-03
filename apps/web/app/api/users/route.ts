import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  const { rows } = await pool.query(
    'SELECT id, display_name FROM users ORDER BY display_name'
  )
  return NextResponse.json(rows)
}
