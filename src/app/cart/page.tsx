'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Plus, Minus, Trash2, Heart, ArrowRight, ShoppingBag, Truck } from 'lucide-react'
import CustomerLayout from '@/components/CustomerLayout'
import useCartStore from '@/store/cartStore'
import useProductStore from '@/store/productStore'
import { Product } from '@/types'
import { toast } from 'react-hot-toast'

function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getCartSubtotal,
    getCartTotal,
    getItemCount
  } = useCartStore()

  const { products, fetchProducts } = useProductStore()
  const [cartProducts, setCartProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)

  useEffect(() => {
    if (items.length > 0) {
      fetchCartProducts()
    }
  }, [items])

  const fetchCartProducts = async () => {
    setIsLoading(true)
    try {
      // Fetch products if not already loaded
      if (products.length === 0) {
        await fetchProducts()
      }

      // Get unique product IDs from cart
      const productIds = [...new Set(items.map(item => item.productId))]
      
      // Find products for cart items
      const cartProductsData = productIds.map(id => 
        products.find(p => p.id === id)
      ).filter(Boolean) as Product[]
      
      setCartProducts(cartProductsData)
    } catch (error) {
      console.error('Failed to fetch cart products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId)
      return
    }
    
    updateQuantity(productId, newQuantity)
    toast.success('Quantity updated')
  }

  const handleRemoveItem = (productId: string) => {
    removeItem(productId)
    toast.success('Item removed from cart')
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
      toast.success('Cart cleared')
    }
  }

  const handleApplyCoupon = () => {
    // Mock coupon validation
    const validCoupons = ['SAVE10', 'WELCOME20', 'SUMMER15']
    
    if (validCoupons.includes(couponCode.toUpperCase())) {
      setAppliedCoupon(couponCode.toUpperCase())
      toast.success(`Coupon ${couponCode.toUpperCase()} applied!`)
      setCouponCode('')
    } else {
      toast.error('Invalid coupon code')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    toast.success('Coupon removed')
  }

  const subtotal = getCartSubtotal(cartProducts)
  const shipping = subtotal > 50 ? 0 : 5.99
  const couponDiscount = appliedCoupon ? subtotal * 0.1 : 0 // 10% discount
  const tax = (subtotal - couponDiscount) * 0.1
  const total = subtotal + shipping + tax - couponDiscount
  const itemCount = getItemCount()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-width section-padding py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm p-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-8">
                Looks like you haven't added any items to your cart yet. 
                Start shopping to fill it up!
              </p>
              <Link href="/products" className="btn-primary w-full">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-width section-padding py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="flex space-x-4">
                      <div className="skeleton w-24 h-24" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton-text h-5" />
                        <div className="skeleton-text h-4 w-3/4" />
                        <div className="skeleton-text h-4 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              items.map((item) => {
                const product = cartProducts.find(p => p.id === item.productId)
                
                if (!product) {
                  return (
                    <div key={item.productId} className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="text-center text-gray-500 py-4">
                        Product not found
                      </div>
                    </div>
                  )
                }

                const itemPrice = product.discountPrice || product.price
                const itemTotal = itemPrice * item.quantity

                return (
                  <div key={item.productId} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <Link href={`/products/${product.id}`}>
                          <Image
                            src={product.images[0] || '/api/placeholder/120/120'}
                            alt={product.name}
                            width={120}
                            height={120}
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg hover:scale-105 transition-transform"
                          />
                        </Link>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 pr-4">
                            <Link href={`/products/${product.id}`}>
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-500 transition-colors line-clamp-2">
                                {product.name}
                              </h3>
                            </Link>
                            
                            {/* Variant info if applicable */}
                            {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                              <div className="mt-1 text-sm text-gray-500">
                                {Object.entries(item.selectedVariant).map(([key, value]) => (
                                  <span key={key} className="mr-3">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Price */}
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="text-xl font-bold text-primary-500">
                                ${itemPrice.toFixed(2)}
                              </span>
                              {product.discountPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Stock Status */}
                            {product.stock <= 5 && product.stock > 0 && (
                              <div className="mt-2 text-sm text-orange-600 font-medium">
                                Only {product.stock} left in stock
                              </div>
                            )}
                            {product.stock === 0 && (
                              <div className="mt-2 text-sm text-red-600 font-medium">
                                Out of stock
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:items-end space-y-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(product.id, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-100 transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(product.id, item.quantity + 1)}
                                  disabled={item.quantity >= product.stock}
                                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="text-xl font-bold text-gray-900">
                              ${itemTotal.toFixed(2)}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button className="p-2 text-gray-500 hover:text-primary-500 transition-colors">
                                <Heart className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(product.id)}
                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {/* Continue Shopping */}
            <div className="pt-6">
              <Link
                href="/products"
                className="inline-flex items-center text-primary-500 hover:text-primary-600 font-medium"
              >
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium mb-3">Promo Code</h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                      <span className="text-green-800 font-medium">{appliedCoupon}</span>
                      <div className="text-sm text-green-600">10% discount applied</div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Order Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon discount:</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Free Shipping Notice */}
              {subtotal < 50 && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-700">
                    <Truck className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                    </span>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="block w-full bg-primary-500 text-white text-center py-4 px-6 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                Proceed to Checkout
              </Link>

              {/* Security Notice */}
              <div className="mt-4 text-center text-sm text-gray-500">
                <p className="flex items-center justify-center">
                  <span className="mr-1">🔒</span>
                  Secure checkout with SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <CustomerLayout>
      <CartPage />
    </CustomerLayout>
  )
}