'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from './footer'

export const ConditionalFooter: React.FC = () => {
  const pathname = usePathname()

  // Pages that should not have footer
  const noFooterPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/verify-otp',
    '/dashboard',
    '/admin',
  ]

  // Check if current path starts with any of the no-footer paths
  const shouldHideFooter = noFooterPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/editor/')

  if (shouldHideFooter) {
    return null
  }

  return <Footer />
}

