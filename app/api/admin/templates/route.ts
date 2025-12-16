import { NextRequest, NextResponse } from 'next/server'
import { TemplateService } from '@/services/template.service'
import { createTemplateSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/current-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'DEPARTMENT_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    const template = await TemplateService.create(validatedData)

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        isLocked: template.isLocked,
        lockedDepartment: template.lockedDepartment,
        usageCount: template.usageCount,
        previewImage: template.previewImage,
        canvasConfig: template.canvasConfig,
        fields: template.fields,
        status: template.status,
        createdAt: template.createdAt,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create template' },
      { status: 500 }
    )
  }
}

