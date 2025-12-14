import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Download, Payment } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface DownloadState {
  downloads: Download[]
  payments: Payment[]
  createPayment: (userId: string, templateId: string, amount: number) => Payment
  completePayment: (paymentId: string) => void
  failPayment: (paymentId: string) => void
  addDownload: (download: Omit<Download, 'id' | 'downloadedAt'>) => Download
  getUserDownloads: (userId: string) => Download[]
  hasDownloaded: (userId: string, templateId: string) => boolean
  getDownloadCount: (userId: string, templateId: string) => number
  canEditForFree: (userId: string, templateId: string) => boolean
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: [],
      payments: [],

      createPayment: (userId: string, templateId: string, amount: number) => {
        const payment: Payment = {
          id: generateId(),
          userId,
          templateId,
          amount,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          payments: [...state.payments, payment],
        }))

        return payment
      },

      completePayment: (paymentId: string) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? { ...p, status: 'completed' as const, completedAt: new Date().toISOString() }
              : p
          ),
        }))
      },

      failPayment: (paymentId: string) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId ? { ...p, status: 'failed' as const } : p
          ),
        }))
      },

      addDownload: (download: Omit<Download, 'id' | 'downloadedAt'>) => {
        const newDownload: Download = {
          ...download,
          id: generateId(),
          downloadedAt: new Date().toISOString(),
        }

        set((state) => ({
          downloads: [...state.downloads, newDownload],
        }))

        return newDownload
      },

      getUserDownloads: (userId: string) => {
        return get().downloads.filter((d) => d.userId === userId)
      },

      hasDownloaded: (userId: string, templateId: string) => {
        return get().downloads.some((d) => d.userId === userId && d.templateId === templateId)
      },

      getDownloadCount: (userId: string, templateId: string) => {
        return get().downloads.filter(
          (d) => d.userId === userId && d.templateId === templateId
        ).length
      },

      canEditForFree: (userId: string, templateId: string) => {
        const count = get().getDownloadCount(userId, templateId)
        // First download requires payment, one free edit allowed after
        return count === 1
      },
    }),
    {
      name: 'download-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

