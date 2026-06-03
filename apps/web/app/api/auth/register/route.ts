import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email, display_name, password } = await req.json()

  if (!email || !display_name || !password) {
    return NextResponse.json({ error: 'Wszystkie pola są wymagane.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Hasło musi mieć co najmniej 6 znaków.' }, { status: 400 })
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Konto z tym adresem email już istnieje.' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 10)
  await pool.query(
    'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3)',
    [email, display_name, password_hash]
  )

  return NextResponse.json({ message: 'Konto zostało utworzone.' }, { status: 201 })
}
