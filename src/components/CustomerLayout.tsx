'use client'

import { useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartSidebar from '@/components/CartSidebar'
import useAuthStore from '@/store/authStore'
import useProductStore from '@/store/productStore'

interface CustomerLayoutProps {
  children: React.ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const { checkAuth } = useAuthStore()
  const { fetchCategories, fetchFeaturedProducts } = useProductStore()

  useEffect(() => {
    // Check authentication status on app load
    checkAuth()
    
    // Fetch initial data
    fetchCategories()
    fetchFeaturedProducts()
  }, [checkAuth, fetchCategories, fetchFeaturedProducts])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
      <CartSidebar />
    </div>
  )
}