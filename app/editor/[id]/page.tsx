'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTemplateStore } from '@/store/template-store'
import { useAuthStore } from '@/store/auth-store'
import { useDownloadStore } from '@/store/download-store'
import { TemplateCanvas, TemplateCanvasHandle } from '@/components/canvas/template-canvas'
import { PaymentModal } from '@/components/payment/payment-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Lock, Download, Mail, CheckCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const DOWNLOAD_PRICE = 500 // NGN

export default function EditorPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const { templates, selectTemplate, incrementUsage, unlockTemplate } = useTemplateStore()
  const { user, isAuthenticated } = useAuthStore()
  const {
    hasDownloaded,
    getDownloadCount,
    canEditForFree,
    createPayment,
    completePayment,
    addDownload,
  } = useDownloadStore()

  const [template, setTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockCode, setUnlockCode] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const templateCanvasRef = useRef<TemplateCanvasHandle | null>(null)

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showReadyModal, setShowReadyModal] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const foundTemplate = templates.find((t) => t.id === templateId)
    if (!foundTemplate) {
      router.push('/templates')
      return
    }

    setTemplate(foundTemplate)
    selectTemplate(foundTemplate)

    // Initialize form data with user info
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      department: user?.department || '',
    })

    return () => {
      // no-op cleanup; TemplateCanvas handles its own disposal
    }
  }, [templateId, templates, isAuthenticated, router, selectTemplate, user])

  const sectionGroups = useMemo(() => {
    if (!template) return []
    const groups: { name: string; fields: any[] }[] = []
    const map: Record<string, any[]> = {}
    template.fields.forEach((field: any) => {
      const section = field.section || 'Details'
      if (!map[section]) {
        map[section] = []
        groups.push({ name: section, fields: map[section] })
      }
      map[section].push(field)
    })
    return groups
  }, [template])

  const handleUnlock = async () => {
    if (!unlockCode) {
      setUnlockError('Please enter an access code')
      return
    }

    setUnlockError('')
    const result = await unlockTemplate(templateId, unlockCode)

    if (result.success) {
      setShowUnlockModal(false)
      setUnlockCode('')
      setTemplate({ ...template, status: 'public' })
    } else {
      setUnlockError(result.error || 'Invalid access code')
    }
  }

  const handleDownload = async () => {
    if (!template || !user) return

    const downloadCount = getDownloadCount(user.id, templateId)
    const needsPayment = downloadCount === 0 || (downloadCount > 1 && !canEditForFree(user.id, templateId))

    if (needsPayment) {
      setShowPaymentModal(true)
      return
    }

    await startGenerate()
  }

  const handlePaymentSuccess = async () => {
    if (!template || !user) return

    const payment = createPayment(user.id, templateId, DOWNLOAD_PRICE)
    completePayment(payment.id)
    await startGenerate()
  }

  const startGenerate = async () => {
    if (!templateCanvasRef.current || !template || !user) return
    setIsGenerating(true)
    setShowReadyModal(false)
    setGeneratedImage(null)
    setDownloadError('')

    const dataURL = await templateCanvasRef.current.exportToImage(2)
    setIsGenerating(false)

    if (!dataURL) {
      setDownloadError('We could not generate your design. Please try again.')
      return
    }

    setGeneratedImage(dataURL)
    setShowReadyModal(true)
  }

  const handleReadyDownload = async () => {
    if (!generatedImage || !template || !user) return
    setDownloadError('')

    let finalUrl = generatedImage

    try {
      // Call backend to store download, upload to Cloudinary and send email
      const res = await fetch('/api/downloads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          imageData: generatedImage,
        }),
      })
      const result = await res.json()

      if (res.ok && result.success && result.download?.downloadUrl) {
        finalUrl = result.download.downloadUrl
        setEmailSent(true)
        setTimeout(() => setEmailSent(false), 5000)
      } else {
        setDownloadError(
          result.error ||
            'We could not finish your download. Please try again in a moment.'
        )
      }
    } catch (err: any) {
      console.error('Download completion request failed:', err)
      setDownloadError('Network error while finishing your download. Please try again.')
    }

    // Also keep local history for dashboard widgets
    addDownload({
      userId: user.id,
      templateId: template.id,
      templateName: template.name,
      downloadUrl: finalUrl,
      paid: true,
      emailSent: true,
    })

    // Increment template usage locally
    incrementUsage(templateId)

    // Trigger browser download from final URL
    const link = document.createElement('a')
    link.download = `${template.name}-${Date.now()}.png`
    link.href = finalUrl
    link.click()

    setShowReadyModal(false)
  }

  const handleImageUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setFormData((prev) => ({ ...prev, [fieldName]: result }))
    }
    reader.readAsDataURL(file)
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    )
  }

  if (template.status === 'locked') {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto text-center">
          <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Template Locked
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This template requires a department access code to unlock.
          </p>
          <Button onClick={() => setShowUnlockModal(true)}>Enter Access Code</Button>
        </Card>

        {showUnlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Unlock Template</h3>
              <Input
                label="Access Code"
                type="text"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                placeholder="Enter department access code"
              />
              {unlockError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{unlockError}</p>
              )}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowUnlockModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUnlock} className="flex-1">
                  Unlock
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  const downloadCount = user ? getDownloadCount(user.id, templateId) : 0
  const canDownloadFree = user && canEditForFree(user.id, templateId)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/templates')}>
          ← Back to Templates
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Canvas Preview (left on desktop) */}
        <div className="sticky top-24 h-fit order-1 lg:col-span-5">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Preview</h2>
              <Badge variant="warning">Preview Only</Badge>
            </div>
            <div className="flex justify-center pb-4">
              <TemplateCanvas
                ref={templateCanvasRef}
                template={template}
                formData={formData}
                isPreview
                className="w-full max-w-[480px] md:max-w-[520px]"
              />
            </div>
          </Card>
        </div>

        {/* Form (right on desktop) */}
        <div className="order-2 lg:col-span-7">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Customize Template
            </h2>

            <div className="space-y-8">
              {sectionGroups.length > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Step {currentSectionIndex + 1} of {sectionGroups.length}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {sectionGroups[currentSectionIndex].name}
                  </p>
                </div>
              )}

              {sectionGroups.length > 0 &&
                sectionGroups[currentSectionIndex].fields.map((field: any) => (
                  <div key={field.id}>
                  {field.type === 'image' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(field.name, e)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      {formData[field.name] && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData[field.name]}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  ) : field.type === 'date' ? (
                    <Input
                      label={field.label}
                      type="date"
                      value={formData[field.name] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      label={field.label}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                    </div>
                  ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Download Price</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ₦{DOWNLOAD_PRICE}
                    </p>
                  </div>
                  {canDownloadFree && (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Free Edit Available
                    </Badge>
                  )}
                </div>

                {emailSent && (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Design sent to your email!
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={currentSectionIndex === 0}
                    onClick={() => setCurrentSectionIndex((prev) => Math.max(prev - 1, 0))}
                  >
                    Back
                  </Button>
                  {currentSectionIndex < sectionGroups.length - 1 ? (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() =>
                        setCurrentSectionIndex((prev) =>
                          Math.min(prev + 1, Math.max(sectionGroups.length - 1, 0))
                        )
                      }
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDownload}
                      className="flex-1"
                      size="lg"
                      disabled={
                        isGenerating ||
                        !template.fields.every((f: any) => !f.required || formData[f.name])
                      }
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          {canDownloadFree
                            ? 'Generate Design (Free)'
                            : `Generate Design (₦${DOWNLOAD_PRICE})`}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={DOWNLOAD_PRICE}
        templateName={template.name}
        onSuccess={handlePaymentSuccess}
      />

      <Modal
        isOpen={showReadyModal}
        onClose={() => !isGenerating && setShowReadyModal(false)}
        title="Your design is ready"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We’ve finished generating your design. Click the button below to download it and we’ll
            also send a copy to your email.
          </p>
          {generatedImage && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-72 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImage}
                alt="Generated design preview"
                className="max-h-72 w-auto object-contain"
              />
            </div>
          )}

          {downloadError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{downloadError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowReadyModal(false)}
              disabled={isGenerating}
            >
              Close
            </Button>
            <Button onClick={handleReadyDownload} disabled={isGenerating}>
              <Download className="w-4 h-4 mr-2" />
              Download design
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

