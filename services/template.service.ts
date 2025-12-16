import { db } from '@/lib/db'
import type { Template, TemplateCategory } from '@prisma/client'

export interface CreateTemplateData {
  name: string
  category: TemplateCategory
  isLocked?: boolean
  lockedDepartment?: string
  previewImage: string
  canvasConfig?: any
  fields?: any
}

export class TemplateService {
  static async findAll(filters?: {
    category?: TemplateCategory
    isLocked?: boolean
    department?: string
  }): Promise<Template[]> {
    const where: Record<string, any> = {}

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.isLocked !== undefined) {
      where.isLocked = filters.isLocked
    }

    if (filters?.department) {
      where.OR = [
        { isLocked: false },
        { lockedDepartment: filters.department },
      ]
    }

    return db.template.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    })
  }

  static async findById(id: string): Promise<Template | null> {
    return db.template.findUnique({
      where: { id },
    })
  }

  static async create(data: CreateTemplateData): Promise<Template> {
    return db.template.create({
      data: {
        name: data.name,
        category: data.category,
        isLocked: data.isLocked ?? false,
        lockedDepartment: data.lockedDepartment,
        previewImage: data.previewImage,
        canvasConfig: data.canvasConfig,
        fields: data.fields,
      },
    })
  }

  static async update(id: string, data: Partial<CreateTemplateData>): Promise<Template> {
    return db.template.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        isLocked: data.isLocked,
        lockedDepartment: data.lockedDepartment,
        previewImage: data.previewImage,
        canvasConfig: data.canvasConfig,
        fields: data.fields,
      },
    })
  }

  static async incrementUsage(id: string): Promise<Template> {
    return db.template.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })
  }

  static async delete(id: string): Promise<void> {
    await db.template.delete({
      where: { id },
    })
  }
}
