'use client'

import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import type { Template, TemplateField } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TemplateCanvasProps {
  template: Template
  formData: Record<string, any>
  isPreview?: boolean
  className?: string
}

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({
  template,
  formData,
  isPreview = true,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: template.canvasConfig.width,
      height: template.canvasConfig.height,
      backgroundColor: template.canvasConfig.backgroundColor,
    })

    fabricCanvasRef.current = canvas

    // Add watermark for preview
    if (isPreview) {
      const watermark = new fabric.Text('PREVIEW ONLY', {
        left: template.canvasConfig.width / 2,
        top: template.canvasConfig.height / 2,
        originX: 'center',
        originY: 'center',
        fontSize: 60,
        fontFamily: 'Arial',
        fill: 'rgba(255, 0, 0, 0.2)',
        angle: -45,
        selectable: false,
        evented: false,
      })
      canvas.add(watermark)
      canvas.sendToBack(watermark)

      // Add username watermark
      if (formData.username) {
        const userWatermark = new fabric.Text(`User: ${formData.username}`, {
          left: 20,
          top: template.canvasConfig.height - 30,
          fontSize: 14,
          fontFamily: 'Arial',
          fill: 'rgba(0, 0, 0, 0.3)',
          selectable: false,
          evented: false,
        })
        canvas.add(userWatermark)
      }

      // Add email watermark
      if (formData.email) {
        const emailWatermark = new fabric.Text(`Email: ${formData.email}`, {
          left: 20,
          top: template.canvasConfig.height - 50,
          fontSize: 14,
          fontFamily: 'Arial',
          fill: 'rgba(0, 0, 0, 0.3)',
          selectable: false,
          evented: false,
        })
        canvas.add(emailWatermark)
      }
    }

    // Render template fields
    template.fields.forEach((field: TemplateField) => {
      const value = formData[field.name]
      if (!value && field.required) return

      if (field.type === 'image') {
        if (value && typeof value === 'string') {
          fabric.Image.fromURL(value, (img) => {
            img.set({
              left: field.position.x - 75,
              top: field.position.y - 75,
              originX: 'center',
              originY: 'center',
              scaleX: 150 / (img.width || 150),
              scaleY: 150 / (img.height || 150),
              selectable: false,
              evented: false,
            })
            canvas.add(img)
            canvas.renderAll()
          })
        }
      } else if (field.type === 'text' || field.type === 'date' || field.type === 'number') {
        const text = new fabric.Text(value?.toString() || field.placeholder, {
          left: field.position.x,
          top: field.position.y,
          originX: 'center',
          originY: 'center',
          fontSize: field.style.fontSize || 24,
          fontFamily: field.style.fontFamily || 'Arial',
          fill: field.style.color || '#000000',
          fontWeight: field.style.fontWeight || 'normal',
          textAlign: field.style.textAlign || 'center',
          selectable: false,
          evented: false,
        })
        canvas.add(text)
      }
    })

    canvas.renderAll()
    setIsLoading(false)

    return () => {
      canvas.dispose()
    }
  }, [template, formData, isPreview])

  // Disable right-click and text selection for preview
  useEffect(() => {
    if (isPreview && canvasRef.current) {
      const canvas = canvasRef.current
      const preventContext = (e: MouseEvent) => e.preventDefault()
      const preventSelect = (e: Event) => e.preventDefault()

      canvas.addEventListener('contextmenu', preventContext)
      canvas.addEventListener('selectstart', preventSelect)

      return () => {
        canvas.removeEventListener('contextmenu', preventContext)
        canvas.removeEventListener('selectstart', preventSelect)
      }
    }
  }, [isPreview])

  const exportToImage = (quality: number = 1): Promise<string> => {
    return new Promise((resolve) => {
      if (!fabricCanvasRef.current) {
        resolve('')
        return
      }

      // Remove watermarks for export
      const objects = fabricCanvasRef.current.getObjects()
      const watermarks = objects.filter(
        (obj: any) =>
          obj.text === 'PREVIEW ONLY' ||
          (obj.text && obj.text.startsWith('User:')) ||
          (obj.text && obj.text.startsWith('Email:'))
      )
      watermarks.forEach((wm) => fabricCanvasRef.current?.remove(wm))

      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality,
        multiplier: quality,
      })

      // Restore watermarks
      watermarks.forEach((wm) => fabricCanvasRef.current?.add(wm))

      resolve(dataURL)
    })
  }


  return (
    <div className={cn('relative', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={cn(
          'border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg',
          isPreview && 'no-select disable-context-menu'
        )}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      {isPreview && (
        <div className="absolute top-2 right-2">
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            PREVIEW
          </div>
        </div>
      )}
    </div>
  )
}

