import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'DEPARTMENT_ADMIN' || !user.department) {
      return NextResponse.json(
        { success: false, error: 'Only department heads can view department access codes' },
        { status: 403 }
      )
    }

    const accesses = await db.departmentAccess.findMany({
      where: { department: user.department },
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
      },
    })

    return NextResponse.json({
      success: true,
      accesses: accesses.map((a) => ({
        id: a.id,
        templateId: a.templateId,
        templateName: a.template.name,
        department: a.department,
        accessCode: a.accessCode,
        expiresAt: a.expiresAt,
        usageLimit: a.usageLimit,
        usedCount: a.usedCount,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load department access codes' },
      { status: 500 }
    )
  }
}


