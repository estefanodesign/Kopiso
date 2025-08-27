'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Star, ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react'
import CustomerLayout from '@/components/CustomerLayout'
import useProductStore from '@/store/productStore'
import useCartStore from '@/store/cartStore'

function HomePage() {
  const { featuredProducts, categories, fetchFeaturedProducts, fetchCategories } = useProductStore()
  const { addItem } = useCartStore()

  useEffect(() => {
    fetchFeaturedProducts()
    fetchCategories()
  }, [fetchFeaturedProducts, fetchCategories])

  const handleAddToCart = (productId: string) => {
    addItem(productId, 1)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-width section-padding py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Discover Amazing Products at{' '}
                <span className="text-accent-300">Unbeatable Prices</span>
              </h1>
              <p className="text-xl opacity-90 leading-relaxed">
                Shop millions of products with fast shipping, secure payments, and 
                hassle-free returns. Your one-stop destination for everything you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="btn-primary bg-white text-primary-500 hover:bg-neutral-100"
                >
                  Shop Now
                </Link>
                <Link
                  href="/categories"
                  className="btn-outline border-white text-white hover:bg-white hover:text-primary-500"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="badge-primary">Hot Deal</span>
                  <span className="text-red-500 font-bold">-50%</span>
                </div>
                <Image
                  src="/api/placeholder/300/200"
                  alt="Featured Product"
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Premium Wireless Headphones
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary-500">$49.99</span>
                    <span className="text-sm text-gray-500 line-through">$99.99</span>
                  </div>
                  <button className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-accent-400 to-accent-600 rounded-2xl transform -rotate-3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container-width section-padding">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold">Free Shipping</h3>
              <p className="text-gray-600">Free shipping on orders over $50</p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-secondary-500" />
              </div>
              <h3 className="text-lg font-semibold">Secure Payment</h3>
              <p className="text-gray-600">100% secure and encrypted payments</p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Easy Returns</h3>
              <p className="text-gray-600">30-day money back guarantee</p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
                <Headphones className="h-8 w-8 text-accent-500" />
              </div>
              <h3 className="text-lg font-semibold">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container-width section-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-gray-600 text-lg">Discover products across all categories</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categories.slice(0, 12).map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group text-center space-y-3 p-4 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Image
                    src={category.image || '/api/placeholder/64/64'}
                    alt={category.name}
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary-500 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      <section className="py-16 bg-gradient-to-r from-red-500 to-pink-500 text-white">
        <div className="container-width section-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">⚡ Flash Sale</h2>
            <p className="text-xl opacity-90">Limited time offers - Don't miss out!</p>
            <div className="mt-6 flex justify-center space-x-4 text-2xl font-bold">
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <span className="block text-sm font-normal">Hours</span>
                <span>12</span>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <span className="block text-sm font-normal">Minutes</span>
                <span>34</span>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <span className="block text-sm font-normal">Seconds</span>
                <span>56</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <div key={product.id} className="bg-white rounded-lg p-4 text-gray-800 group hover:scale-105 transition-transform">
                <div className="relative mb-4">
                  <Image
                    src={product.images[0] || '/api/placeholder/250/200'}
                    alt={product.name}
                    width={250}
                    height={200}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    -{Math.round(((product.price - (product.discountPrice || product.price)) / product.price) * 100)}%
                  </div>
                </div>
                <h3 className="font-semibold mb-2 text-sm line-clamp-2">{product.name}</h3>
                <div className="flex items-center mb-2">
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">({product.reviewCount})</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-lg font-bold text-primary-500">
                      ${product.discountPrice || product.price}
                    </span>
                    {product.discountPrice && (
                      <span className="text-sm text-gray-500 line-through block">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 transition-colors group-hover:scale-110"
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container-width section-padding">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-gray-600 text-lg">Handpicked products just for you</p>
            </div>
            <Link
              href="/products"
              className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="card card-hover group">
                <div className="relative mb-4">
                  <Link href={`/products/${product.id}`}>
                    <Image
                      src={product.images[0] || '/api/placeholder/300/250'}
                      alt={product.name}
                      width={300}
                      height={250}
                      className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform"
                    />
                  </Link>
                  {product.featured && (
                    <div className="absolute top-2 left-2 badge-primary">
                      Featured
                    </div>
                  )}
                </div>
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary-500 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center mb-3">
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">({product.reviewCount})</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xl font-bold text-gray-800">
                      ${product.discountPrice || product.price}
                    </span>
                    {product.discountPrice && (
                      <span className="text-sm text-gray-500 line-through block">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="btn-primary px-4 py-2 text-sm group-hover:scale-105 transition-transform"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-width section-padding text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products, 
            exclusive deals, and special offers.
          </p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-primary-500 px-6 py-3 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default function Page() {
  return (
    <CustomerLayout>
      <HomePage />
    </CustomerLayout>
  )
}