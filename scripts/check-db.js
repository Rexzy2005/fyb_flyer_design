const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...')
    console.log('📡 Database URL:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@'))
    
    await prisma.$connect()
    console.log('✅ Connected to database!')
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query successful!')
    
    // Check users table
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)
    
    console.log('\n🎉 Database is ready!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'P1001') {
      console.error('\n💡 Solutions:')
      console.error('1. Go to Render.com dashboard')
      console.error('2. Find your PostgreSQL database')
      console.error('3. If paused, click "Resume"')
      console.error('4. Wait 1-2 minutes for it to start')
      console.error('5. Try again')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

