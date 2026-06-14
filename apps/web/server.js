const fs = require('fs')
const path = require('path')
console.log('[server] CWD:', process.cwd())
console.log('[server] __dirname:', __dirname)
console.log('[server] public/ exists:', fs.existsSync(path.join(__dirname, 'public')))
console.log('[server] logo exists:', fs.existsSync(path.join(__dirname, 'public', 'logo-itss.png')))
const { spawnSync } = require('child_process')

// Uruchom setup bazy (czeka na zakończenie)
const setup = spawnSync('node', ['scripts/setup-db.js'], {
  stdio: 'inherit',
  env: process.env,
})
if (setup.status !== 0) process.exit(setup.status)

// Uruchom Next.js - przez node zeby uniknac problemow z PATH
const nextBin = require.resolve('next/dist/bin/next')
const port = process.env.PORT || '3000'
const { spawn } = require('child_process')
const next = spawn(process.execPath, [nextBin, 'start', '-p', port], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname,
})
next.on('exit', code => process.exit(code || 0))

function syncResults() {
  const secret = process.env.SYNC_SECRET
  if (!secret) return
  fetch(`http://localhost:${port}/api/admin/sync-results`, {
    headers: { 'x-sync-secret': secret },
    signal: AbortSignal.timeout(30000),
  })
    .then(r => r.json())
    .then(d => console.log('[sync-cron]', new Date().toISOString(), d.message, `(updated: ${d.updated})`))
    .catch(e => console.error('[sync-cron]', new Date().toISOString(), 'Błąd:', e.message))
}

// Poczekaj 60s na start Next.js, potem sync co godzinę
setTimeout(() => {
  syncResults()
  setInterval(syncResults, 60 * 60 * 1000)
}, 60 * 1000)
