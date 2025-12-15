import { db } from '@/lib/db'
import { templates, departmentAccess, type Template, type TemplateCategory } from '@/drizzle/schema'
import { eq, or, and, desc } from 'drizzle-orm'

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
    const conditions = []

    if (filters?.category) {
      conditions.push(eq(templates.category, filters.category))
    }

    if (filters?.isLocked !== undefined) {
      conditions.push(eq(templates.isLocked, filters.isLocked))
    }

    if (filters?.department) {
      // For department filter: isLocked=false OR lockedDepartment=department
      const departmentCondition = or(
        eq(templates.isLocked, false),
        eq(templates.lockedDepartment, filters.department)
      )!
      conditions.push(departmentCondition)
    }

    let query = db.select().from(templates)

    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any
    }

    const results = await query.orderBy(desc(templates.usageCount))
    return results
  }

  static async findById(id: string): Promise<Template | null> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1)

    return template || null
  }

  static async create(data: CreateTemplateData): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values({
        name: data.name,
        category: data.category,
        isLocked: data.isLocked || false,
        lockedDepartment: data.lockedDepartment,
        previewImage: data.previewImage,
        canvasConfig: data.canvasConfig,
        fields: data.fields,
      })
      .returning()

    if (!template) {
      throw new Error('Failed to create template')
    }

    return template
  }

  static async update(id: string, data: Partial<CreateTemplateData>): Promise<Template> {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked
    if (data.lockedDepartment !== undefined) updateData.lockedDepartment = data.lockedDepartment
    if (data.previewImage !== undefined) updateData.previewImage = data.previewImage
    if (data.canvasConfig !== undefined) updateData.canvasConfig = data.canvasConfig
    if (data.fields !== undefined) updateData.fields = data.fields

    const [updated] = await db
      .update(templates)
      .set(updateData)
      .where(eq(templates.id, id))
      .returning()

    if (!updated) {
      throw new Error('Template not found')
    }

    return updated
  }

  static async incrementUsage(id: string): Promise<Template> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1)

    if (!template) {
      throw new Error('Template not found')
    }

    const [updated] = await db
      .update(templates)
      .set({ usageCount: template.usageCount + 1 })
      .where(eq(templates.id, id))
      .returning()

    if (!updated) {
      throw new Error('Failed to update template')
    }

    return updated
  }

  static async delete(id: string): Promise<void> {
    await db
      .delete(templates)
      .where(eq(templates.id, id))
  }
}
