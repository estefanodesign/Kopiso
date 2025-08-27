'use client'

import { Suspense } from 'react'
import SearchResultsPage from '@/components/SearchResultsPage'
import CustomerLayout from '@/components/CustomerLayout'

function ProductsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <SearchResultsPage />
    </Suspense>
  )
}

export default function Page() {
  return (
    <CustomerLayout>
      <ProductsPageWrapper />
    </CustomerLayout>
  )
}
