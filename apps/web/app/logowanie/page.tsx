'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/typowanie'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Nieprawidłowy e-mail lub hasło.')
      return
    }

    router.push(callbackUrl)
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
          <h2 className="text-xl font-semibold text-[#434351]">Zaloguj się</h2>

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
            <label className="text-sm text-[#2e3192] font-medium">Hasło</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-[#2e3192]/[0.06] border border-[#2e3192]/20 rounded-lg px-4 py-2.5 text-[#434351] placeholder-[#434351]/40 focus:outline-none focus:border-[#2e3192] transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2e3192] hover:bg-blue-900 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>

          <p className="text-center text-[#434351]/50 text-sm">
            Nie masz konta?{' '}
            <a href="/rejestracja" className="text-[#2e3192] hover:underline">
              Zarejestruj się
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
