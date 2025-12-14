import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { generateEmailVerificationToken } from '@/lib/utils'
import type { User, Role } from '@prisma/client'

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
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
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

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        department: data.department,
        role: 'STUDENT',
        isVerified: false,
      },
    })

    // Verify user was created in database
    const verifyUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!verifyUser) {
      throw new Error('Failed to save user to database')
    }

    // Generate email verification token
    const token = await generateEmailVerificationToken(user.id)

    return { user, token }
  }

  static async login(data: LoginUserData): Promise<User> {
    const user = await prisma.user.findUnique({
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

  static async verifyEmail(token: string): Promise<User> {
    const emailToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!emailToken) {
      throw new Error('Invalid verification token')
    }

    if (emailToken.expiresAt < new Date()) {
      throw new Error('Verification token has expired')
    }

    // Mark user as verified
    const user = await prisma.user.update({
      where: { id: emailToken.userId },
      data: { isVerified: true },
    })

    // Delete used token
    await prisma.emailVerificationToken.delete({
      where: { id: emailToken.id },
    })

    return user
  }

  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  static async updateRole(userId: string, role: Role): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    })
  }
}

