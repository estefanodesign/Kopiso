import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/ErrorBoundary'
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kopiso - Your Online Shopping Destination',
  description: 'Discover amazing products at unbeatable prices. Shop electronics, fashion, home goods and more with fast shipping and excellent customer service.',
  keywords: 'ecommerce, online shopping, electronics, fashion, home goods, deals',
  authors: [{ name: 'Kopiso Team' }],
  creator: 'Kopiso',
  publisher: 'Kopiso',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Kopiso - Your Online Shopping Destination',
    description: 'Discover amazing products at unbeatable prices.',
    url: 'http://localhost:3000',
    siteName: 'Kopiso',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kopiso - Online Shopping',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kopiso - Your Online Shopping Destination',
    description: 'Discover amazing products at unbeatable prices.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <GlobalErrorHandler />
          <div id="root" className="min-h-screen">
            {children}
          </div>
        </ErrorBoundary>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              fontSize: '14px',
              fontWeight: '500',
              maxWidth: '400px',
              padding: '12px 16px',
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
              },
              iconTheme: {
                primary: '#16a34a',
                secondary: '#ffffff',
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
            loading: {
              style: {
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
              },
            },
          }}
        />
      </body>
    </html>
  )
}