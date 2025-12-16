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

  static async createOrUpdate(data: CreateDownloadData): Promise<Download> {
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
  }

  static async useFreeEdit(userId: string, templateId: string): Promise<Download> {
    const download = await this.findByUserAndTemplate(userId, templateId)

    if (!download) {
      throw new Error('No download found')
    }

    if (download.freeEditUsed) {
      throw new Error('Free edit already used')
    }

    return db.download.update({
      where: { id: download.id },
      data: {
        freeEditUsed: true,
        downloadCount: download.downloadCount + 1,
        lastDownloadAt: new Date(),
      },
    })
  }

  static async markEmailSent(downloadId: string): Promise<Download> {
    return db.download.update({
      where: { id: downloadId },
      data: { emailSent: true },
    })
  }

  static async getUserDownloads(userId: string): Promise<Download[]> {
    return db.download.findMany({
      where: { userId },
      orderBy: { lastDownloadAt: 'desc' },
    })
  }

  static async canDownloadFree(userId: string, templateId: string): Promise<boolean> {
    const download = await this.findByUserAndTemplate(userId, templateId)

    if (!download) {
      return false
    }

    // Can download free if: has downloaded before AND free edit not used
    return download.downloadCount > 0 && !download.freeEditUsed
  }

  static async requiresPayment(userId: string, templateId: string): Promise<boolean> {
    const download = await this.findByUserAndTemplate(userId, templateId)

    // Requires payment if: no download OR free edit already used
    return !download || download.freeEditUsed
  }
}
