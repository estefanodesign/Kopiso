'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  Star, 
  Heart, 
  ShoppingCart, 
  X,
  ChevronDown,
  ArrowUpDown,
  Zap,
  TrendingUp
} from 'lucide-react'
import useProductStore from '@/store/productStore'
import useCartStore from '@/store/cartStore'
import AdvancedSearch from '@/components/AdvancedSearch'
import CustomerLayout from '@/components/CustomerLayout'
import { notifications } from '@/utils/notifications'

interface SearchResultsPageProps {
  initialSearchQuery?: string
}

export default function SearchResultsPage({ initialSearchQuery = '' }: SearchResultsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { 
    products, 
    categories, 
    filters, 
    sortOptions, 
    searchQuery, 
    isLoading, 
    pagination,
    fetchProducts,
    fetchCategories,
    updateFilters,
    clearFilters,
    updateSortOptions,
    setSearchQuery
  } = useProductStore()
  const { addItem } = useCartStore()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    searchTime: 0,
    suggestions: [] as string[]
  })

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Load search parameters and filters from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || initialSearchQuery
    const categoryFromUrl = searchParams.get('category')
    const minPriceFromUrl = searchParams.get('filter_minPrice')
    const maxPriceFromUrl = searchParams.get('filter_maxPrice')
    const ratingFromUrl = searchParams.get('filter_rating')
    const inStockFromUrl = searchParams.get('filter_inStock')
    const featuredFromUrl = searchParams.get('filter_featured')
    const sortFromUrl = searchParams.get('sort')
    const pageFromUrl = searchParams.get('page')

    const urlFilters = {
      category: categoryFromUrl || undefined,
      minPrice: minPriceFromUrl ? parseFloat(minPriceFromUrl) : undefined,
      maxPrice: maxPriceFromUrl ? parseFloat(maxPriceFromUrl) : undefined,
      rating: ratingFromUrl ? parseFloat(ratingFromUrl) : undefined,
      inStock: inStockFromUrl === 'true',
      featured: featuredFromUrl === 'true'
    }

    const urlSort = sortFromUrl ? {
      field: sortFromUrl.split(':')[0] as any,
      order: sortFromUrl.split(':')[1] as any
    } : { field: 'relevance' as any, order: 'desc' as any }

    setLocalFilters(urlFilters)

    // Fetch products when there's a search query OR category filter
    if (searchFromUrl || categoryFromUrl) {
      const startTime = Date.now()
      setSearchQuery(searchFromUrl)
      
      fetchProducts({
        search: searchFromUrl,
        filters: urlFilters,
        sort: urlSort,
        page: pageFromUrl ? parseInt(pageFromUrl) : 1
      }).then(() => {
        const endTime = Date.now()
        setSearchStats(prev => ({
          ...prev,
          searchTime: (endTime - startTime) / 1000
        }))
      })
    } else {
      // If no search or category, fetch all products
      fetchProducts({
        filters: urlFilters,
        sort: urlSort,
        page: pageFromUrl ? parseInt(pageFromUrl) : 1
      })
    }
  }, [searchParams, initialSearchQuery])

  // Update search stats when products change
  useEffect(() => {
    setSearchStats(prev => ({
      ...prev,
      totalResults: pagination.total
    }))
  }, [pagination.total])

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...localFilters, ...newFilters }
    setLocalFilters(updatedFilters)
    updateFilters(updatedFilters)
    
    // Update URL
    const params = new URLSearchParams(searchParams)
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(`filter_${key}`, value.toString())
      } else {
        params.delete(`filter_${key}`)
      }
    })
    router.push(`/products?${params.toString()}`)
  }

  const handleSortChange = (sort: string) => {
    const [field, order] = sort.split(':')
    const sortOptions = { field: field as any, order: order as any }
    updateSortOptions(sortOptions)
    
    const params = new URLSearchParams(searchParams)
    params.set('sort', sort)
    router.push(`/products?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/products?${params.toString()}`)
    
    fetchProducts({
      search: searchQuery,
      filters: localFilters,
      sort: sortOptions,
      page
    })
  }

  const handleClearFilters = () => {
    setLocalFilters({})
    clearFilters()
    
    // Update URL
    const params = new URLSearchParams()
    if (searchQuery) {
      params.set('search', searchQuery)
    }
    router.push(`/products?${params.toString()}`)
  }

  const handleAddToCart = (productId: string, productName: string) => {
    addItem(productId, 1)
    notifications.cart.added(productName)
  }

  const priceRanges = [
    { label: 'Under $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: 'Over $200', min: 200, max: undefined }
  ]

  const sortOptions_list = [
    { label: 'Best Match', value: 'relevance:desc' },
    { label: 'Price: Low to High', value: 'price:asc' },
    { label: 'Price: High to Low', value: 'price:desc' },
    { label: 'Customer Rating', value: 'rating:desc' },
    { label: 'Newest First', value: 'createdAt:desc' },
    { label: 'Most Popular', value: 'popularity:desc' }
  ]

  const activeFiltersCount = Object.values(localFilters).filter(v => 
    v !== undefined && v !== null && v !== '' && v !== false
  ).length

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Search Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-width section-padding py-3 sm:py-4">
          {/* Main Search Bar */}
          <div className="mb-3 sm:mb-4">
            <AdvancedSearch 
              placeholder={searchQuery ? `Searching for "${searchQuery}"` : "Search for products..."}
              showFilters={true}
            />
          </div>

          {/* Search Stats and Controls */}
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-4">
            {/* Search Stats */}
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
              {searchQuery && (
                <>
                  <span className="flex-1">
                    <strong>{searchStats.totalResults.toLocaleString()}</strong> results for "
                    <span className="font-medium">{searchQuery}</span>"
                  </span>
                  {searchStats.searchTime > 0 && (
                    <span className="hidden sm:block">({searchStats.searchTime.toFixed(2)}s)</span>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Sort */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
                <select
                  value={`${sortOptions.field}:${sortOptions.order}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-neutral-300 rounded-lg px-2 sm:px-3 py-1 text-sm focus:border-primary-500 focus:outline-none flex-1 sm:flex-none"
                >
                  {sortOptions_list.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'hover:bg-neutral-100'}`}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'hover:bg-neutral-100'}`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 border rounded-lg transition-colors ${
                  showFilters || activeFiltersCount > 0 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-neutral-300 hover:border-neutral-400'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 sm:mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Active filters:</span>
                
                <div className="flex flex-wrap gap-2">
                  {localFilters.category && (
                    <span className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      <span className="truncate max-w-24 sm:max-w-none">Category: {categories.find(c => c.id === localFilters.category)?.name}</span>
                      <button
                        onClick={() => handleFilterChange({ category: undefined })}
                        className="hover:bg-primary-200 rounded-full p-0.5 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {(localFilters.minPrice || localFilters.maxPrice) && (
                    <span className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      <span className="truncate">
                        Price: ${localFilters.minPrice || 0} - ${localFilters.maxPrice || '∞'}
                      </span>
                      <button
                        onClick={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
                        className="hover:bg-primary-200 rounded-full p-0.5 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {localFilters.rating && (
                    <span className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      <span>{localFilters.rating}+ Stars</span>
                      <button
                        onClick={() => handleFilterChange({ rating: undefined })}
                        className="hover:bg-primary-200 rounded-full p-0.5 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {localFilters.featured && (
                    <span className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      <span>Featured</span>
                      <button
                        onClick={() => handleFilterChange({ featured: false })}
                        className="hover:bg-primary-200 rounded-full p-0.5 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>

                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 underline whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width section-padding py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Sidebar Filters */}
          {showFilters && (
            <div className="w-full lg:w-64 lg:flex-shrink-0">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-200 lg:sticky lg:top-24">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <div className="flex items-center space-x-2">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="text-sm text-primary-600 hover:text-primary-700 underline"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden p-1 hover:bg-neutral-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Categories */}
                  <div>
                    <h4 className="font-medium mb-3 text-base">Category</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          checked={!localFilters.category}
                          onChange={() => handleFilterChange({ category: undefined })}
                          className="mr-2 text-primary-500"
                        />
                        <span className="text-sm">All Categories</span>
                      </label>
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="radio"
                            name="category"
                            checked={localFilters.category === category.id}
                            onChange={() => handleFilterChange({ category: category.id })}
                            className="mr-2 text-primary-500"
                          />
                          <span className="text-sm truncate">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-medium mb-3 text-base">Price Range</h4>
                    <div className="space-y-2">
                      {priceRanges.map((range, index) => (
                        <label key={index} className="flex items-center">
                          <input
                            type="radio"
                            name="priceRange"
                            checked={localFilters.minPrice === range.min && localFilters.maxPrice === range.max}
                            onChange={() => handleFilterChange({ 
                              minPrice: range.min, 
                              maxPrice: range.max 
                            })}
                            className="mr-2 text-primary-500"
                          />
                          <span className="text-sm">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h4 className="font-medium mb-3 text-base">Customer Rating</h4>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map(rating => (
                        <label key={rating} className="flex items-center">
                          <input
                            type="radio"
                            name="rating"
                            checked={localFilters.rating === rating}
                            onChange={() => handleFilterChange({ rating })}
                            className="mr-2 text-primary-500"
                          />
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 sm:h-4 sm:w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="text-sm ml-1">& Up</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <h4 className="font-medium mb-3 text-base">Availability</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.inStock || false}
                        onChange={(e) => handleFilterChange({ inStock: e.target.checked })}
                        className="mr-2 text-primary-500"
                      />
                      <span className="text-sm">In Stock Only</span>
                    </label>
                  </div>

                  {/* Featured */}
                  <div>
                    <h4 className="font-medium mb-3 text-base">Special</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.featured || false}
                        onChange={(e) => handleFilterChange({ featured: e.target.checked })}
                        className="mr-2 text-primary-500"
                      />
                      <span className="text-sm">Featured Products</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid/List */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="skeleton-image mb-4" />
                    <div className="skeleton-text" />
                    <div className="skeleton-text w-3/4" />
                    <div className="skeleton-text w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-4xl sm:text-6xl mb-4">🔍</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                  {searchQuery 
                    ? `No results found for "${searchQuery}". Try different keywords or adjust your filters.`
                    : 'Try adjusting your search or filters'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={handleClearFilters}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setShowAdvancedSearch(true)}
                    className="btn-outline"
                  >
                    Try Advanced Search
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Products */}
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' 
                  : 'space-y-4'
                }>
                  {products.map(product => (
                    <div key={product.id} className={viewMode === 'grid' 
                      ? 'card card-hover group' 
                      : 'card group flex flex-col sm:flex-row'
                    }>
                      <div className={viewMode === 'grid' 
                        ? 'relative mb-4' 
                        : 'relative w-full sm:w-48 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0'
                      }>
                        <Link href={`/products/${product.id}`}>
                          <Image
                            src={product.images[0] || '/api/placeholder/300/250'}
                            alt={product.name}
                            width={300}
                            height={250}
                            className={`object-cover rounded-lg group-hover:scale-105 transition-transform ${
                              viewMode === 'grid' ? 'w-full h-40 sm:h-48' : 'w-full h-32 sm:h-full'
                            }`}
                          />
                        </Link>
                        {product.featured && (
                          <div className="absolute top-2 left-2 badge-primary text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Featured
                          </div>
                        )}
                        {product.discountPrice && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-1.5 sm:px-2 py-1 rounded text-xs font-bold">
                            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                          </div>
                        )}
                        <button className="absolute top-2 right-2 p-1.5 sm:p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 hover:text-red-500" />
                        </button>
                      </div>

                      <div className={viewMode === 'grid' ? '' : 'flex-1 min-w-0'}>
                        <Link href={`/products/${product.id}`}>
                          <h3 className={`font-semibold hover:text-primary-500 transition-colors line-clamp-2 ${
                            viewMode === 'grid' ? 'mb-2 text-sm sm:text-base' : 'mb-1 text-base sm:text-lg'
                          }`}>
                            {product.name}
                          </h3>
                        </Link>

                        {viewMode === 'list' && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center mb-3">
                          <div className="flex items-center text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 sm:h-4 sm:w-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600 ml-2">({product.reviewCount})</span>
                          {product.stock <= 5 && product.stock > 0 && (
                            <span className="ml-auto text-xs text-orange-600 font-medium hidden sm:block">
                              Only {product.stock} left
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-lg sm:text-xl font-bold text-gray-800">
                              ${product.discountPrice || product.price}
                            </span>
                            {product.discountPrice && (
                              <span className="text-sm text-gray-500 line-through block">
                                ${product.price}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product.id, product.name)}
                            disabled={product.stock === 0}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                              product.stock === 0
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-500 text-white hover:bg-primary-600 group-hover:scale-105'
                            }`}
                          >
                            {product.stock === 0 ? 'Out of Stock' : (
                              <>
                                <ShoppingCart className="h-4 w-4 inline mr-1" />
                                <span className="hidden sm:inline">Add to Cart</span>
                                <span className="sm:hidden">Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8 sm:mt-12">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-2 sm:px-3 py-2 rounded-lg border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 text-sm"
                      >
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </button>
                      
                      {/* Desktop pagination */}
                      <div className="hidden sm:flex items-center space-x-2">
                        {[...Array(pagination.totalPages)].map((_, i) => {
                          const page = i + 1
                          const isCurrentPage = page === pagination.page
                          const showPage = 
                            page === 1 || 
                            page === pagination.totalPages || 
                            (page >= pagination.page - 2 && page <= pagination.page + 2)

                          if (!showPage) {
                            if (page === pagination.page - 3 || page === pagination.page + 3) {
                              return <span key={page} className="px-2">...</span>
                            }
                            return null
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 rounded-lg ${
                                isCurrentPage
                                  ? 'bg-primary-500 text-white'
                                  : 'border border-neutral-300 hover:bg-neutral-50'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}
                      </div>

                      {/* Mobile pagination info */}
                      <div className="sm:hidden flex items-center px-3 py-2 text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </div>

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-2 sm:px-3 py-2 rounded-lg border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 text-sm"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch
          isModal={true}
          onClose={() => setShowAdvancedSearch(false)}
          showFilters={true}
          placeholder="Search for products, brands, categories..."
        />
      )}
    </div>
  )
}