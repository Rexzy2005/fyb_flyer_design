import { db, testDatabaseConnection } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { generateEmailVerificationToken } from '@/lib/utils'
import { users, emailVerificationTokens, type User, type Role } from '@/drizzle/schema'
import { eq, or, and, desc } from 'drizzle-orm'

export interface RegisterUserData {
  email: string
  username: string
  password: string
  department?: string
}

export interface LoginUserData {
  email: string
  password: string
}

export class UserService {
  static async register(data: RegisterUserData): Promise<{ user: User; token: string }> {
    // Test database connection first
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      throw new Error('Database connection failed. Please ensure your database is running. If using Render.com, check if the database is paused and resume it from the dashboard.')
    }

    try {
      // Check if user exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.email, data.email), eq(users.username, data.username)))
        .limit(1)

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0]
        if (existingUser.email === data.email) {
          throw new Error('Email already registered')
        }
        if (existingUser.username === data.username) {
          throw new Error('Username already taken')
        }
      }

      // Hash password
      const passwordHash = await hashPassword(data.password)

      // Create user in database
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          username: data.username,
          passwordHash,
          department: data.department,
          role: 'STUDENT',
          isVerified: false,
        })
        .returning()

      if (!user) {
        throw new Error('Failed to save user to database')
      }

      // Verify user was created in database
      const [verifyUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      if (!verifyUser) {
        throw new Error('Failed to save user to database')
      }

      // Generate email verification token
      const token = await generateEmailVerificationToken(user.id)

      return { user: verifyUser, token }
    } catch (error: any) {
      // Handle database connection errors
      if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
        throw new Error('Database connection failed. Please check if the database server is running.')
      }
      // Re-throw other errors
      throw error
    }
  }

  static async login(data: LoginUserData): Promise<User> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (!user) {
      throw new Error('Invalid email or password')
    }

    const isValid = await verifyPassword(data.password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in')
    }

    return user
  }

  static async verifyEmail(otp: string, email: string): Promise<User> {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    // Find verification token for this user
    const tokens = await db
      .select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.userId, user.id),
        eq(emailVerificationTokens.token, otp)
      ))
      .orderBy(desc(emailVerificationTokens.createdAt))
      .limit(1)

    if (tokens.length === 0) {
      throw new Error('Invalid OTP code')
    }

    const emailToken = tokens[0]

    if (emailToken.expiresAt < new Date()) {
      throw new Error('OTP code has expired. Please request a new one.')
    }

    // Mark user as verified
    const [verifiedUser] = await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, user.id))
      .returning()

    if (!verifiedUser) {
      throw new Error('Failed to verify user')
    }

    // Delete used token
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.id, emailToken.id))

    return verifiedUser
  }

  static async resendOTP(email: string): Promise<string> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.isVerified) {
      throw new Error('Email is already verified')
    }

    // Delete old tokens for this user
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, user.id))

    // Generate new OTP
    const { generateEmailVerificationToken } = await import('@/lib/utils')
    const otp = await generateEmailVerificationToken(user.id)

    return otp
  }

  static async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user || null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user || null
  }

  static async updateRole(userId: string, role: Role): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning()

    if (!updatedUser) {
      throw new Error('User not found')
    }

    return updatedUser
  }
}
