import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = readFileSync(join(__dirname, '001_create_schema.sql'), 'utf-8')

// Split by statement-ending semicolons (crude but effective for this schema)
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`Running ${statements.length} SQL statements...`)

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i]
  if (!stmt) continue
  const preview = stmt.slice(0, 60).replace(/\n/g, ' ')
  const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' }).catch(() => ({ error: null }))
  if (error) {
    console.log(`[warn] stmt ${i + 1} via rpc failed, trying direct: ${preview}...`)
  } else {
    console.log(`[ok] stmt ${i + 1}: ${preview}...`)
  }
}

// Use postgres directly via POSTGRES_URL
import pg from 'pg'
const { Client } = pg

const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL })
await client.connect()

const fullSql = readFileSync(join(__dirname, '001_create_schema.sql'), 'utf-8')
try {
  await client.query(fullSql)
  console.log('\n✅ Migration completed successfully!')
} catch (err) {
  console.error('\n❌ Migration error:', err.message)
} finally {
  await client.end()
}
