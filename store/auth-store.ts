import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, username: string, password: string, department?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // This is now handled by API call in login page
        // Keep for backward compatibility with existing code
        const storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
        const user = storedUsers.find(
          (u: User) => u.email === email && localStorage.getItem(`password_${u.id}`) === password
        )

        if (user) {
          set({ user, isAuthenticated: true })
          return { success: true }
        }

        return { success: false, error: 'Invalid email or password' }
      },

      signup: async (email: string, username: string, password: string, department?: string) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if email already exists
        const storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
        if (storedUsers.some((u: User) => u.email === email)) {
          return { success: false, error: 'Email already registered' }
        }

        if (storedUsers.some((u: User) => u.username === username)) {
          return { success: false, error: 'Username already taken' }
        }

        const newUser: User = {
          id: generateId(),
          email,
          username,
          role: 'student',
          department,
          emailVerified: false,
          createdAt: new Date().toISOString(),
        }

        storedUsers.push(newUser)
        localStorage.setItem('mock_users', JSON.stringify(storedUsers))
        localStorage.setItem(`password_${newUser.id}`, password)

        set({ user: newUser, isAuthenticated: true })
        return { success: true }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      verifyEmail: async (code: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Mock verification - accept any 6-digit code
        if (code.length === 6 && /^\d+$/.test(code)) {
          const user = get().user
          if (user) {
            const updatedUser = { ...user, emailVerified: true }
            const storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
            const index = storedUsers.findIndex((u: User) => u.id === user.id)
            if (index !== -1) {
              storedUsers[index] = updatedUser
              localStorage.setItem('mock_users', JSON.stringify(storedUsers))
            }
            set({ user: updatedUser })
            return { success: true }
          }
        }

        return { success: false, error: 'Invalid verification code' }
      },

      updateUser: (updates: Partial<User>) => {
        const user = get().user
        if (user) {
          const updatedUser = { ...user, ...updates }
          const storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
          const index = storedUsers.findIndex((u: User) => u.id === user.id)
          if (index !== -1) {
            storedUsers[index] = updatedUser
            localStorage.setItem('mock_users', JSON.stringify(storedUsers))
          }
          set({ user: updatedUser })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

