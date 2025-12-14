import { NextRequest, NextResponse } from 'next/server'
import { DownloadService } from '@/services/download.service'
import { TemplateService } from '@/services/template.service'
import { DepartmentService } from '@/services/department.service'
import { PaymentService } from '@/services/payment.service'
import { initiateDownloadSchema, unlockTemplateSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { templateId, imageData, department, accessCode } = body

    // Validate template exists
    const template = await TemplateService.findById(templateId)
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if template is locked
    if (template.isLocked) {
      if (!department || !accessCode) {
        return NextResponse.json(
          { success: false, error: 'Department access code required', requiresAccessCode: true },
          { status: 403 }
        )
      }

      // Validate access code
      try {
        await DepartmentService.validateAccessCode(templateId, department, accessCode)
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: error.message || 'Invalid access code' },
          { status: 403 }
        )
      }
    }

    // Check if payment is required
    const requiresPayment = await DownloadService.requiresPayment(user.id, templateId)

    if (requiresPayment) {
      // Create payment
      const DOWNLOAD_PRICE = 500 // NGN
      const { payment } = await PaymentService.create({
        userId: user.id,
        templateId,
        amount: DOWNLOAD_PRICE,
      })

      return NextResponse.json({
        success: false,
        requiresPayment: true,
        payment: {
          id: payment.id,
          reference: payment.reference,
          amount: payment.amount,
        },
        message: 'Payment required to download',
      })
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadImage(
      imageData,
      `${user.id}/${templateId}`,
      {
        quality: 100,
      }
    )

    // Create or update download
    const download = await DownloadService.createOrUpdate({
      userId: user.id,
      templateId,
      downloadUrl: uploadResult.secure_url,
    })

    // Increment template usage
    await TemplateService.incrementUsage(templateId)

    // Use access code if provided
    if (template.isLocked && department && accessCode) {
      const access = await DepartmentService.validateAccessCode(templateId, department, accessCode)
      await DepartmentService.useAccessCode(access.id)
    }

    return NextResponse.json({
      success: true,
      download: {
        id: download.id,
        downloadUrl: download.downloadUrl,
        downloadCount: download.downloadCount,
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
      { success: false, error: error.message || 'Download initiation failed' },
      { status: 500 }
    )
  }
}

