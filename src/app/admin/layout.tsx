'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import AdminGuard from '@/components/admin/AdminGuard'
import NotificationPanel from '@/components/NotificationPanel'
import { 
  Store, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Search, 
  LogOut,
  User
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Store,
      current: pathname === '/admin'
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: Package,
      current: pathname.startsWith('/admin/products')
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      current: pathname.startsWith('/admin/orders')
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'Accounting',
      href: '/admin/accounting',
      icon: DollarSign,
      current: pathname.startsWith('/admin/accounting')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: pathname.startsWith('/admin/analytics')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname.startsWith('/admin/settings')
    }
  ]

  if (!user) {
    return null
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
          </div>
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">Kopiso</span>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex flex-col h-full">
            <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.name} className="mb-1">
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group w-full ${
                        item.current
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={`h-5 w-5 transition-colors flex-shrink-0 ${
                        item.current ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                    
                    {/* Accounting sub-navigation */}
                    {item.name === 'Accounting' && item.current && (
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                        <Link
                          href="/admin/accounting"
                          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname === '/admin/accounting'
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          Transactions
                        </Link>
                        <Link
                          href="/admin/accounting/reports"
                          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname === '/admin/accounting/reports'
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          Reports
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3 mb-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Administrator
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                <span className="group-hover:text-red-600 transition-colors">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top navigation */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <Menu className="h-6 w-6" />
                </button>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Search..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationPanel />

                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  View Store
                </Link>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}

export default AdminLayout