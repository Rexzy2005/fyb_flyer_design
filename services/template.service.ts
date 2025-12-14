import { prisma } from '@/lib/prisma'
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
    const where: any = {}

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

    return prisma.template.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    })
  }

  static async findById(id: string): Promise<Template | null> {
    return prisma.template.findUnique({
      where: { id },
      include: {
        departmentAccess: true,
      },
    })
  }

  static async create(data: CreateTemplateData): Promise<Template> {
    return prisma.template.create({
      data: {
        name: data.name,
        category: data.category,
        isLocked: data.isLocked || false,
        lockedDepartment: data.lockedDepartment,
        previewImage: data.previewImage,
        canvasConfig: data.canvasConfig,
        fields: data.fields,
      },
    })
  }

  static async update(id: string, data: Partial<CreateTemplateData>): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data,
    })
  }

  static async incrementUsage(id: string): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })
  }

  static async delete(id: string): Promise<void> {
    await prisma.template.delete({
      where: { id },
    })
  }
}

