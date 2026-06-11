'use client'

import { useEffect, useState } from 'react'

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(localStorage.getItem('darkMode') === 'true')
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Wyłącz tryb ciemny' : 'Włącz tryb ciemny'}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/80 dark:bg-[#1e1f38]/80 border border-[#2e3192]/15 shadow-md backdrop-blur flex items-center justify-center text-lg transition hover:scale-110"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
