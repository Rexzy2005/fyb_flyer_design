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
import { Lock, Download, Mail, CheckCircle, Loader2, ChevronRight, ChevronLeft, Zap } from 'lucide-react'

const DOWNLOAD_PRICE = 500 // NGN

export default function EditorPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const { templates, selectTemplate, incrementUsage, unlockTemplate } = useTemplateStore()
  const { user, isAuthenticated } = useAuthStore()
  const { getDownloadCount, canEditForFree, addDownload } = useDownloadStore()

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

    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      department: user?.department || '',
    })
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

  const handlePaymentSuccess = async (reference: string) => {
    if (!template || !user) return

    try {
      console.log('Payment successful from Paystack, proceeding to download')
      
      setShowPaymentModal(false)
      
      fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      }).catch(error => {
        console.error('Failed to mark payment as completed:', error)
      })
      
      await startGenerate()
    } catch (error: any) {
      console.error('Error in payment success handler:', error)
      setShowPaymentModal(false)
    }
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

    const link = document.createElement('a')
    link.download = `${template.name}-${Date.now()}.png`
    link.href = generatedImage
    link.click()

    addDownload({
      userId: user.id,
      templateId: template.id,
      templateName: template.name,
      downloadUrl: generatedImage,
      paid: true,
      emailSent: false,
    })

    incrementUsage(templateId)
    setShowReadyModal(false)

    fetch('/api/downloads/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: template.id,
        imageData: generatedImage,
      }),
    })
      .then(async (res) => {
        const result = await res.json()
        if (res.ok && result.success) {
          console.log('Download completed in background')
          setEmailSent(true)
          setTimeout(() => setEmailSent(false), 5000)
        } else {
          console.error('Background download completion failed:', result.error)
        }
      })
      .catch((err) => {
        console.error('Background download completion request failed:', err)
      })
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    )
  }

  if (template.status === 'locked') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl shadow-xl">
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Template Locked</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This template requires a department access code to unlock.
            </p>
            <Button 
              onClick={() => setShowUnlockModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Enter Access Code
            </Button>
          </div>
        </Card>

        {showUnlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="max-w-md w-full rounded-2xl shadow-2xl">
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Unlock Template</h3>
                <Input
                  label="Access Code"
                  type="text"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  placeholder="Enter code"
                />
                {unlockError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{unlockError}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUnlockModal(false)} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUnlock} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Unlock
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  const downloadCount = user ? getDownloadCount(user.id, templateId) : 0
  const canDownloadFree = user && canEditForFree(user.id, templateId)
  const isLastSection = currentSectionIndex === sectionGroups.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/templates')}
            className="group hover:text-purple-600 dark:hover:text-purple-400"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="flex-1 text-center mx-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {template.name}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Step {currentSectionIndex + 1} of {sectionGroups.length + 1}
            </p>
          </div>

          {canDownloadFree && (
            <Badge className="hidden sm:flex bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0">
              <Zap className="w-3 h-3 mr-1" />
              Free Edit
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${((currentSectionIndex + 1) / (sectionGroups.length + 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          {/* Preview */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center">
                <div className="w-2 h-2 rounded-full bg-white mr-3"></div>
                Live Preview
              </h2>
            </div>
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800/50">
              <TemplateCanvas
                ref={templateCanvasRef}
                template={template}
                formData={formData}
                isPreview
                className="w-full max-w-[300px]"
              />
            </div>
          </div>

          {/* Form */}
          <FormCard
            currentSectionIndex={currentSectionIndex}
            sectionGroups={sectionGroups}
            formData={formData}
            setFormData={setFormData}
            handleImageUpload={handleImageUpload}
            canDownloadFree={canDownloadFree || false}
            emailSent={emailSent}
            isGenerating={isGenerating}
            template={template}
            handleDownload={handleDownload}
            onNext={() => setCurrentSectionIndex((prev) => Math.min(prev + 1, sectionGroups.length))}
            onBack={() => setCurrentSectionIndex((prev) => Math.max(prev - 1, 0))}
            isLastSection={isLastSection}
          />
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-8">
          {/* Left: Preview */}
          <div className="lg:col-span-5 sticky top-24 h-fit">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg flex items-center">
                  <div className="w-2 h-2 rounded-full bg-white mr-3"></div>
                  Live Preview
                </h2>
              </div>

              <div className="p-8 flex justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[500px]">
                <TemplateCanvas
                  ref={templateCanvasRef}
                  template={template}
                  formData={formData}
                  isPreview
                  className="w-full max-w-[380px]"
                />
              </div>

              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Real-time preview • Changes appear instantly
                </p>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-7">
            <FormCard
              currentSectionIndex={currentSectionIndex}
              sectionGroups={sectionGroups}
              formData={formData}
              setFormData={setFormData}
              handleImageUpload={handleImageUpload}
              canDownloadFree={canDownloadFree || false}
              emailSent={emailSent}
              isGenerating={isGenerating}
              template={template}
              handleDownload={handleDownload}
              onNext={() => setCurrentSectionIndex((prev) => Math.min(prev + 1, sectionGroups.length))}
              onBack={() => setCurrentSectionIndex((prev) => Math.max(prev - 1, 0))}
              isLastSection={isLastSection}
              isDesktop
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={DOWNLOAD_PRICE}
        templateName={template.name}
        templateId={templateId}
        userEmail={user?.email}
        onSuccess={handlePaymentSuccess}
      />

      <Modal
        isOpen={showReadyModal}
        onClose={() => !isGenerating && setShowReadyModal(false)}
        title=""
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Design Ready!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your design is generated. Download it now and we'll send a copy to your email.
            </p>
          </div>

          {generatedImage && (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImage}
                alt="Generated design"
                className="w-full max-h-80 object-contain"
              />
            </div>
          )}

          {downloadError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{downloadError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowReadyModal(false)}
              disabled={isGenerating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReadyDownload} 
              disabled={isGenerating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Form Card Component
interface FormCardProps {
  currentSectionIndex: number
  sectionGroups: any[]
  formData: Record<string, any>
  setFormData: (data: any) => void
  handleImageUpload: (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => void
  canDownloadFree: boolean
  emailSent: boolean
  isGenerating: boolean
  template: any
  handleDownload: () => Promise<void>
  onNext: () => void
  onBack: () => void
  isLastSection: boolean
  isDesktop?: boolean
}

function FormCard({
  currentSectionIndex,
  sectionGroups,
  formData,
  setFormData,
  handleImageUpload,
  canDownloadFree,
  emailSent,
  isGenerating,
  template,
  handleDownload,
  onNext,
  onBack,
  isLastSection,
  isDesktop,
}: FormCardProps) {
  const section = sectionGroups[currentSectionIndex]
  const isFirstSection = currentSectionIndex === 0
  const totalFields = template.fields.length
  const completedFields = Object.values(formData).filter(v => v).length
  const requiredFields = template.fields.filter((f: any) => f.required).length
  const completedRequired = template.fields.filter((f: any) => f.required && formData[f.name]).length

  return (
    <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-xl">
              {isLastSection ? 'Review & Download' : section?.name || 'Customize'}
            </h2>
            <Badge className="bg-white/20 text-white border-0">
              {isLastSection ? 'Final' : `Step ${currentSectionIndex + 1}`}
            </Badge>
          </div>
          <p className="text-white/90 text-sm">
            {isLastSection 
              ? 'Everything looks good? Download your design!' 
              : section?.fields.length 
                ? `${section.fields.length} field${section.fields.length !== 1 ? 's' : ''}`
                : 'Complete your customization'}
          </p>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-6">
        {/* Progress Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {completedRequired}/{requiredFields} required fields
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${(completedRequired / requiredFields) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Fields */}
        {!isLastSection && section && (
          <div className="space-y-5">
            {section.fields.map((field: any) => (
              <div key={field.id} className="space-y-2">
                {field.type === 'image' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(field.name, e)}
                        className="hidden"
                        id={`file-${field.id}`}
                      />
                      <label 
                        htmlFor={`file-${field.id}`}
                        className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">📷</div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Click to upload or drag & drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                    </div>
                    {formData[field.name] && (
                      <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData[field.name]}
                          alt="Uploaded"
                          className="w-full max-h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          ✓ Uploaded
                        </div>
                      </div>
                    )}
                  </div>
                ) : field.type === 'date' ? (
                  <Input
                    label={field.label}
                    type="date"
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    required={field.required}
                  />
                ) : (
                  <Input
                    label={field.label}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Final Review Section */}
        {isLastSection && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✓ All fields completed! Ready to download your design.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Download Price</span>
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">₦{DOWNLOAD_PRICE}</span>
              </div>
              
              {canDownloadFree && (
                <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0 w-full justify-center py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Free Edit Available
                  </Badge>
                </div>
              )}
            </div>

            {emailSent && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Design sent to your email! Check your inbox.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isFirstSection}
              className="flex-1 group"
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            {isLastSection ? (
              <Button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Generating</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    <span className="hidden sm:inline">
                      {canDownloadFree ? 'Generate (Free)' : `Generate (₦${DOWNLOAD_PRICE})`}
                    </span>
                    <span className="sm:hidden">Download</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onNext}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold group"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform sm:ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
