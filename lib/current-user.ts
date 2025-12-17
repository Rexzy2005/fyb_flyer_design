import type { User } from '@prisma/client'
import { db, testDatabaseConnection } from './db'
import { getSession } from './auth'

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) {
    return null
  }

  try {
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      console.error('getCurrentUser: database not reachable')
      return null
    }

    return await db.user.findUnique({
      where: { id: session.userId },
    })
  } catch (error: any) {
    console.error('getCurrentUser failed:', error?.message || error)
    return null
  }
}


