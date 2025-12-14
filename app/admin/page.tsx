'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useTemplateStore } from '@/store/template-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { TrendingUp, Lock, Unlock, Plus, Edit, BarChart3 } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { templates } = useTemplateStore()
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router, user])

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0)
  const lockedTemplates = templates.filter((t) => t.status === 'locked').length
  const popularTemplates = [...templates].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Manage templates and view analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Templates</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {templates.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900">
              <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Usage</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalUsage}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Locked Templates</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {lockedTemplates}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Lock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Public Templates</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {templates.length - lockedTemplates}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Unlock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Popular Templates */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Popular Templates
          </h2>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </div>

        <div className="space-y-4">
          {popularTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {template.name}
                  </h3>
                  <Badge variant={template.status === 'locked' ? 'warning' : 'success'}>
                    {template.status === 'locked' ? (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3 mr-1" />
                        Public
                      </>
                    )}
                  </Badge>
                  <Badge variant="info">
                    {template.category === 'fyb' ? 'FYB' : 'Sign-out'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.usageCount} uses
                  {template.department && ` • ${template.department}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* All Templates */}
      <Card>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          All Templates
        </h2>
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {template.name}
                  </h3>
                  <Badge variant={template.status === 'locked' ? 'warning' : 'success'}>
                    {template.status}
                  </Badge>
                  <Badge variant="info">{template.category}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.usageCount} uses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Template"
        size="lg"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Template creation interface would go here. This is a simulated admin panel.
        </p>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}

