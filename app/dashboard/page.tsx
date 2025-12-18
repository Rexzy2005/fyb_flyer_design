'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { useDownloadStore } from '@/store/download-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Mail, User, Calendar, Lock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { getUserDownloads } = useDownloadStore()
  const [downloads, setDownloads] = React.useState<any[]>([])
  const [departmentAccesses, setDepartmentAccesses] = React.useState<any[]>([])
  const [isLoadingAccess, setIsLoadingAccess] = React.useState(false)
  const [lockTemplateId, setLockTemplateId] = React.useState('')
  const [lockUsageLimit, setLockUsageLimit] = React.useState(100)
  const [lockExpiresAt, setLockExpiresAt] = React.useState('')
  const [lockError, setLockError] = React.useState('')
  const [lockSuccess, setLockSuccess] = React.useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Check if email is verified
    if (user && !user.emailVerified) {
      router.push(`/auth/verify-otp?email=${encodeURIComponent(user.email)}`)
      return
    }

    if (user) {
      const userDownloads = getUserDownloads(user.id)
      setDownloads(userDownloads)
    }
  }, [isAuthenticated, router, user, getUserDownloads])

  useEffect(() => {
    const fetchDepartmentAccess = async () => {
      const role = user?.role
      const isDeptAdmin = role === 'DEPARTMENT_ADMIN' || role === 'department_admin'
      if (!user || !isDeptAdmin || !user.department) return
      setIsLoadingAccess(true)
      setLockError('')
      try {
        const res = await fetch('/api/department-head/access')
        const data = await res.json()
        if (data.success) {
          setDepartmentAccesses(data.accesses)
        } else {
          setLockError(data.error || 'Failed to load department access codes')
        }
      } catch (err: any) {
        setLockError('Failed to load department access codes')
      } finally {
        setIsLoadingAccess(false)
      }
    }

    fetchDepartmentAccess()
  }, [user])

  const handleLockTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lockTemplateId) {
      setLockError('Please enter a template ID to lock')
      return
    }
    setLockError('')
    setLockSuccess('')
    try {
      const res = await fetch('/api/department-head/lock-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: lockTemplateId,
          usageLimit: lockUsageLimit,
          expiresAt: lockExpiresAt || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setLockError(data.error || 'Failed to lock template')
        return
      }
      setLockSuccess(`Template locked. Access code: ${data.access.accessCode}`)
      setDepartmentAccesses((prev) => [data.access, ...prev])
      setLockTemplateId('')
      setLockUsageLimit(100)
      setLockExpiresAt('')
    } catch (err: any) {
      setLockError('Failed to lock template')
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Welcome back, <span className="font-semibold">{user.username}</span>!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Total Downloads</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words">
                  {downloads.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-primary-100 dark:bg-primary-900 flex-shrink-0">
                <Download className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Email Sent</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words">
                  {downloads.filter((d) => d.emailSent).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Account Type</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize truncate">
                  {user.role}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Info */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Username</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{user.username}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Email</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{user.email}</p>
            </div>
            {user.department && (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Department</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.department}
                </p>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Member Since</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Download History */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Download History
            </h2>
            <Link href="/templates" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto">Browse Templates</Button>
            </Link>
          </div>

          {downloads.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Download className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">No downloads yet</p>
              <Link href="/templates" className="inline-block w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Browse Templates</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {downloads
                .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
                .map((download) => (
                  <div
                    key={download.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-2 truncate">
                        {download.templateName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(download.downloadedAt)}</span>
                        </div>
                        {download.emailSent && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span>Email sent</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
                      {download.paid && (
                        <Badge variant="success" className="text-xs">Paid</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs sm:text-sm whitespace-nowrap"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = download.downloadUrl
                          link.download = `${download.templateName}-${download.id}.png`
                          link.click()
                        }}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Re-download</span>
                        <span className="sm:hidden">Re-dl</span>
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Department Head Panel */}
        {user.role === 'DEPARTMENT_ADMIN' && user.department && (
          <Card className="mt-6 sm:mt-8 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Department Head Panel</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Manage locked templates and department access codes for <span className="font-medium">{user.department}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Lock template form */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  Lock a Template for Your Department
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Enter the template ID you want to lock. A one-time simulated payment will be made,
                  then a 6-digit access code will be generated for your department.
                </p>
                <form onSubmit={handleLockTemplate} className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                      You can find template IDs in the URL when editing a template (e.g. /editor/ID).
                    </p>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                      Template ID
                    </label>
                    <input
                      type="text"
                      value={lockTemplateId}
                      onChange={(e) => setLockTemplateId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Template ID"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                        Usage Limit
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={lockUsageLimit}
                        onChange={(e) => setLockUsageLimit(parseInt(e.target.value || '1', 10))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                        Expires At (optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={lockExpiresAt}
                        onChange={(e) => setLockExpiresAt(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {lockError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 break-words">{lockError}</p>
                    </div>
                  )}
                  {lockSuccess && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 break-words">{lockSuccess}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full text-sm font-semibold">
                    Lock Template for Department
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Locking a template triggers a simulated payment and generates a unique 6-digit access code for your department.
                  </p>
                </form>
              </div>

              {/* Access code list */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  Department Access Codes
                </h3>
                {isLoadingAccess ? (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Loading access codes...</p>
                ) : departmentAccesses.length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    No department access codes yet. Lock a template to generate a code you can share with your course mates.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {departmentAccesses.map((access) => (
                      <div
                        key={access.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {access.templateName || access.templateId}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Code:{' '}
                            <span className="font-mono text-sm sm:text-base text-primary-600 dark:text-primary-400 break-all">
                              {access.accessCode}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Uses: <span className="font-semibold">{access.usedCount}/{access.usageLimit}</span> · Expires:{' '}
                            <span className="font-semibold">{formatDate(access.expiresAt)}</span>
                          </p>
                        </div>
                        <Badge variant="warning" className="text-xs whitespace-nowrap flex-shrink-0">Department Locked</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

