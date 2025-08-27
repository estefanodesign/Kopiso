'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import useCartStore from '@/store/cartStore'
import useProductStore from '@/store/productStore'
import { Product } from '@/types'
import { toast } from 'react-hot-toast'

export default function CartSidebar() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    getCartTotal,
    getCartSubtotal
  } = useCartStore()
  
  const { products, fetchProducts } = useProductStore()
  const [cartProducts, setCartProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch products when cart opens or items change
  useEffect(() => {
    if (isOpen && items.length > 0) {
      fetchCartProducts()
    }
  }, [isOpen, items])

  const fetchCartProducts = async () => {
    setIsLoading(true)
    try {
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
    clearCart()
    toast.success('Cart cleared')
  }

  const subtotal = getCartSubtotal(cartProducts)
  const shipping = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={closeCart}
      />
      
      {/* Cart sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6" />
            <span>Shopping Cart ({items.length})</span>
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="loading-spinner" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Start shopping to add items to your cart</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="btn-primary"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {items.map((item) => {
                const product = cartProducts.find(p => p.id === item.productId)
                
                if (!product) {
                  return (
                    <div key={item.productId} className="text-center text-gray-500 py-4">
                      Product not found
                    </div>
                  )
                }

                const itemPrice = product.discountPrice || product.price
                const itemTotal = itemPrice * item.quantity

                return (
                  <div key={item.productId} className="flex space-x-4 border-b border-neutral-200 pb-4">
                    <div className="flex-shrink-0">
                      <Image
                        src={product.images[0] || '/api/placeholder/80/80'}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${product.id}`}
                        onClick={closeCart}
                        className="block"
                      >
                        <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-primary-500 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-lg font-semibold text-primary-500">
                          ${itemPrice.toFixed(2)}
                        </span>
                        {product.discountPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Variant info if applicable */}
                      {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                        <div className="mt-1 text-sm text-gray-500">
                          {Object.entries(item.selectedVariant).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quantity controls */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(product.id, item.quantity - 1)}
                            className="p-1 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(product.id, item.quantity + 1)}
                            className="p-1 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(product.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 text-right">
                        <span className="font-medium text-gray-900">
                          ${itemTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Clear cart button */}
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="w-full text-center text-red-500 hover:text-red-600 transition-colors py-2"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with totals and checkout */}
        {items.length > 0 && !isLoading && (
          <div className="border-t border-neutral-200 p-6 space-y-4">
            {/* Order summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Free shipping notice */}
            {subtotal < 50 && (
              <div className="text-sm text-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-600">
                  Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full btn-primary text-center"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="block w-full btn-outline text-center"
              >
                View Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}