import { create } from 'zustand'
import type { Template, TemplateCategory } from '@/lib/types'
import { mockTemplates } from '@/lib/mock-data'

interface TemplateState {
  templates: Template[]
  selectedTemplate: Template | null
  filteredTemplates: Template[]
  filterByCategory: (category: TemplateCategory | 'all') => void
  filterByDepartment: (department: string) => void
  searchTemplates: (query: string) => void
  selectTemplate: (template: Template | null) => void
  incrementUsage: (templateId: string) => void
  unlockTemplate: (templateId: string, code: string) => Promise<{ success: boolean; error?: string }>
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: mockTemplates,
  selectedTemplate: null,
  filteredTemplates: mockTemplates,

  filterByCategory: (category: TemplateCategory | 'all') => {
    const { templates } = get()
    if (category === 'all') {
      set({ filteredTemplates: templates })
    } else {
      set({ filteredTemplates: templates.filter((t) => t.category === category) })
    }
  },

  filterByDepartment: (department: string) => {
    const { templates } = get()
    set({
      filteredTemplates: templates.filter(
        (t) => !t.department || t.department === department || t.status === 'public'
      ),
    })
  },

  searchTemplates: (query: string) => {
    const { templates } = get()
    if (!query.trim()) {
      set({ filteredTemplates: templates })
      return
    }
    const lowerQuery = query.toLowerCase()
    set({
      filteredTemplates: templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.category.toLowerCase().includes(lowerQuery)
      ),
    })
  },

  selectTemplate: (template: Template | null) => {
    set({ selectedTemplate: template })
  },

  incrementUsage: (templateId: string) => {
    const { templates } = get()
    const updated = templates.map((t) =>
      t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t
    )
    set({ templates: updated, filteredTemplates: updated })
  },

  unlockTemplate: async (templateId: string, code: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const { templates } = get()
    const template = templates.find((t) => t.id === templateId)

    if (!template || !template.departmentLockCode) {
      return { success: false, error: 'Template not found or not locked' }
    }

    // Mock validation - in production, this would check against database
    const storedCodes = JSON.parse(localStorage.getItem('department_codes') || '[]')
    const accessCode = storedCodes.find(
      (c: any) => c.code === code && c.department === template.department
    )

    if (!accessCode) {
      return { success: false, error: 'Invalid access code' }
    }

    if (new Date(accessCode.expiresAt) < new Date()) {
      return { success: false, error: 'Access code has expired' }
    }

    if (accessCode.usedCount >= accessCode.usageLimit) {
      return { success: false, error: 'Access code usage limit exceeded' }
    }

    // Increment usage
    accessCode.usedCount++
    const updatedCodes = storedCodes.map((c: any) =>
      c.code === code ? accessCode : c
    )
    localStorage.setItem('department_codes', JSON.stringify(updatedCodes))

    // Unlock template for this session
    const updated = templates.map((t) =>
      t.id === templateId ? { ...t, status: 'public' as const } : t
    )
    set({ templates: updated, filteredTemplates: updated })

    return { success: true }
  },
}))

