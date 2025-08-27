'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

interface AdminGuardProps {
  children: React.ReactNode
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  React.useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      toast.error('Please login to access admin panel')
      router.push('/auth/login')
      return
    }

    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/')
      return
    }
  }, [isAuthenticated, user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminGuard