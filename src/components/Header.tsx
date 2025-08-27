'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Heart, 
  Bell,
  LogOut,
  Settings,
  Package,
  ChevronDown
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import useProductStore from '@/store/productStore'
import AdvancedSearch from '@/components/AdvancedSearch'
import NotificationPanel from '@/components/NotificationPanel'
import { toast } from 'react-hot-toast'

export default function Header() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { items, getItemCount, toggleCart } = useCartStore()
  const { categories, fetchCategories, setSearchQuery } = useProductStore()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAdvancedSearchToggle = () => {
    setShowAdvancedSearch(!showAdvancedSearch)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    setIsUserMenuOpen(false)
    router.push('/')
  }

  const cartItemCount = getItemCount()

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary-500 text-white py-2">
        <div className="container-width section-padding">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span>📞 Customer Service: +1 (555) 123-4567</span>
              <span>🚚 Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="hover:underline">Help</Link>
              <Link href="/track-order" className="hover:underline">Track Order</Link>
              {!isAuthenticated && (
                <>
                  <Link href="/auth/login" className="hover:underline">Sign In</Link>
                  <Link href="/auth/register" className="hover:underline">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-width section-padding py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-2xl font-bold text-gradient">Kopiso</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8 relative">
            <div className="relative">
              <button
                onClick={handleAdvancedSearchToggle}
                className="w-full pl-4 pr-12 py-3 border-2 border-neutral-300 rounded-lg hover:border-primary-500 focus:outline-none transition-colors text-left text-gray-500 bg-white"
              >
                Search for products...
              </button>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-6">
            {/* Notifications - only for authenticated users */}
            {isAuthenticated && (
              <NotificationPanel />
            )}

            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <Heart className="h-6 w-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block text-gray-700">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* User dropdown menu */}
              {isAuthenticated && isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10">
                  <div className="p-3 border-b border-neutral-200">
                    <div className="font-medium text-gray-900">{user?.name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4 text-gray-500" />
                      <span>Wishlist</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-neutral-100 transition-colors w-full text-left text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-neutral-50 border-t border-neutral-200">
        <div className="container-width section-padding">
          <div className="flex items-center space-x-6 py-3 overflow-x-auto">
            <Link href="/products" className="whitespace-nowrap text-gray-700 hover:text-primary-500 transition-colors font-medium">
              All Products
            </Link>
            
            {/* Priority Categories - Show key categories first */}
            <Link
              href="/products?category=cat-food-beverages"
              className="whitespace-nowrap text-gray-700 hover:text-primary-500 transition-colors"
            >
              Food & Beverages
            </Link>
            <Link
              href="/products?category=cat-souvenirs-gifts"
              className="whitespace-nowrap text-gray-700 hover:text-primary-500 transition-colors"
            >
              Souvenirs & Gifts
            </Link>
            
            {/* Other Categories */}
            {categories.filter(cat => 
              cat.id !== 'cat-food-beverages' && 
              cat.id !== 'cat-souvenirs-gifts'
            ).slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="whitespace-nowrap text-gray-700 hover:text-primary-500 transition-colors"
              >
                {category.name}
              </Link>
            ))}
            
            <Link href="/deals" className="whitespace-nowrap text-red-600 hover:text-red-700 transition-colors font-medium">
              🔥 Hot Deals
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="container-width section-padding py-4">
            <div className="space-y-4">
              {/* Search for mobile */}
              <button
                onClick={() => {
                  setShowAdvancedSearch(true)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full pl-4 pr-12 py-3 border border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none text-left text-gray-500 bg-white"
              >
                Search products...
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </button>

              {/* Navigation links */}
              <div className="space-y-2">
                <Link
                  href="/products"
                  className="block py-2 text-gray-700 hover:text-primary-500 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  All Products
                </Link>
                
                {/* Priority Categories */}
                <Link
                  href="/products?category=cat-food-beverages"
                  className="block py-2 text-gray-700 hover:text-primary-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Food & Beverages
                </Link>
                <Link
                  href="/products?category=cat-souvenirs-gifts"
                  className="block py-2 text-gray-700 hover:text-primary-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Souvenirs & Gifts
                </Link>
                
                {/* Other Categories */}
                {categories.filter(cat => 
                  cat.id !== 'cat-food-beverages' && 
                  cat.id !== 'cat-souvenirs-gifts'
                ).slice(0, 4).map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="block py-2 text-gray-700 hover:text-primary-500 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              {/* Mobile user actions */}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-neutral-200 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block w-full text-center bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block w-full text-center border border-primary-500 text-primary-500 py-3 rounded-lg hover:bg-primary-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch
          isModal={true}
          onClose={() => setShowAdvancedSearch(false)}
          showFilters={true}
          placeholder="Search for products, brands, categories..."
        />
      )}
    </header>
  )
}