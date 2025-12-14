import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, Image as ImageIcon, Download, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Design Your Perfect
            <span className="text-primary-600 dark:text-primary-400"> Flyer</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Create stunning FYB Face of the Day and Sign-out flyers with our professional templates.
            Customize, preview, and download in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/templates">
              <Button size="lg" className="w-full sm:w-auto">
                Browse Templates
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
          Why Choose FYB University?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Professional Templates
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from a wide selection of professionally designed templates
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                <ImageIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" aria-label="Live Preview Icon" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Live Preview
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See your design come to life in real-time as you customize
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                <Download className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                High Quality Export
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Download your designs in high resolution for printing
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your designs are safely stored and delivered via email
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <Card className="bg-primary-600 dark:bg-primary-700 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Flyer?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of students creating professional designs
          </p>
          <Link href="/templates">
            <Button size="lg" variant="secondary">
              Start Designing Now
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  )
}

