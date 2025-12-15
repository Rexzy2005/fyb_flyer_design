import { db } from '@/lib/db'
import { departmentAccess, type DepartmentAccess } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'

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
    const [access] = await db
      .select()
      .from(departmentAccess)
      .where(
        and(
          eq(departmentAccess.templateId, templateId),
          eq(departmentAccess.accessCode, accessCode)
        )
      )
      .limit(1)

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
    const [access] = await db
      .select()
      .from(departmentAccess)
      .where(eq(departmentAccess.id, accessId))
      .limit(1)

    if (!access) {
      throw new Error('Access code not found')
    }

    const [updated] = await db
      .update(departmentAccess)
      .set({ usedCount: access.usedCount + 1 })
      .where(eq(departmentAccess.id, accessId))
      .returning()

    if (!updated) {
      throw new Error('Failed to update access code')
    }

    return updated
  }

  static async create(data: CreateDepartmentAccessData): Promise<DepartmentAccess> {
    const [access] = await db
      .insert(departmentAccess)
      .values(data)
      .returning()

    if (!access) {
      throw new Error('Failed to create department access')
    }

    return access
  }

  static async findByTemplate(templateId: string): Promise<DepartmentAccess[]> {
    return db
      .select()
      .from(departmentAccess)
      .where(eq(departmentAccess.templateId, templateId))
  }

  static async delete(id: string): Promise<void> {
    await db
      .delete(departmentAccess)
      .where(eq(departmentAccess.id, id))
  }
}
