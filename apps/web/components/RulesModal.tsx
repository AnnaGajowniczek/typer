'use client'

import { useState } from 'react'

export default function RulesModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Zasady gry"
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[#2e3192] text-white shadow-lg hover:bg-blue-900 text-sm font-bold transition flex items-center justify-center"
      >
        i
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2e3192]">Zasady gry</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#434351]/40 hover:text-[#434351] text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Punktacja */}
            <div>
              <h3 className="text-sm font-semibold text-[#434351] mb-2 uppercase tracking-wide">
                Punktacja
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-[#2e3192]/[0.04] rounded-xl px-4 py-3">
                  <span className="text-2xl font-black text-[#2e3192] w-8 text-center">3</span>
                  <div>
                    <div className="text-sm font-semibold text-[#434351]">Dokładny wynik</div>
                    <div className="text-xs text-[#434351]/50">Zgadłeś obie liczby goli</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#2e3192]/[0.04] rounded-xl px-4 py-3">
                  <span className="text-2xl font-black text-yellow-500 w-8 text-center">1</span>
                  <div>
                    <div className="text-sm font-semibold text-[#434351]">Trafiony wynik meczu</div>
                    <div className="text-xs text-[#434351]/50">Zgadłeś zwycięzcę lub remis, ale nie dokładny wynik</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#2e3192]/[0.04] rounded-xl px-4 py-3">
                  <span className="text-2xl font-black text-[#434351]/30 w-8 text-center">0</span>
                  <div>
                    <div className="text-sm font-semibold text-[#434351]">Pudło</div>
                    <div className="text-xs text-[#434351]/50">Błędny wynik meczu</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zasady */}
            <div>
              <h3 className="text-sm font-semibold text-[#434351] mb-2 uppercase tracking-wide">
                Zasady
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-[#434351]/70">
                <li>Typy można składać wyłącznie przed rozpoczęciem meczu. Po gwizdku sędziego edycja jest zablokowana.</li>
                <li>Typy innych graczy są ukryte do momentu startu meczu, żeby nikt nie kopiował.</li>
                <li>Typy zapisują się automatycznie po wpisaniu wyniku.</li>
                <li>Ranking aktualizuje się na bieżąco po wpisaniu wyników meczów.</li>
              </ol>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full bg-[#2e3192] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </>
  )
}
