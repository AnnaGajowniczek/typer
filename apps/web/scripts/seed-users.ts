import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: 'postgresql://postgres:januszniczek@localhost:5432/typowanie' })

const users = [
  { email: 'shrek@bagna.pl',         display_name: 'Shrek' },
  { email: 'simba@priderock.pl',      display_name: 'Simba' },
  { email: 'elsa@arendelle.pl',       display_name: 'Elsa' },
  { email: 'woody@zabawki.pl',        display_name: 'Woody' },
  { email: 'nemo@ocean.pl',           display_name: 'Nemo' },
  { email: 'aladdin@agrabah.pl',      display_name: 'Aladdin' },
  { email: 'mulan@chiny.pl',          display_name: 'Mulan' },
  { email: 'jack.sparrow@morze.pl',   display_name: 'JackSparrow' },
  { email: 'hermiona@hogwart.pl',     display_name: 'Hermiona' },
  { email: 'spongebob@bikiniBottom.pl', display_name: 'SpongeBob' },
]

async function main() {
  const hash = await bcrypt.hash('haslo123', 10)
  for (const u of users) {
    await pool.query(
      'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      [u.email, u.display_name, hash]
    )
    console.log(`✓ ${u.display_name}`)
  }
  await pool.end()
}

main()
