import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }
  const [rows] = await pool.execute(
    'SELECT registration_open FROM app_settings WHERE id = 1'
  ) as [RowDataPacket[], unknown]
  const open = rows.length === 0 ? true : Boolean(rows[0].registration_open)
  return NextResponse.json({ registration_open: open })
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }
  const { registration_open } = await req.json()
  await pool.execute(
    'UPDATE app_settings SET registration_open = ? WHERE id = 1',
    [registration_open ? 1 : 0]
  )
  return NextResponse.json({ registration_open })
}
