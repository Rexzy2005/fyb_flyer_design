import { db } from '@/lib/db'
import { downloads, templates, type Download } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'

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
    const [download] = await db
      .select()
      .from(downloads)
      .where(
        and(
          eq(downloads.userId, userId),
          eq(downloads.templateId, templateId)
        )
      )
      .limit(1)

    return download || null
  }

  static async createOrUpdate(data: CreateDownloadData): Promise<Download> {
    const existing = await this.findByUserAndTemplate(data.userId, data.templateId)

    if (existing) {
      const [updated] = await db
        .update(downloads)
        .set({
          downloadCount: existing.downloadCount + 1,
          lastDownloadAt: new Date(),
          downloadUrl: data.downloadUrl,
          emailSent: false,
        })
        .where(eq(downloads.id, existing.id))
        .returning()

      if (!updated) {
        throw new Error('Failed to update download')
      }

      return updated
    }

    const [newDownload] = await db
      .insert(downloads)
      .values({
        userId: data.userId,
        templateId: data.templateId,
        downloadUrl: data.downloadUrl,
        downloadCount: 1,
        lastDownloadAt: new Date(),
      })
      .returning()

    if (!newDownload) {
      throw new Error('Failed to create download')
    }

    return newDownload
  }

  static async useFreeEdit(userId: string, templateId: string): Promise<Download> {
    const download = await this.findByUserAndTemplate(userId, templateId)

    if (!download) {
      throw new Error('No download found')
    }

    if (download.freeEditUsed) {
      throw new Error('Free edit already used')
    }

    const [updated] = await db
      .update(downloads)
      .set({
        freeEditUsed: true,
        downloadCount: download.downloadCount + 1,
        lastDownloadAt: new Date(),
      })
      .where(eq(downloads.id, download.id))
      .returning()

    if (!updated) {
      throw new Error('Failed to update download')
    }

    return updated
  }

  static async markEmailSent(downloadId: string): Promise<Download> {
    const [updated] = await db
      .update(downloads)
      .set({ emailSent: true })
      .where(eq(downloads.id, downloadId))
      .returning()

    if (!updated) {
      throw new Error('Download not found')
    }

    return updated
  }

  static async getUserDownloads(userId: string): Promise<Download[]> {
    return db
      .select()
      .from(downloads)
      .where(eq(downloads.userId, userId))
      .orderBy(desc(downloads.lastDownloadAt))
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
