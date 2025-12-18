import { PrismaClient } from '@prisma/client'

// Reuse Prisma client in dev to avoid connection exhaustion
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Configure connection pool
    ...(process.env.NODE_ENV === 'development' && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Helper function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful!')
    return true
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error?.message ?? error)
    return false
  }
}

// Gracefully disconnect on shutdown
process.on('SIGTERM', async () => {
  await db.$disconnect()
})
