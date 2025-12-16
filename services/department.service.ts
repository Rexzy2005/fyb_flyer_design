import { db } from '@/lib/db'
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
    const access = await db.departmentAccess.findFirst({
      where: {
        templateId,
        accessCode,
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
    const access = await db.departmentAccess.findUnique({
      where: { id: accessId },
    })

    if (!access) {
      throw new Error('Access code not found')
    }

    return db.departmentAccess.update({
      where: { id: accessId },
      data: { usedCount: access.usedCount + 1 },
    })
  }

  static async create(data: CreateDepartmentAccessData): Promise<DepartmentAccess> {
    return db.departmentAccess.create({
      data,
    })
  }

  static async findByTemplate(templateId: string): Promise<DepartmentAccess[]> {
    return db.departmentAccess.findMany({
      where: { templateId },
    })
  }

  static async delete(id: string): Promise<void> {
    await db.departmentAccess.delete({
      where: { id },
    })
  }
}
