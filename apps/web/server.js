const { spawnSync, spawn } = require('child_process')

// Uruchom setup bazy (czeka na zakończenie)
const setup = spawnSync('node', ['scripts/setup-db.js'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})
if (setup.status !== 0) process.exit(setup.status)

// Uruchom Next.js - znajdź binarke przez Node module resolution
const nextBin = require.resolve('next/dist/bin/next')
const next = spawn(process.execPath, [nextBin, 'start', '-p', process.env.PORT || '3000'], {
  stdio: 'inherit',
  env: process.env,
})
next.on('exit', code => process.exit(code || 0))
