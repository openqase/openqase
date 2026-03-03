import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getTableInfo() {
  // Get all tables
  const tables = [
    'algorithms',
    'case_studies',
    'industries',
    'personas',
    'user_preferences'
  ]

  let schemaDoc = '# Supabase Schema Documentation\n\n'
  
  for (const tableName of tables) {
    schemaDoc += `## Table: ${tableName}\n\n`

    // Fetch a single row to get the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error)
      continue
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      
      schemaDoc += '| Column Name | Data Type | Description |\n'
      schemaDoc += '|------------|-----------|-------------|\n'

      for (const column of columns) {
        const value = data[0][column]
        const type = typeof value
        schemaDoc += `| ${column} | ${type} | |\n`
      }
    } else {
      schemaDoc += '*No data available in table*\n'
    }

    schemaDoc += '\n'
  }

  // Write to file
  const docsDir = path.join(process.cwd(), 'docs')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }
  
  fs.writeFileSync(path.join(docsDir, 'supabase-schema.md'), schemaDoc)
  console.log('Schema documentation has been generated in docs/supabase-schema.md')
}

getTableInfo() 