'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  Filter,
  ChevronDown,
  Tag,
  Star,
  DollarSign
} from 'lucide-react'
import useProductStore from '@/store/productStore'
import { notifications } from '@/utils/notifications'

interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'category' | 'tag' | 'brand'
  count?: number
}

interface AdvancedSearchProps {
  onClose?: () => void
  isModal?: boolean
  placeholder?: string
  showFilters?: boolean
}

export default function AdvancedSearch({ 
  onClose, 
  isModal = false, 
  placeholder = "Search for products...",
  showFilters = true 
}: AdvancedSearchProps) {
  const router = useRouter()
  const { categories, setSearchQuery } = useProductStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [popularSearches] = useState([
    'Wireless Headphones',
    'Smart Watch', 
    'Laptop Stand',
    'Phone Case',
    'Bluetooth Speaker',
    'Gaming Mouse'
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickFilters, setShowQuickFilters] = useState(false)
  const [quickFilters, setQuickFilters] = useState({
    category: '',
    priceRange: '',
    rating: '',
    featured: false
  })

  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Load search history from localStorage
    const history = localStorage.getItem('kopiso_search_history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  useEffect(() => {
    // Auto-focus when modal opens
    if (isModal && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isModal])

  // Debounced search suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchTerm.length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(searchTerm)
      }, 300)
    } else {
      setSuggestions([])
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm])

  const fetchSuggestions = async (query: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        const searchSuggestions: SearchSuggestion[] = [
          // Add product suggestions
          ...data.data.products.slice(0, 5).map((product: any) => ({
            id: product.id,
            text: product.name,
            type: 'product' as const,
            count: product.reviewCount
          })),
          // Add category suggestions
          ...categories
            .filter(cat => cat.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map(cat => ({
              id: cat.id,
              text: cat.name,
              type: 'category' as const
            })),
          // Add tag suggestions from the API response
          ...data.data.suggestions.slice(0, 3).map((suggestion: string, index: number) => ({
            id: `tag-${index}`,
            text: suggestion,
            type: 'tag' as const
          }))
        ]
        setSuggestions(searchSuggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query?: string) => {
    const searchQuery = query || searchTerm
    if (!searchQuery.trim()) return

    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('kopiso_search_history', JSON.stringify(newHistory))

    // Build search URL with filters
    const params = new URLSearchParams({ search: searchQuery })
    
    if (quickFilters.category) {
      params.append('category', quickFilters.category)
    }
    if (quickFilters.priceRange) {
      const [min, max] = quickFilters.priceRange.split('-')
      if (min) params.append('filter_minPrice', min)
      if (max) params.append('filter_maxPrice', max)
    }
    if (quickFilters.rating) {
      params.append('filter_rating', quickFilters.rating)
    }
    if (quickFilters.featured) {
      params.append('filter_featured', 'true')
    }

    // Update store and navigate
    setSearchQuery(searchQuery)
    router.push(`/products?${params.toString()}`)
    
    // Clean up
    setSearchTerm('')
    setIsSearchFocused(false)
    setSuggestions([])
    
    if (onClose) {
      onClose()
    }

    notifications.success(`Searching for "${searchQuery}"`)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product') {
      router.push(`/products/${suggestion.id}`)
    } else if (suggestion.type === 'category') {
      router.push(`/products?category=${suggestion.id}`)
    } else {
      handleSearch(suggestion.text)
    }
    
    if (onClose) {
      onClose()
    }
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('kopiso_search_history')
    notifications.success('Search history cleared')
  }

  const removeFromHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newHistory = searchHistory.filter(h => h !== item)
    setSearchHistory(newHistory)
    localStorage.setItem('kopiso_search_history', JSON.stringify(newHistory))
  }

  const priceRanges = [
    { label: 'Under $25', value: '0-25' },
    { label: '$25 - $50', value: '25-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: '$100 - $200', value: '100-200' },
    { label: 'Over $200', value: '200-' }
  ]

  return (
    <div className={`${isModal ? 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4 sm:pt-16 px-4' : 'relative'}`}>
      <div className={`${isModal ? 'bg-white rounded-lg shadow-2xl w-full max-w-4xl' : 'w-full'}`}>
        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch()
                }
                if (e.key === 'Escape' && onClose) {
                  onClose()
                }
              }}
              className={`w-full pl-4 pr-16 sm:pr-20 py-3 sm:py-4 border-2 border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors text-base sm:text-lg ${
                isModal ? 'rounded-t-lg rounded-b-none' : ''
              }`}
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 sm:space-x-2">
              {showFilters && (
                <button
                  onClick={() => setShowQuickFilters(!showQuickFilters)}
                  className={`p-2 rounded-lg transition-colors ${
                    showQuickFilters || Object.values(quickFilters).some(v => v) 
                      ? 'bg-primary-500 text-white' 
                      : 'hover:bg-neutral-100 text-gray-600'
                  }`}
                  title="Quick Filters"
                >
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
              
              <button
                onClick={() => handleSearch()}
                disabled={!searchTerm.trim()}
                className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              {isModal && onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-gray-600"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          {showFilters && showQuickFilters && (
            <div className="border-l-2 border-r-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={quickFilters.category}
                    onChange={(e) => setQuickFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <select
                    value={quickFilters.priceRange}
                    onChange={(e) => setQuickFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                  >
                    <option value="">Any Price</option>
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={quickFilters.rating}
                    onChange={(e) => setQuickFilters(prev => ({ ...prev, rating: e.target.value }))}
                    className="w-full p-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="1">1+ Stars</option>
                  </select>
                </div>

                {/* Featured Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special</label>
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={quickFilters.featured}
                      onChange={(e) => setQuickFilters(prev => ({ ...prev, featured: e.target.checked }))}
                      className="mr-2 text-primary-500"
                    />
                    <span className="text-sm">Featured Only</span>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              {Object.values(quickFilters).some(v => v) && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <button
                    onClick={() => setQuickFilters({ category: '', priceRange: '', rating: '', featured: false })}
                    className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search Dropdown */}
          {isSearchFocused && (
            <div className={`absolute top-full left-0 right-0 bg-white border-l-2 border-r-2 border-b-2 border-neutral-200 shadow-dropdown z-10 max-h-80 sm:max-h-96 overflow-y-auto ${
              isModal ? 'rounded-b-lg' : ''
            }`}>
              
              {/* Loading */}
              {isLoading && searchTerm.length >= 2 && (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  <p className="text-sm text-gray-600 mt-2">Searching...</p>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && !isLoading && (
                <div className="p-2">
                  <div className="text-sm text-gray-600 px-3 py-2 font-medium">Search Suggestions</div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-neutral-100 rounded transition-colors text-left"
                    >
                      {suggestion.type === 'product' && <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                      {suggestion.type === 'category' && <Tag className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                      {suggestion.type === 'tag' && <Tag className="h-4 w-4 text-green-500 flex-shrink-0" />}
                      
                      <span className="flex-1 text-sm sm:text-base truncate">{suggestion.text}</span>
                      
                      {suggestion.count && (
                        <span className="text-xs text-gray-500 hidden sm:block">({suggestion.count} reviews)</span>
                      )}
                      
                      <span className="text-xs text-gray-400 capitalize hidden sm:block">{suggestion.type}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && !searchTerm && (
                <div className="p-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="text-sm text-gray-600 font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Recent Searches
                    </div>
                    <button
                      onClick={clearSearchHistory}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(item)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 rounded transition-colors text-left group"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm sm:text-base truncate">{item}</span>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(item, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded transition-all flex-shrink-0"
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {!searchTerm && (
                <div className="p-2 border-t border-neutral-200">
                  <div className="text-sm text-gray-600 px-3 py-2 font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Popular Searches
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {popularSearches.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(item)}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-neutral-100 rounded transition-colors text-left"
                      >
                        <TrendingUp className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm sm:text-base truncate">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
                <div className="p-4 text-center">
                  <div className="text-gray-500 mb-2 text-sm sm:text-base">No suggestions found</div>
                  <button
                    onClick={() => handleSearch()}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                  >
                    Search for "{searchTerm}" anyway
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Click outside handler for modal */}
        {isModal && (
          <div 
            className="fixed inset-0 -z-10" 
            onClick={onClose}
          />
        )}
      </div>
    </div>
  )
}