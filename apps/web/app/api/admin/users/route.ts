import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'
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
    'SELECT id, email, display_name, is_admin, points_total FROM users ORDER BY display_name'
  ) as [RowDataPacket[], unknown]
  return NextResponse.json(rows)
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 })
  }
  const { user_id, password } = await req.json()
  if (!user_id || !password || password.length < 6) {
    return NextResponse.json({ error: 'Hasło musi mieć co najmniej 6 znaków.' }, { status: 400 })
  }
  const hash = await bcrypt.hash(password, 10)
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user_id])
  return NextResponse.json({ message: 'Hasło zostało zmienione.' })
}
