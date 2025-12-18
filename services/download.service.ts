import { db } from '@/lib/db'
import type { Download } from '@prisma/client'

export interface CreateDownloadData {
  userId: string
  templateId: string
  downloadUrl: string
}

export class DownloadService {
  static async findByUserAndTemplate(
    userId: string,
    templateId: string
  ): Promise<Download | null> {
    return db.download.findUnique({
      where: {
        userId_templateId: { userId, templateId },
      },
    })
  }

  static async createOrUpdate(data: CreateDownloadData): Promise<Download | null> {
    try {
      return db.download.upsert({
        where: {
          userId_templateId: { userId: data.userId, templateId: data.templateId },
        },
        update: {
          downloadCount: { increment: 1 },
          lastDownloadAt: new Date(),
          downloadUrl: data.downloadUrl,
          emailSent: false,
        },
        create: {
          userId: data.userId,
          templateId: data.templateId,
          downloadUrl: data.downloadUrl,
          downloadCount: 1,
          lastDownloadAt: new Date(),
        },
      })
    } catch (error: any) {
      // If database is down, log warning but don't fail
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, download record not persisted')
        return null
      }
      if (error.code === 'P2003') {
        throw new Error(`Invalid reference: templateId or userId does not exist`)
      }
      throw error
    }
  }

  static async useFreeEdit(userId: string, templateId: string): Promise<Download | null> {
    try {
      const download = await this.findByUserAndTemplate(userId, templateId)

      if (!download) {
        throw new Error('Download record must exist before using free edit. Please make the first payment.')
      }

      if (download.freeEditUsed) {
        throw new Error('Free download already used for this template. Please make a payment to continue.')
      }

      // Mark free edit as used (second download)
      return db.download.update({
        where: { id: download.id },
        data: {
          freeEditUsed: true,
          downloadCount: download.downloadCount + 1,
          lastDownloadAt: new Date(),
        },
      })
    } catch (error: any) {
      // If database is down, log warning but don't fail
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, free edit not marked')
        return null
      }
      throw error
    }
  }

  static async markEmailSent(downloadId: string): Promise<Download | null> {
    try {
      return db.download.update({
        where: { id: downloadId },
        data: { emailSent: true },
      })
    } catch (error: any) {
      // If database is down, log warning but don't fail
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, email sent status not marked')
        return null
      }
      throw error
    }
  }

  static async getUserDownloads(userId: string): Promise<Download[]> {
    return db.download.findMany({
      where: { userId },
      orderBy: { lastDownloadAt: 'desc' },
    })
  }

  static async canDownloadFree(userId: string, templateId: string): Promise<boolean> {
    try {
      const download = await this.findByUserAndTemplate(userId, templateId)

      // No download record = first download = MUST PAY
      if (!download) {
        return false
      }

      // Download record exists and freeEditUsed is false = second download = FREE
      if (!download.freeEditUsed) {
        return true
      }

      // freeEditUsed is true = third and onwards = MUST PAY
      return false
    } catch (error: any) {
      // If database is down, assume payment required (safer default)
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, assuming payment required')
        return false
      }
      throw error
    }
  }

  static async requiresPayment(userId: string, templateId: string): Promise<boolean> {
    // The inverse of canDownloadFree
    return !(await this.canDownloadFree(userId, templateId))
  }
}
