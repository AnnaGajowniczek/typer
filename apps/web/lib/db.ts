import mysql from 'mysql2/promise'

let _pool: mysql.Pool | undefined

function getPool(): mysql.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
    _pool = mysql.createPool(process.env.DATABASE_URL)
  }
  return _pool
}

export default new Proxy({} as mysql.Pool, {
  get(_, prop: string) {
    return (getPool() as unknown as Record<string, unknown>)[prop]
  },
})
