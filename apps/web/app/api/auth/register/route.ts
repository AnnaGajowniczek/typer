import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function POST(req: NextRequest) {
  const { email, first_name, last_name, password } = await req.json()
  const display_name = `${(first_name ?? '').trim()} ${(last_name ?? '').trim()}`.trim()

  if (!email || !first_name || !last_name || !password) {
    return NextResponse.json({ error: 'Wszystkie pola są wymagane.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Hasło musi mieć co najmniej 6 znaków.' }, { status: 400 })
  }

  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ?', [email]
  ) as [import("mysql2").RowDataPacket[], unknown]
  if ((existing as RowDataPacket[]).length > 0) {
    return NextResponse.json({ error: 'Konto z tym adresem email już istnieje.' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 10)
  await pool.execute(
    'INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)',
    [email, display_name, password_hash]
  )

  return NextResponse.json({ message: 'Konto zostało utworzone.' }, { status: 201 })
}
