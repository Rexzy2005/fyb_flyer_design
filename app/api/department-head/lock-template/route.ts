import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { DepartmentService } from '@/services/department.service'
import { TemplateService } from '@/services/template.service'
import { PaymentService } from '@/services/payment.service'

const LOCK_PRICE = 2000 // NGN - department lock fee

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'DEPARTMENT_ADMIN' || !user.department) {
      return NextResponse.json(
        { success: false, error: 'Only department heads can lock templates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { templateId, usageLimit = 100, expiresAt } = body

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      )
    }

    const template = await TemplateService.findById(templateId)

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    if (template.isLocked && template.lockedDepartment && template.lockedDepartment !== user.department) {
      return NextResponse.json(
        { success: false, error: 'Template is already locked by another department' },
        { status: 400 }
      )
    }

    // Initiate and verify simulated payment for locking
    const { payment, reference } = await PaymentService.create({
      userId: user.id,
      templateId,
      amount: LOCK_PRICE,
      type: 'LOCK',
    })

    await PaymentService.verify(reference)

    // Lock template to this department
    await TemplateService.update(templateId, {
      isLocked: true,
      lockedDepartment: user.department,
      // status is already used as string, keep consistent
      // 'locked' means only department with access code can use
      // @ts-ignore - status accepts arbitrary string
      status: 'locked',
    } as any)

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const expires =
      expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // default 30 days

    const access = await DepartmentService.create({
      templateId,
      department: user.department,
      accessCode: code,
      expiresAt: expires,
      usageLimit: usageLimit || 100,
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to lock template' },
      { status: 500 }
    )
  }
}


