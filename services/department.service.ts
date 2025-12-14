import { prisma } from '@/lib/prisma'
import type { DepartmentAccess } from '@prisma/client'

export interface CreateDepartmentAccessData {
  templateId: string
  department: string
  accessCode: string
  expiresAt: Date
  usageLimit: number
}

export class DepartmentService {
  static async validateAccessCode(
    templateId: string,
    department: string,
    accessCode: string
  ): Promise<DepartmentAccess> {
    const access = await prisma.departmentAccess.findUnique({
      where: {
        templateId_accessCode: {
          templateId,
          accessCode,
        },
      },
    })

    if (!access) {
      throw new Error('Invalid access code')
    }

    if (access.department !== department) {
      throw new Error('Access code does not match department')
    }

    if (access.expiresAt < new Date()) {
      throw new Error('Access code has expired')
    }

    if (access.usedCount >= access.usageLimit) {
      throw new Error('Access code usage limit exceeded')
    }

    return access
  }

  static async useAccessCode(accessId: string): Promise<DepartmentAccess> {
    return prisma.departmentAccess.update({
      where: { id: accessId },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    })
  }

  static async create(data: CreateDepartmentAccessData): Promise<DepartmentAccess> {
    return prisma.departmentAccess.create({
      data,
    })
  }

  static async findByTemplate(templateId: string): Promise<DepartmentAccess[]> {
    return prisma.departmentAccess.findMany({
      where: { templateId },
    })
  }

  static async delete(id: string): Promise<void> {
    await prisma.departmentAccess.delete({
      where: { id },
    })
  }
}

