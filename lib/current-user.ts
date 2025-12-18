import type { User } from '@prisma/client'
import { db, testDatabaseConnection } from './db'
import { getSession } from './auth'

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) {
    return null
  }

  try {
    // Set a timeout for database operations
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    )

    const userPromise = db.user.findUnique({
      where: { id: session.userId },
    })

    const user = await Promise.race([userPromise, timeoutPromise])
    return user
  } catch (error: any) {
    console.warn('⚠️ Using session fallback - database may be unavailable')
    // Return a user object from session data
    if (session) {
      return {
        id: session.userId,
        email: session.email,
        username: 'user',
        passwordHash: '',
        isVerified: true,
        role: session.role || 'STUDENT',
        school: null,
        department: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
    return null
  }
}


