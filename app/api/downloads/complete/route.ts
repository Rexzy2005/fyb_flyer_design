import { NextRequest, NextResponse } from 'next/server'
import { DownloadService } from '@/services/download.service'
import { PaymentService } from '@/services/payment.service'
import { TemplateService } from '@/services/template.service'
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

    console.log('Starting download completion for user:', user.id, 'template:', templateId)

    // Validate template exists and get template name (skip if database is down)
    let templateName = 'Template'
    try {
      const template = await TemplateService.findById(templateId)
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        )
      }
      templateName = template.name
      console.log('Template found:', template.name)
    } catch (error: any) {
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, skipping template validation')
      } else {
        throw error
      }
    }

    // Verify payment if reference provided (skip if database is down)
    if (paymentReference) {
      try {
        const payment = await PaymentService.verify(paymentReference)
        if (payment.status !== 'COMPLETED') {
          return NextResponse.json(
            { success: false, error: 'Payment not completed' },
            { status: 400 }
          )
        }
      } catch (error: any) {
        if (error?.message?.includes("Can't reach database")) {
          console.warn('⚠️ Database unreachable, skipping payment verification')
        } else {
          throw error
        }
      }
    }

    console.log('Starting Cloudinary upload...')

    // Upload image to Cloudinary
    const uploadResult = await uploadImage(
      imageData,
      `${user.id}/${templateId}`,
      {
        quality: 100,
      }
    )

    console.log('Cloudinary upload completed:', uploadResult.secure_url)

    // Check if this is a free edit (skip if database is down)
    let canDownloadFree = false
    try {
      canDownloadFree = await DownloadService.canDownloadFree(user.id, templateId)
    } catch (error: any) {
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, assuming payment required')
        canDownloadFree = false
      } else {
        throw error
      }
    }

    if (canDownloadFree) {
      // Use free edit
      const useFreeResult = await DownloadService.useFreeEdit(user.id, templateId)
      if (!useFreeResult) {
        console.warn('⚠️ Failed to mark free edit as used (database unavailable)')
      }
    }

    // Create or update download (skip if database is down)
    let download: any = null
    try {
      download = await DownloadService.createOrUpdate({
        userId: user.id,
        templateId,
        downloadUrl: uploadResult.secure_url,
      })
    } catch (error: any) {
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, download record not created')
        // Create a temporary download object
        download = {
          id: `temp-${Date.now()}`,
          downloadUrl: uploadResult.secure_url,
          downloadCount: 1,
        }
      } else {
        throw error
      }
    }

    console.log('Download record created/updated:', download?.id)

    // Increment template usage (skip if database is down)
    try {
      await TemplateService.incrementUsage(templateId)
    } catch (error: any) {
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, template usage not incremented')
      } else {
        throw error
      }
    }

    console.log('Sending email...')

    // Send email in background (don't wait for it)
    // This prevents the response from taking too long
    sendEmailInBackground(user.email, user.username, templateName, uploadResult.secure_url, download.id)
      .catch((err) => console.error('Background email sending failed:', err))

    return NextResponse.json({
      success: true,
      download: {
        id: download.id,
        downloadUrl: download.downloadUrl,
        downloadCount: download.downloadCount,
        emailSent: false, // Will be updated in background
      },
    })
  } catch (error: any) {
    console.error('Download completion failed:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'Invalid template reference. Please refresh and try again.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error?.message || 'We could not finish your download. Please try again.' },
      { status: 500 }
    )
  }
}

// Send email in the background without blocking the response
async function sendEmailInBackground(
  email: string,
  username: string,
  templateName: string,
  downloadUrl: string,
  downloadId: string
) {
  try {
    const emailHtml = renderDownloadSuccess({
      username,
      templateName,
      downloadUrl,
    })

    await sendEmail({
      to: email,
      subject: 'Your Design is Ready - FYB Studio',
      html: emailHtml,
    })

    // Mark email as sent
    await DownloadService.markEmailSent(downloadId)
    console.log('Email sent successfully to:', email)
  } catch (emailError) {
    console.error('Failed to send email to', email, ':', emailError)
  }
}

