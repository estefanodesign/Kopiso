'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CustomerLayout from '@/components/CustomerLayout'
import { useCartStore } from '@/store/cartStore'
import { Heart, ShoppingCart, Star, Trash2 } from 'lucide-react'
import { notifications } from '@/utils/notifications'

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { addItem } = useCartStore()

  React.useEffect(() => {
    const loadWishlist = () => {
      try {
        const savedWishlist = localStorage.getItem('kopiso_wishlist')
        if (savedWishlist) {
          setWishlistItems(JSON.parse(savedWishlist))
        }
      } catch (error) {
        console.error('Error loading wishlist:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWishlist()
  }, [])

  const removeFromWishlist = (productId: string) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== productId)
    setWishlistItems(updatedWishlist)
    localStorage.setItem('kopiso_wishlist', JSON.stringify(updatedWishlist))
    notifications.success('Removed from wishlist')
  }

  const addToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1
    })
    notifications.success('Added to cart')
  }

  const moveToCart = (product: any) => {
    addToCart(product)
    removeFromWishlist(product.id)
    notifications.success('Moved to cart')
  }

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-neutral-50">
        <div className="container-width section-padding py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600">
                {wishlistItems.length === 0 
                  ? 'Your wishlist is empty' 
                  : `${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved for later`
                }
              </p>
            </div>
            
            {wishlistItems.length > 0 && (
              <Link
                href="/products"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Continue Shopping
              </Link>
            )}
          </div>

          {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Save products you love by clicking the heart icon. We will keep them here for you!
              </p>
              <Link
                href="/products"
                className="inline-flex items-center space-x-2 bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Start Shopping</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="relative">
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={product.images?.[0] || '/api/placeholder/300/300'}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <Link href={`/products/${product.id}`} className="block">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        ({product.reviews || 0})
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          ${product.price?.toFixed(2)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {product.stock > 0 ? (
                        <span className="text-sm text-green-600 font-medium">In Stock</span>
                      ) : (
                        <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => moveToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{product.stock > 0 ? 'Move to Cart' : 'Out of Stock'}</span>
                      </button>
                      
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}