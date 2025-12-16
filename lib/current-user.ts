import type { User } from '@prisma/client'
import { db } from './db'
import { getSession } from './auth'

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) {
    return null
  }

  return db.user.findUnique({
    where: { id: session.userId },
  })
}


