import { NextRequest, NextResponse } from 'next/server'
import { DepartmentService } from '@/services/department.service'
import { createDepartmentAccessSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth'

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
    const validatedData = createDepartmentAccessSchema.parse(body)

    const access = await DepartmentService.create({
      templateId: validatedData.templateId,
      department: validatedData.department,
      accessCode: validatedData.accessCode,
      expiresAt: new Date(validatedData.expiresAt),
      usageLimit: validatedData.usageLimit,
    })

    return NextResponse.json({
      success: true,
      access: {
        id: access.id,
        templateId: access.templateId,
        department: access.department,
        accessCode: access.accessCode,
        expiresAt: access.expiresAt,
        usageLimit: access.usageLimit,
        usedCount: access.usedCount,
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
      { success: false, error: error.message || 'Failed to create department access' },
      { status: 500 }
    )
  }
}

