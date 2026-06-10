const { spawnSync, spawn } = require('child_process')

// Uruchom setup bazy (czeka na zakończenie)
const setup = spawnSync('node', ['scripts/setup-db.js'], {
  stdio: 'inherit',
  env: process.env,
})
if (setup.status !== 0) process.exit(setup.status)

// Uruchom Next.js
const next = spawn(
  'node_modules/.bin/next',
  ['start', '-p', process.env.PORT || '3000'],
  { stdio: 'inherit', env: process.env }
)
next.on('exit', code => process.exit(code || 0))
