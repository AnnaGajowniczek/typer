'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', display_name: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordMismatch = form.confirm.length > 0 && form.password !== form.confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Hasła nie są identyczne.')
      return
    }
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    router.push('/?registered=1')
  }

  return (
    <main className="min-h-screen bg-[#eff1f9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          
          <img src="/logo-itss.png" alt="ITSS" className="h-12 mx-auto" />
          <p className="text-[#2e3192] mt-1">Typuj wyniki meczów</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#2e3192]/[0.06] backdrop-blur rounded-2xl p-8 space-y-5"
        >
          <h2 className="text-xl font-semibold text-[#434351]">Utwórz konto</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-[#2e3192] font-medium">Adres e-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="jan@example.com"
              className="w-full bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg px-4 py-2.5 text-[#434351] placeholder-[#434351]/40 focus:outline-none focus:border-[#2e3192] transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-[#2e3192] font-medium">Nazwa gracza</label>
            <input
              type="text"
              required
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              placeholder="JanKowalski"
              className="w-full bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg px-4 py-2.5 text-[#434351] placeholder-[#434351]/40 focus:outline-none focus:border-[#2e3192] transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-[#2e3192] font-medium">Hasło</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="minimum 6 znaków"
              className="w-full bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg px-4 py-2.5 text-[#434351] placeholder-[#434351]/40 focus:outline-none focus:border-[#2e3192] transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-[#2e3192] font-medium">Powtórz hasło</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              placeholder="wpisz hasło ponownie"
              className={`w-full bg-[#2e3192]/[0.06] border rounded-lg px-4 py-2.5 text-[#434351] placeholder-[#434351]/40 focus:outline-none transition ${
                passwordMismatch
                  ? 'border-red-400 focus:border-red-300'
                  : 'border-[#2e3192]/20 focus:border-[#2e3192]'
              }`}
            />
            {passwordMismatch && (
              <p className="text-red-500 text-xs mt-1">Hasła nie są identyczne.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordMismatch}
            className="w-full bg-[#2e3192] hover:bg-blue-900 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
          </button>

          <p className="text-center text-[#434351]/50 text-sm">
            Masz już konto?{' '}
            <a href="/logowanie" className="text-[#2e3192] hover:underline">
              Zaloguj się
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}
