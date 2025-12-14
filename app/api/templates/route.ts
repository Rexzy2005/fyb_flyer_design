import { NextRequest, NextResponse } from 'next/server'
import { TemplateService } from '@/services/template.service'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as any
    const isLocked = searchParams.get('isLocked')
    const department = searchParams.get('department')

    const user = await getCurrentUser()

    const templates = await TemplateService.findAll({
      category: category || undefined,
      isLocked: isLocked ? isLocked === 'true' : undefined,
      department: department || user?.department || undefined,
    })

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        isLocked: t.isLocked,
        lockedDepartment: t.lockedDepartment,
        usageCount: t.usageCount,
        previewImage: t.previewImage,
        canvasConfig: t.canvasConfig,
        fields: t.fields,
        status: t.status,
        createdAt: t.createdAt,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

