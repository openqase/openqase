import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root for integration tests
config({ path: resolve(__dirname, '../../.env') })
config({ path: resolve(__dirname, '../../.env.local'), override: true })
