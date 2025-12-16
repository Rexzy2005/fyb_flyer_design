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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Welcome back, {user.username}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Downloads</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {downloads.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900">
              <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Sent</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {downloads.filter((d) => d.emailSent).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Type</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {user.role}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Profile Info */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Profile Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Username</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.email}</p>
          </div>
          {user.department && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Department</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {user.department}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Member Since</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* Download History */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Download History
          </h2>
          <Link href="/templates">
            <Button size="sm">Browse Templates</Button>
          </Link>
        </div>

        {downloads.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No downloads yet</p>
            <Link href="/templates">
              <Button>Browse Templates</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {downloads
              .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
              .map((download) => (
                <div
                  key={download.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {download.templateName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(download.downloadedAt)}
                      </div>
                      {download.emailSent && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          Email sent
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {download.paid && (
                      <Badge variant="success">Paid</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = download.downloadUrl
                        link.download = `${download.templateName}-${download.id}.png`
                        link.click()
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Re-download
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Department Head Panel */}
      {user.role === 'DEPARTMENT_ADMIN' && user.department && (
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Department Head Panel
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage locked templates and department access codes for {user.department}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lock template form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Lock a Template for Your Department
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter the template ID you want to lock. A one-time simulated payment will be made,
                then a 6-digit access code will be generated for your department.
              </p>
              <form onSubmit={handleLockTemplate} className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    You can find template IDs in the URL when editing a template (e.g. /editor/ID).
                  </p>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    value={lockTemplateId}
                    onChange={(e) => setLockTemplateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Template ID"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lockUsageLimit}
                      onChange={(e) => setLockUsageLimit(parseInt(e.target.value || '1', 10))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expires At (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={lockExpiresAt}
                      onChange={(e) => setLockExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {lockError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{lockError}</p>
                  </div>
                )}
                {lockSuccess && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400">{lockSuccess}</p>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Lock Template for Department
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Locking a template triggers a simulated payment and generates a unique 6-digit access code for your department.
                </p>
              </form>
            </div>

            {/* Access code list */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Department Access Codes
              </h3>
              {isLoadingAccess ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading access codes...</p>
              ) : departmentAccesses.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No department access codes yet. Lock a template to generate a code you can share with your course mates.
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {departmentAccesses.map((access) => (
                    <div
                      key={access.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {access.templateName || access.templateId}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Code:{' '}
                          <span className="font-mono text-base text-primary-600 dark:text-primary-400">
                            {access.accessCode}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Uses: {access.usedCount}/{access.usageLimit} · Expires:{' '}
                          {formatDate(access.expiresAt)}
                        </p>
                      </div>
                      <Badge variant="warning">Department Locked</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

