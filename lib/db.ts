import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/drizzle/schema'

// For connection pooling in production
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create connection
const conn = globalForDb.conn ?? postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn
}

// Create Drizzle instance
export const db = drizzle(conn, { schema })

// Helper function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await conn`SELECT 1`
    console.log('✅ Database connection successful!')
    return true
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error.message)
    return false
  }
}

// Export connection for raw queries if needed
export { conn }

