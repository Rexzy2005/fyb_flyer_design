// Allow both backend enum (uppercase) and frontend (lowercase) role values
export type UserRole =
  | 'student'
  | 'admin'
  | 'department_admin'
  | 'STUDENT'
  | 'ADMIN'
  | 'DEPARTMENT_ADMIN'

export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  department?: string
  emailVerified: boolean
  // Optional for compatibility with backend API responses
  isVerified?: boolean
  createdAt: string
}

export type TemplateCategory = 'fyb' | 'signout'
export type TemplateStatus = 'public' | 'locked'

export interface Template {
  id: string
  name: string
  category: TemplateCategory
  department?: string
  lockedDepartment?: string
  departmentLockCode?: string
  usageCount: number
  previewImage: string
  status: TemplateStatus
  fields: TemplateField[]
  canvasConfig: {
    width: number
    height: number
    backgroundColor: string
  }
}

export interface TemplateField {
  id: string
  name: string
  type: 'text' | 'image' | 'date' | 'number'
  label: string
  placeholder: string
  required: boolean
  // Optional logical grouping for editor forms (e.g. "Personal Details", "Profile", "Socials")
  section?: string
  position: {
    x: number
    y: number
  }
  style: {
    fontSize?: number
    fontFamily?: string
    color?: string
    fontWeight?: string
    textAlign?: 'left' | 'center' | 'right'
  }
}

export interface Download {
  id: string
  userId: string
  templateId: string
  templateName: string
  downloadUrl: string
  downloadedAt: string
  paid: boolean
  emailSent: boolean
}

export interface Payment {
  id: string
  userId: string
  templateId: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
}

export interface DepartmentAccessCode {
  code: string
  department: string
  expiresAt: string
  usageLimit: number
  usedCount: number
}

