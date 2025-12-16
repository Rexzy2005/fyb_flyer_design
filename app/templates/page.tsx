'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTemplateStore } from '@/store/template-store'
import { useAuthStore } from '@/store/auth-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Lock, TrendingUp, Image as ImageIcon, ArrowRight } from 'lucide-react'
import type { TemplateCategory } from '@/lib/types'

export default function TemplatesPage() {
  const router = useRouter()
  const { filteredTemplates, filterByCategory, searchTemplates } = useTemplateStore()
  const { isAuthenticated } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')

  useEffect(() => {
    filterByCategory(selectedCategory)
  }, [selectedCategory, filterByCategory])

  useEffect(() => {
    searchTemplates(searchQuery)
  }, [searchQuery, searchTemplates])

  const handleUseTemplate = (e: React.MouseEvent, template: any) => {
    e.stopPropagation() // Prevent card click
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    router.push(`/editor/${template.id}`)
  }

  const popularTemplates = [...filteredTemplates]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 3)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Choose a Template
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Select from our collection of professional flyer templates
          </p>
        </div>
        {isAuthenticated && (
          <div className="flex justify-start sm:justify-end">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto"
              size="sm"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="min-w-[90px]"
          >
            All
          </Button>
          <Button
            variant={selectedCategory === 'fyb' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('fyb')}
            className="min-w-[140px]"
          >
            FYB Face of Day/Week
          </Button>
          <Button
            variant={selectedCategory === 'signout' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('signout')}
            className="min-w-[130px]"
          >
            Sign-out Flyers
          </Button>
        </div>
      </div>

      {/* Popular Templates */}
      {selectedCategory === 'all' && popularTemplates.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Popular Templates
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {popularTemplates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow group flex flex-col"
              >
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  {template.status === 'locked' && (
                    <div className="absolute top-2 right-2 space-y-1 text-right">
                      <Badge variant="warning">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                      {template.lockedDepartment && (
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                          {template.lockedDepartment} Dept
                        </p>
                      )}
                    </div>
                  )}
                  {template.usageCount > 100 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="success">Popular</Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.usageCount} uses
                  </p>
                </div>
                <Button
                  onClick={(e) => handleUseTemplate(e, template)}
                  className="w-full"
                  size="sm"
                >
                  Use Template
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          {selectedCategory === 'all' ? 'All Templates' : selectedCategory === 'fyb' ? 'FYB Templates' : 'Sign-out Templates'}
        </h2>
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No templates found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow group flex flex-col"
              >
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  {template.status === 'locked' && (
                    <div className="absolute top-2 right-2 space-y-1 text-right">
                      <Badge variant="warning">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                      {template.lockedDepartment && (
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                          {template.lockedDepartment} Dept
                        </p>
                      )}
                    </div>
                  )}
                  {template.usageCount > 100 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="success">Popular</Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {template.name}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.usageCount} uses
                    </p>
                    <Badge variant="info">
                      {template.category === 'fyb' ? 'FYB' : 'Sign-out'}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={(e) => handleUseTemplate(e, template)}
                  className="w-full"
                  size="sm"
                >
                  Use Template
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

