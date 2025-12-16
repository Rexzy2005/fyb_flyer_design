import { NextRequest, NextResponse } from 'next/server'
import { TemplateService } from '@/services/template.service'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const template = await TemplateService.findById(id)

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

