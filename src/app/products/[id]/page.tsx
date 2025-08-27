'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Minus, 
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  MessageSquare
} from 'lucide-react'
import CustomerLayout from '@/components/CustomerLayout'
import useProductStore from '@/store/productStore'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import { Product } from '@/types'
import { toast } from 'react-hot-toast'

function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  
  const { fetchProductById, products } = useProductStore()
  const { addItem, isItemInCart, getItemQuantity } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description')

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    setIsLoading(true)
    try {
      const productData = await fetchProductById(productId)
      if (productData) {
        setProduct(productData)
        
        // Load related products (same category)
        const related = products
          .filter(p => p.category === productData.category && p.id !== productData.id)
          .slice(0, 4)
        setRelatedProducts(related)
      }
    } catch (error) {
      console.error('Failed to load product:', error)
      toast.error('Failed to load product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    
    addItem(product.id, quantity, selectedVariant)
    toast.success(`${product.name} added to cart`)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity)
    }
  }

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!product) return
    
    if (direction === 'prev') {
      setSelectedImageIndex(prev => 
        prev === 0 ? product.images.length - 1 : prev - 1
      )
    } else {
      setSelectedImageIndex(prev => 
        prev === product.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-width section-padding py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="skeleton-image h-96" />
              <div className="flex space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton w-20 h-20" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="skeleton-text h-8" />
              <div className="skeleton-text h-4 w-3/4" />
              <div className="skeleton-text h-4 w-1/2" />
              <div className="skeleton h-12" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const isInCart = isItemInCart(product.id)
  const cartQuantity = getItemQuantity(product.id)
  const finalPrice = product.discountPrice || product.price
  const savings = product.discountPrice ? product.price - product.discountPrice : 0

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-width section-padding py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-primary-500">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-primary-500">Products</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              <Image
                src={product.images[selectedImageIndex] || '/api/placeholder/600/600'}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-96 lg:h-[500px] object-cover"
              />
              
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation('prev')}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation('next')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {product.featured && (
                  <span className="badge-primary">Featured</span>
                )}
                {savings > 0 && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    Save ${savings.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-primary-500' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image || '/api/placeholder/80/80'}
                      alt={`${product.name} view ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-gray-600">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-primary-500">
                  ${finalPrice.toFixed(2)}
                </span>
                {product.discountPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    {Math.round((savings / product.price) * 100)}% OFF
                  </span>
                  <span className="text-sm text-gray-600">
                    You save ${savings.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {isInCart && (
                  <span className="text-sm text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    {cartQuantity} in cart
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  product.stock === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600 transform hover:scale-105'
                }`}
              >
                {product.stock === 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 inline mr-2" />
                    Add to Cart
                  </>
                )}
              </button>
              
              <div className="flex space-x-3">
                <button className="flex-1 py-3 px-6 border-2 border-primary-500 text-primary-500 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                  <Heart className="h-5 w-5 inline mr-2" />
                  Add to Wishlist
                </button>
                <Link
                  href="/checkout"
                  className="flex-1 py-3 px-6 bg-secondary-500 text-white rounded-lg font-semibold hover:bg-secondary-600 transition-colors text-center"
                >
                  Buy Now
                </Link>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-200">
              <div className="text-center">
                <Truck className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-sm font-medium">Free Shipping</div>
                <div className="text-xs text-gray-500">On orders over $50</div>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-sm font-medium">Easy Returns</div>
                <div className="text-xs text-gray-500">30-day guarantee</div>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-sm font-medium">Secure Payment</div>
                <div className="text-xs text-gray-500">SSL encrypted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'description', label: 'Description' },
                { id: 'specifications', label: 'Specifications' },
                { id: 'reviews', label: `Reviews (${product.reviewCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed text-lg">
                  {product.description}
                </p>
                {product.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map(tag => (
                        <span key={tag} className="badge bg-gray-100 text-gray-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(product.specifications || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
                {Object.keys(product.specifications || {}).length === 0 && (
                  <p className="text-gray-500 italic">No specifications available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Customer Reviews</h3>
                  {isAuthenticated && (
                    <button className="btn-outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Write a Review
                    </button>
                  )}
                </div>
                
                {/* Reviews placeholder */}
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(relatedProduct => (
                <div key={relatedProduct.id} className="card card-hover group">
                  <div className="relative mb-4">
                    <Link href={`/products/${relatedProduct.id}`}>
                      <Image
                        src={relatedProduct.images[0] || '/api/placeholder/250/200'}
                        alt={relatedProduct.name}
                        width={250}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    </Link>
                  </div>
                  <Link href={`/products/${relatedProduct.id}`}>
                    <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary-500 transition-colors">
                      {relatedProduct.name}
                    </h3>
                  </Link>
                  <div className="flex items-center mb-3">
                    <div className="flex items-center text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(relatedProduct.rating) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">({relatedProduct.reviewCount})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary-500">
                        ${relatedProduct.discountPrice || relatedProduct.price}
                      </span>
                      {relatedProduct.discountPrice && (
                        <span className="text-sm text-gray-500 line-through block">
                          ${relatedProduct.price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addItem(relatedProduct.id, 1)}
                      className="btn-primary px-3 py-2 text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <CustomerLayout>
      <ProductDetailPage />
    </CustomerLayout>
  )
}