import { create } from 'zustand'
import { Product, Category, ProductFilters, SortOptions, PaginatedResponse } from '@/types'
import { api, apiClient } from '@/utils/apiClient'
import { errorMonitoring, addBreadcrumb } from '@/utils/errorMonitoring'
import { notifications } from '@/utils/notifications'

interface ProductState {
  products: Product[]
  categories: Category[]
  featuredProducts: Product[]
  currentProduct: Product | null
  filters: ProductFilters
  sortOptions: SortOptions
  searchQuery: string
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ProductActions {
  fetchProducts: (params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
    filters?: ProductFilters
    sort?: SortOptions
  }) => Promise<void>
  fetchCategories: () => Promise<void>
  fetchFeaturedProducts: () => Promise<void>
  fetchProductById: (id: string) => Promise<Product | null>
  setCurrentProduct: (product: Product | null) => void
  updateFilters: (filters: Partial<ProductFilters>) => void
  clearFilters: () => void
  updateSortOptions: (sort: SortOptions) => void
  setSearchQuery: (query: string) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

type ProductStore = ProductState & ProductActions

const useProductStore = create<ProductStore>((set, get) => ({
  // Initial state
  products: [],
  categories: [],
  featuredProducts: [],
  currentProduct: null,
  filters: {},
  sortOptions: { field: 'createdAt', order: 'desc' },
  searchQuery: '',
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },

  // Actions
  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null })
    addBreadcrumb('Fetching products', 'info', params)
    
    try {
      const {
        page = 1,
        limit = 12,
        category,
        search,
        filters = {},
        sort = { field: 'createdAt', order: 'desc' }
      } = params

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: `${sort.field}:${sort.order}`,
      })

      // Add category from direct parameter or from filters
      const categoryToUse = category || filters.category
      if (categoryToUse) {
        searchParams.append('category', categoryToUse)
      }

      // Add search query
      if (search) {
        searchParams.append('search', search)
      }

      // Add other filters to search params (excluding category since it's handled above)
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'category' && value !== undefined && value !== null && value !== '') {
          searchParams.append(`filter_${key}`, value.toString())
        }
      })

      const response = await apiClient.get<PaginatedResponse<Product>>(`/products?${searchParams}`, {
        showNotifications: false, // Handle notifications manually
        timeout: 15000 // 15 second timeout for product searches
      })

      if (response.success) {
        set({
          products: response.data.data,
          pagination: response.data.meta,
          filters,
          sortOptions: sort,
          searchQuery: search || '',
          isLoading: false,
        })
        
        addBreadcrumb('Products fetched successfully', 'info', {
          count: response.data.data.length,
          page,
          total: response.data.meta?.total
        })
      } else {
        throw new Error('Failed to fetch products')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products'
      
      set({
        error: errorMessage,
        isLoading: false,
      })
      
      // Log error with context
      errorMonitoring.logError(
        error instanceof Error ? error : new Error(errorMessage),
        {
          component: 'ProductStore',
          action: 'fetchProducts',
          additionalData: params
        }
      )
      
      // Show user-friendly notification
      notifications.error('Failed to load products. Please try again.')
    }
  },

  fetchCategories: async () => {
    try {
      const response = await fetch('/api/categories')
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()

      if (data.success) {
        set({ categories: data.data })
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  },

  fetchFeaturedProducts: async () => {
    try {
      const response = await fetch('/api/products/featured')
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured products')
      }

      const data = await response.json()

      if (data.success) {
        set({ featuredProducts: data.data })
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
    }
  },

  fetchProductById: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`/api/products/${id}`)
      
      if (!response.ok) {
        throw new Error('Product not found')
      }

      const data = await response.json()

      if (data.success) {
        set({
          currentProduct: data.data,
          isLoading: false,
        })
        return data.data
      } else {
        throw new Error('Product not found')
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        isLoading: false,
      })
      return null
    }
  },

  setCurrentProduct: (product: Product | null) => {
    set({ currentProduct: product })
  },

  updateFilters: (newFilters: Partial<ProductFilters>) => {
    const currentFilters = get().filters
    const updatedFilters = { ...currentFilters, ...newFilters }
    set({ filters: updatedFilters })
    
    // Auto-fetch with new filters
    get().fetchProducts({
      page: 1, // Reset to first page when filtering
      filters: updatedFilters,
      sort: get().sortOptions,
      search: get().searchQuery,
    })
  },

  clearFilters: () => {
    set({ filters: {} })
    
    // Auto-fetch with cleared filters
    get().fetchProducts({
      page: 1,
      sort: get().sortOptions,
      search: get().searchQuery,
    })
  },

  updateSortOptions: (sort: SortOptions) => {
    set({ sortOptions: sort })
    
    // Auto-fetch with new sort options
    get().fetchProducts({
      page: get().pagination.page,
      filters: get().filters,
      sort,
      search: get().searchQuery,
    })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
    
    // Auto-fetch with new search query
    get().fetchProducts({
      page: 1, // Reset to first page when searching
      search: query,
      filters: get().filters,
      sort: get().sortOptions,
    })
  },

  clearError: () => {
    set({ error: null })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
}))

export default useProductStore