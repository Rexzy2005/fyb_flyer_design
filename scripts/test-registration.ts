/**
 * Test script to verify user registration saves to database
 * Run with: npx tsx scripts/test-registration.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testRegistration() {
  try {
    console.log('🧪 Testing user registration to database...\n')

    // Test data
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'TestPassword123!',
      department: 'Computer Science',
    }

    console.log('📝 Test user data:', testUser)

    // Call the API endpoint
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    })

    const result = await response.json()
    console.log('\n📡 API Response:', result)

    if (result.success && result.user) {
      // Verify user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { id: result.user.id },
      })

      if (dbUser) {
        console.log('\n✅ SUCCESS: User saved to database!')
        console.log('📊 Database record:', {
          id: dbUser.id,
          email: dbUser.email,
          username: dbUser.username,
          role: dbUser.role,
          department: dbUser.department,
          isVerified: dbUser.isVerified,
          createdAt: dbUser.createdAt,
        })

        // Clean up test user
        await prisma.user.delete({
          where: { id: dbUser.id },
        })
        console.log('\n🧹 Test user cleaned up from database')
      } else {
        console.error('\n❌ ERROR: User not found in database after registration!')
        process.exit(1)
      }
    } else {
      console.error('\n❌ ERROR: Registration failed:', result.error)
      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if called directly
if (require.main === module) {
  testRegistration()
}

export { testRegistration }

