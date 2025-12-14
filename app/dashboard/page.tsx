'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { useDownloadStore } from '@/store/download-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Mail, User, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { getUserDownloads } = useDownloadStore()
  const [downloads, setDownloads] = React.useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (user) {
      const userDownloads = getUserDownloads(user.id)
      setDownloads(userDownloads)
    }
  }, [isAuthenticated, router, user, getUserDownloads])

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
    </div>
  )
}

