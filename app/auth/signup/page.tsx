'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Sparkles, ShieldCheck, Palette, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card } from '@/components/ui/card'
import { validateEmail, validatePassword } from '@/lib/utils'

type SchoolMode = 'select' | 'manual'
type DepartmentMode = 'select' | 'manual'

const onboardingSlides = [
  {
    title: 'Design pro-level flyers in minutes',
    desc: 'Pick a premium template and customize instantly with your details.',
    icon: <Sparkles className="w-10 h-10 text-primary-500" />,
    gradient: 'from-primary-500/15 via-primary-500/5 to-transparent',
  },
  {
    title: 'Secure department access',
    desc: 'Lock templates to your department and share 6-digit access codes.',
    icon: <ShieldCheck className="w-10 h-10 text-emerald-500" />,
    gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
  },
  {
    title: 'Pay only when you download',
    desc: 'Simulated payments keep the flow smooth; export high-quality PNGs.',
    icon: <Lock className="w-10 h-10 text-amber-500" />,
    gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
  },
  {
    title: 'Crafted for Nigerian students',
    desc: 'Supports Nigerian schools and departments out of the box.',
    icon: <Palette className="w-10 h-10 text-indigo-500" />,
    gradient: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
  },
]

interface StepConfig {
  title: string
  subtitle?: string
}

const steps: StepConfig[] = [
  { title: 'Your Account', subtitle: 'Basic details to get started' },
  { title: 'School', subtitle: 'Select your school or enter it manually' },
  { title: 'Department', subtitle: 'Pick or enter your department/section' },
  { title: 'Security', subtitle: 'Set a strong password' },
  { title: 'Review & Submit', subtitle: 'Confirm your info before creating your account' },
]

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [onboardingIndex, setOnboardingIndex] = useState(0)

  // Wizard state
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [schoolMode, setSchoolMode] = useState<SchoolMode>('select')
  const [school, setSchool] = useState('')
  const [manualSchool, setManualSchool] = useState('')
  const [adminSchools, setAdminSchools] = useState<string[]>([])
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([])
  const [isLoadingSchools, setIsLoadingSchools] = useState(false)

  const [departmentMode, setDepartmentMode] = useState<DepartmentMode>('select')
  const [department, setDepartment] = useState('')
  const [manualDepartment, setManualDepartment] = useState('')
  const [departmentSuggestions, setDepartmentSuggestions] = useState<string[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)

  const [isDepartmentHead, setIsDepartmentHead] = useState(false)

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // Load admin schools on mount
  useEffect(() => {
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

  // School suggestions when typing manually
  useEffect(() => {
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

  // Department suggestions when typing
  useEffect(() => {
    const controller = new AbortController()
    async function loadSuggestions() {
      const term = departmentMode === 'select' ? department : manualDepartment
      if (!term || term.trim().length < 2) {
        setDepartmentSuggestions([])
      return
    }
      setIsLoadingDepartments(true)
      try {
        const res = await fetch(`/api/departments?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.departments)) {
          setDepartmentSuggestions(
            data.departments.filter((d: string) => d && d.toLowerCase() !== term.toLowerCase())
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
  }, [department, manualDepartment, departmentMode])

  const finalSchool = useMemo(
    () => (schoolMode === 'select' ? school : manualSchool.trim()),
    [schoolMode, school, manualSchool]
  )
  const finalDepartment = useMemo(
    () => (departmentMode === 'select' ? department : manualDepartment.trim()),
    [departmentMode, department, manualDepartment]
  )

  const canGoNext = () => {
    setError('')
    switch (step) {
      case 0:
        if (!email || !username) {
          setError('Email and username are required')
          return false
        }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
          return false
        }
        return true
      case 1:
        if (!finalSchool) {
          setError('Please select or enter your school')
          return false
        }
        return true
      case 2:
        if (isDepartmentHead && !finalDepartment) {
          setError('Please select or enter your department to register as a department head')
          return false
        }
        return true
      case 3:
        if (!password || !confirmPassword) {
          setError('Please enter and confirm your password')
          return false
        }
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long')
          return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (!canGoNext()) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const prevStep = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canGoNext()) return
    setIsSubmitting(true)
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
        setShowVerificationMessage(true)
        setStep(steps.length - 1)
        router.push(`/auth/verify-otp?email=${encodeURIComponent(result.user.email)}`)
      } else {
        setError(result.error || 'Signup failed')
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
  return (
          <div className="space-y-4">
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
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">School</span>
              <Button variant="outline" size="sm" onClick={() => setSchoolMode((m) => (m === 'select' ? 'manual' : 'select'))}>
                {schoolMode === 'select' ? 'Enter manually' : 'Choose from list'}
              </Button>
            </div>
            {schoolMode === 'select' ? (
              <select
                value={school}
                onChange={(e) => {
                  if (e.target.value === '__OTHER__') {
                    setSchoolMode('manual')
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
            ) : (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={manualSchool}
                  onChange={(e) => setManualSchool(e.target.value)}
                  placeholder="Enter your school name"
                  required
                />
                {isLoadingSchools && <p className="text-xs text-gray-500 dark:text-gray-400">Loading suggestions...</p>}
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
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Department / Section {isDepartmentHead && <span className="text-red-500 ml-1">*</span>}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDepartmentMode((m) => (m === 'select' ? 'manual' : 'select'))}
              >
                {departmentMode === 'select' ? 'Enter manually' : 'Choose from list'}
              </Button>
            </div>
            {departmentMode === 'select' ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Type to search or select 'Other'"
                  required={isDepartmentHead}
                />
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
                        setDepartmentMode('manual')
                        setDepartment('')
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                    >
                      + Other (Enter manually)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={manualDepartment}
                  onChange={(e) => setManualDepartment(e.target.value)}
                  placeholder="e.g. Computer Science, 400L, Section A"
                  required={isDepartmentHead}
                />
                {isLoadingDepartments && <p className="text-xs text-gray-500 dark:text-gray-400">Loading suggestions...</p>}
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

            <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="mt-1"
                checked={isDepartmentHead}
                onChange={(e) => setIsDepartmentHead(e.target.checked)}
              />
              <span>
                Register as <span className="font-semibold">Department Head</span> for this department. You&apos;ll be able to lock
                templates for your department (locking a template still requires a separate payment).
              </span>
            </label>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
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
          </div>
        )
      case 4:
        return (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email:</span> {email}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Username:</span> {username}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">School:</span> {finalSchool || 'Not set'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Department:</span> {finalDepartment || 'Not set'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Department Head:</span> {isDepartmentHead ? 'Yes' : 'No'}
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review your details, then click Create Account to finish. You&apos;ll receive a 6-digit OTP by email to verify your
              account.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  const onboardingDots = (
    <div className="flex items-center justify-center gap-2 mt-6">
      {onboardingSlides.map((_, idx) => (
        <span
          key={idx}
          className={`h-2 w-2 rounded-full transition-all ${idx === onboardingIndex ? 'w-4 bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}`}
        />
      ))}
    </div>
  )

  const showBack = step > 0
  const showNext = step < steps.length - 1

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur shadow-2xl p-10 space-y-6">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${onboardingSlides[onboardingIndex].gradient} pointer-events-none`}
            />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                FYB Flyer Studio
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center">
                {onboardingSlides[onboardingIndex].icon}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {onboardingSlides[onboardingIndex].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">{onboardingSlides[onboardingIndex].desc}</p>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (onboardingIndex < onboardingSlides.length - 1) {
                      setOnboardingIndex((i) => i + 1)
                    } else {
                      setShowOnboarding(false)
                    }
                  }}
                >
                  {onboardingIndex < onboardingSlides.length - 1 ? 'Next' : 'Start sign up'}
                </Button>
                <Button variant="ghost" onClick={() => setShowOnboarding(false)}>
                  Skip
                </Button>
              </div>
            </div>
            {onboardingDots}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary-600 dark:text-primary-400 font-semibold">
                Step {step + 1} of {steps.length}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{steps[step].title}</h1>
              {steps[step].subtitle && <p className="text-sm text-gray-600 dark:text-gray-300">{steps[step].subtitle}</p>}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(steps.length)].map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    idx <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {renderStep()}

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
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Verification Email Sent!</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      We&apos;ve sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      After verification, you&apos;ll be able to log in and access all features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {showBack ? (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              {showNext ? (
                <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                  Create Account
            </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 dark:text-primary-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}


