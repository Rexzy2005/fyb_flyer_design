const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['error'],
})

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Mask password in URL for security
    const dbUrl = process.env.DATABASE_URL || ''
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@')
    console.log('📡 Database URL:', maskedUrl)
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Successfully connected to database!')
    
    // Test query
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database query successful!')
    
    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `
    console.log('📊 Tables found:', tables.length)
    
    console.log('\n🎉 Database is ready!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'P1001') {
      console.error('\n💡 Troubleshooting:')
      console.error('1. Check Render.com dashboard - is database running?')
      console.error('2. Verify DATABASE_URL format in .env')
      console.error('3. Ensure connection string ends with ?sslmode=require')
      console.error('4. Check if database is paused (free tier pauses after inactivity)')
    } else if (error.code === 'P1000') {
      console.error('\n💡 Authentication failed - check username/password')
    } else if (error.code === 'P1017') {
      console.error('\n💡 Server closed connection - database might be restarting')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

