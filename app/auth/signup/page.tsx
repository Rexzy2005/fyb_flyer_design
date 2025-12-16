'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card } from '@/components/ui/card'
import { validateEmail, validatePassword } from '@/lib/utils'
import { Mail } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [school, setSchool] = useState('')
  const [schoolType, setSchoolType] = useState<'select' | 'manual'>('select')
  const [manualSchool, setManualSchool] = useState('')
  const [department, setDepartment] = useState('')
  const [departmentType, setDepartmentType] = useState<'select' | 'manual'>('select')
  const [manualDepartment, setManualDepartment] = useState('')
  const [isDepartmentHead, setIsDepartmentHead] = useState(false)
  const [adminSchools, setAdminSchools] = useState<string[]>([])
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([])
  const [isLoadingSchools, setIsLoadingSchools] = useState(false)
  const [departmentSuggestions, setDepartmentSuggestions] = useState<string[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // Load admin-managed schools on mount
  React.useEffect(() => {
    async function loadAdminSchools() {
      try {
        const res = await fetch('/api/schools')
        const data = await res.json()
        if (data.success && Array.isArray(data.adminManaged)) {
          setAdminSchools(data.adminManaged)
        }
      } catch (err) {
        console.error('Failed to load admin schools:', err)
      }
    }
    loadAdminSchools()
  }, [])

  // Load department suggestions when typing
  React.useEffect(() => {
    const controller = new AbortController()

    async function loadSuggestions() {
      const searchTerm = departmentType === 'select' ? department : manualDepartment
      if (!searchTerm || searchTerm.trim().length < 2) {
        setDepartmentSuggestions([])
        return
      }
      setIsLoadingDepartments(true)
      try {
        const res = await fetch(`/api/departments?q=${encodeURIComponent(searchTerm)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.departments)) {
          setDepartmentSuggestions(
            data.departments.filter((d: string) => d && d.toLowerCase() !== searchTerm.toLowerCase())
          )
        } else {
          setDepartmentSuggestions([])
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setDepartmentSuggestions([])
        }
      } finally {
        setIsLoadingDepartments(false)
      }
    }

    const timeout = setTimeout(loadSuggestions, 300)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [department, manualDepartment, departmentType])

  // Load school suggestions when typing manually
  React.useEffect(() => {
    const controller = new AbortController()

    async function loadSuggestions() {
      if (!manualSchool || manualSchool.trim().length < 2) {
        setSchoolSuggestions([])
        return
      }
      setIsLoadingSchools(true)
      try {
        const res = await fetch(`/api/schools?q=${encodeURIComponent(manualSchool)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.schools)) {
          setSchoolSuggestions(
            data.schools.filter((s: string) => s && s.toLowerCase() !== manualSchool.toLowerCase())
          )
        } else {
          setSchoolSuggestions([])
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setSchoolSuggestions([])
        }
      } finally {
        setIsLoadingSchools(false)
      }
    }

    const timeout = setTimeout(loadSuggestions, 300)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [manualSchool])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !username || !password || !confirmPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (!school) {
      setError('Please enter your school name')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Determine final school value
    const finalSchool = schoolType === 'select' ? school : manualSchool.trim()
    const finalDepartment = departmentType === 'select' ? department : manualDepartment.trim()

    if (!finalSchool) {
      setError('Please select or enter your school name')
      return
    }

    if (isDepartmentHead && !finalDepartment) {
      setError('Please select or enter a department to register as a department head')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          school: finalSchool,
          department: finalDepartment || undefined,
          isDepartmentHead,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle HTTP errors
        if (response.status === 503 || result.code === 'DATABASE_ERROR' || result.error?.includes('Database connection')) {
          setError(
            'Database connection failed. Your Render.com database may be paused. Please: 1) Go to dashboard.render.com, 2) Find your database, 3) Click "Resume" if paused, 4) Wait 2 minutes, then 5) Restart your dev server (Ctrl+C then npm run dev).'
          )
        } else {
          setError(result.error || `Registration failed (${response.status})`)
        }
        return
      }

      if (result.success) {
        // Verify user data was returned
        if (!result.user || !result.user.id) {
          setError('Registration completed but user data is missing. Please contact support.')
          return
        }

        // Update auth store with user data from database (not verified yet)
        useAuthStore.setState({
          user: {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username,
            role: result.user.role as any,
            department: result.user.department,
            emailVerified: false, // Not verified yet
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: false, // Not authenticated until verified
        })

        console.log('User registered successfully and saved to database:', {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
        })

        // In development, log OTP if email is not configured
        if (result.developmentOTP) {
          console.log(`\n🔑 DEVELOPMENT MODE - OTP CODE: ${result.developmentOTP}\n`)
        }

        // Redirect to OTP verification page
        router.push(`/auth/verify-otp?email=${encodeURIComponent(result.user.email)}`)
      } else {
        setError(result.error || 'Signup failed')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
            />

            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              helperText="Must be at least 8 characters long"
            />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              helperText="Re-enter your password to confirm it matches"
            />

            <div className="space-y-4">
              {/* School */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School <span className="text-red-500 ml-1">*</span>
                </label>
                {schoolType === 'select' ? (
                  <>
                    <select
                      value={school}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER__') {
                          setSchoolType('manual')
                          setSchool('')
                        } else {
                          setSchool(e.target.value)
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select your school</option>
                      {adminSchools.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="__OTHER__">Other (Enter manually)</option>
                    </select>
                    {school && school !== '__OTHER__' && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Selected: <span className="font-medium">{school}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={manualSchool}
                        onChange={(e) => setManualSchool(e.target.value)}
                        placeholder="Enter your school name"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSchoolType('select')
                          setManualSchool('')
                        }}
                      >
                        Back to List
                      </Button>
                    </div>
                    {isLoadingSchools && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Loading suggestions...</p>
                    )}
                    {schoolSuggestions.length > 0 && manualSchool.length >= 2 && (
                      <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm max-h-40 overflow-y-auto">
                        {schoolSuggestions.map((suggestion) => (
                          <button
                            type="button"
                            key={suggestion}
                            onClick={() => {
                              setManualSchool(suggestion)
                              setSchoolSuggestions([])
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Department / Section */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department / Section {isDepartmentHead && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {departmentType === 'select' ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={department}
                        onChange={(e) => {
                          const value = e.target.value
                          setDepartment(value)
                          if (value === '__OTHER__') {
                            setDepartmentType('manual')
                            setDepartment('')
                          }
                        }}
                        placeholder="Type to search or select 'Other' to enter manually"
                        required={isDepartmentHead}
                        list="department-list"
                      />
                      {department && department !== '__OTHER__' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Selected: <span className="font-medium">{department}</span>
                        </p>
                      )}
                      {departmentSuggestions.length > 0 && (
                        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm max-h-40 overflow-y-auto">
                          {departmentSuggestions.map((suggestion) => (
                            <button
                              type="button"
                              key={suggestion}
                              onClick={() => {
                                setDepartment(suggestion)
                                setDepartmentSuggestions([])
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              {suggestion}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setDepartmentType('manual')
                              setDepartment('')
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                          >
                            + Other (Enter manually)
                          </button>
                        </div>
                      )}
                      {department.length >= 2 && departmentSuggestions.length === 0 && !isLoadingDepartments && (
                        <button
                          type="button"
                          onClick={() => {
                            setDepartmentType('manual')
                            setManualDepartment(department)
                            setDepartment('')
                          }}
                          className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          + Not found? Enter manually
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={manualDepartment}
                          onChange={(e) => setManualDepartment(e.target.value)}
                          placeholder="e.g. Computer Science, 400L, Section A"
                          required={isDepartmentHead}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDepartmentType('select')
                            setManualDepartment('')
                          }}
                        >
                          Back to List
                        </Button>
                      </div>
                      {isLoadingDepartments && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Loading suggestions...</p>
                      )}
                      {departmentSuggestions.length > 0 && manualDepartment.length >= 2 && (
                        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm max-h-40 overflow-y-auto">
                          {departmentSuggestions.map((suggestion) => (
                            <button
                              type="button"
                              key={suggestion}
                              onClick={() => {
                                setManualDepartment(suggestion)
                                setDepartmentSuggestions([])
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={isDepartmentHead}
                    onChange={(e) => setIsDepartmentHead(e.target.checked)}
                  />
                  <span>
                    Register as <span className="font-semibold">Department Head</span> for this department.
                    You&apos;ll be able to lock templates for your department (locking a template still requires a separate payment).
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {showVerificationMessage && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Verification Email Sent!
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      After verification, you'll be able to log in and access all features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={showVerificationMessage}>
              {showVerificationMessage ? 'Check Your Email' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

