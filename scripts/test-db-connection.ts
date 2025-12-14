import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('📡 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Successfully connected to database!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query test successful:', result)
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `
    console.log('📊 Existing tables:', tables.map(t => t.tablename))
    
    console.log('\n🎉 Database connection is working perfectly!')
  } catch (error: any) {
    console.error('\n❌ Database connection failed!')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    if (error.code === 'P1001') {
      console.error('\n💡 Troubleshooting tips:')
      console.error('1. Check if your Render.com database is running (not paused)')
      console.error('2. Verify your DATABASE_URL in .env file')
      console.error('3. Ensure the connection string includes ?sslmode=require')
      console.error('4. Check if your IP is whitelisted (if required)')
      console.error('5. Verify database credentials are correct')
    } else if (error.code === 'P1000') {
      console.error('\n💡 Authentication failed!')
      console.error('Check your database username and password in DATABASE_URL')
    } else if (error.code === 'P1017') {
      console.error('\n💡 Server closed the connection!')
      console.error('Database might be paused or restarting')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

