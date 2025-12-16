import { NextRequest, NextResponse } from 'next/server'
import { DownloadService } from '@/services/download.service'
import { PaymentService } from '@/services/payment.service'
import { TemplateService } from '@/services/template.service'
import { verifyPaymentSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/current-user'
import { uploadImage } from '@/lib/cloudinary'
import { sendEmail } from '@/lib/mailer'
import { renderDownloadSuccess } from '@/emails/templates/download-success'

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
    const { templateId, imageData, paymentReference } = body

    // Verify payment if reference provided
    if (paymentReference) {
      const payment = await PaymentService.verify(paymentReference)
      if (payment.status !== 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Payment not completed' },
          { status: 400 }
        )
      }
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadImage(
      imageData,
      `${user.id}/${templateId}`,
      {
        quality: 100,
      }
    )

    // Check if this is a free edit
    const canDownloadFree = await DownloadService.canDownloadFree(user.id, templateId)

    if (canDownloadFree) {
      // Use free edit
      await DownloadService.useFreeEdit(user.id, templateId)
    }

    // Create or update download
    const download = await DownloadService.createOrUpdate({
      userId: user.id,
      templateId,
      downloadUrl: uploadResult.secure_url,
    })

    // Increment template usage
    await TemplateService.incrementUsage(templateId)

    // Get template for email
    const template = await TemplateService.findById(templateId)

    // Send email
    try {
      const emailHtml = renderDownloadSuccess({
        username: user.username,
        templateName: template?.name || 'Template',
        downloadUrl: uploadResult.secure_url,
      })

      await sendEmail({
        to: user.email,
        subject: 'Your Design is Ready - FYB Studio',
        html: emailHtml,
      })

      // Mark email as sent
      await DownloadService.markEmailSent(download.id)
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Don't fail download if email fails
    }

    return NextResponse.json({
      success: true,
      download: {
        id: download.id,
        downloadUrl: download.downloadUrl,
        downloadCount: download.downloadCount,
        emailSent: true,
      },
    })
  } catch (error: any) {
    console.error('Download completion failed:', error)
    return NextResponse.json(
      { success: false, error: 'We could not finish your download. Please try again.' },
      { status: 500 }
    )
  }
}

