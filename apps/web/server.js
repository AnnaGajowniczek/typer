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
