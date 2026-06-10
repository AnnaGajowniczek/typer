const { spawnSync } = require('child_process')

// Uruchom setup bazy (czeka na zakończenie)
const setup = spawnSync('node', ['scripts/setup-db.js'], {
  stdio: 'inherit',
  env: process.env,
})
if (setup.status !== 0) process.exit(setup.status)

// Uruchom Next.js standalone server
process.env.PORT = process.env.PORT || '3000'
require('./.next/standalone/server.js')
