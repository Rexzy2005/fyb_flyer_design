import { db, testDatabaseConnection } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { generateEmailVerificationToken } from '@/lib/utils'
import type { Role, User } from '@prisma/client'

export interface RegisterUserData {
  email: string
  username: string
  password: string
  school: string
  department?: string
  isDepartmentHead?: boolean
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
      const existingUser = await db.user.findFirst({
        where: {
          OR: [{ email: data.email }, { username: data.username }],
        },
      })

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new Error('Email already registered')
        }
        if (existingUser.username === data.username) {
          throw new Error('Username already taken')
        }
      }

      // Hash password
      const passwordHash = await hashPassword(data.password)

      // Determine role
      const role: Role = data.isDepartmentHead ? 'DEPARTMENT_ADMIN' : 'STUDENT'

      // Ensure only one department head per department
      if (data.isDepartmentHead && data.department) {
        const existingHead = await db.user.findFirst({
          where: {
            department: data.department,
            role: 'DEPARTMENT_ADMIN',
            school: data.school,
          },
        })

        if (existingHead) {
          throw new Error('A department head already exists for this department')
        }
      }

      if (data.isDepartmentHead && !data.department) {
        throw new Error('Department is required when registering as a department head')
      }

      // Create user in database
      const user = await db.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash,
          school: data.school,
          department: data.department,
          role,
          isVerified: false,
        },
      })

      // Generate email verification token
      const token = await generateEmailVerificationToken(user.id)

      return { user, token }
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
    const user = await db.user.findUnique({
      where: { email: data.email },
    })

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
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Find verification token for this user
    const emailToken = await db.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        token: otp,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!emailToken) {
      throw new Error('Invalid OTP code')
    }

    if (emailToken.expiresAt < new Date()) {
      throw new Error('OTP code has expired. Please request a new one.')
    }

    // Mark user as verified
    const verifiedUser = await db.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    })

    // Delete used token
    await db.emailVerificationToken.delete({
      where: { id: emailToken.id },
    })

    return verifiedUser
  }

  static async resendOTP(email: string): Promise<string> {
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.isVerified) {
      throw new Error('Email is already verified')
    }

    // Delete old tokens for this user
    await db.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    })

    // Generate new OTP
    const { generateEmailVerificationToken } = await import('@/lib/utils')
    const otp = await generateEmailVerificationToken(user.id)

    return otp
  }

  static async findById(id: string): Promise<User | null> {
    return db.user.findUnique({
      where: { id },
    })
  }

  static async findByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({
      where: { email },
    })
  }

  static async updateRole(userId: string, role: Role): Promise<User> {
    return db.user.update({
      where: { id: userId },
      data: { role },
    })
  }
}
