import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  school: z.string().min(1, 'School is required'),
  department: z.string().optional(),
  isDepartmentHead: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.isDepartmentHead) {
      return !!data.department && data.department.trim().length > 0
    }
    return true
  },
  {
    message: 'Department is required when registering as a department head',
    path: ['department'],
  }
)

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.enum(['FYB', 'SIGNOUT']),
  isLocked: z.boolean().optional(),
  lockedDepartment: z.string().optional(),
  previewImage: z.string().url('Invalid preview image URL'),
  canvasConfig: z.any().optional(),
  fields: z.any().optional(),
})

export const unlockTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  department: z.string().min(1, 'Department is required'),
  accessCode: z.string().min(1, 'Access code is required'),
})

export const initiateDownloadSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  imageData: z.string().min(1, 'Image data is required'), // Base64 image
})

export const initiatePaymentSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  amount: z.number().positive('Amount must be positive'),
})

export const verifyPaymentSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
})

export const createDepartmentAccessSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  department: z.string().min(1, 'Department is required'),
  accessCode: z.string().min(1, 'Access code is required'),
  expiresAt: z.string().datetime('Invalid expiry date'),
  usageLimit: z.number().int().positive('Usage limit must be positive'),
})

