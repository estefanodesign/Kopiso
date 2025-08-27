import productStore from '../productStore'
import { mockProducts, mockProduct, mockApiResponse, waitForAsyncAction } from '@/utils/testUtils'
import '@testing-library/jest-dom'

// Mock the API client
jest.mock('@/utils/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  api: {
    products: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    }
  }
}))

// Mock error monitoring
jest.mock('@/utils/errorMonitoring', () => ({
  ErrorMonitoring: {
    getInstance: () => ({
      addBreadcrumb: jest.fn(),
      recordError: jest.fn(),
    })
  }
}))

// Mock notifications
jest.mock('@/utils/notifications', () => ({
  notifications: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }
}))

import { api } from '@/utils/apiClient'

describe('ProductStore', () => {
  beforeEach(() => {
    // Reset store state
    productStore.getState().reset()
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = productStore.getState()
      
      expect(state.products).toEqual([])
      expect(state.featuredProducts).toEqual([])
      expect(state.categories).toEqual([])
      expect(state.currentProduct).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.searchQuery).toBe('')
      expect(state.filters).toEqual({
        category: '',
        priceRange: [0, 1000],
        rating: 0,
        brand: '',
        inStock: false
      })
      expect(state.sortBy).toBe('name')
      expect(state.sortOrder).toBe('asc')
      expect(state.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0
      })
    })
  })

  describe('Fetch Products', () => {
    it('should fetch products successfully', async () => {
      const mockResponse = mockApiResponse.paginated(mockProducts, 1, 12, 50)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await productStore.getState().fetchProducts()

      expect(api.products.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        sortBy: 'name',
        sortOrder: 'asc',
        search: '',
        filters: {
          category: '',
          priceRange: [0, 1000],
          rating: 0,
          brand: '',
          inStock: false
        }
      })

      const state = productStore.getState()
      expect(state.products).toEqual(mockProducts)
      expect(state.pagination.total).toBe(50)
      expect(state.pagination.totalPages).toBe(5)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch products error', async () => {
      const errorMessage = 'Failed to fetch products'
      ;(api.products.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await productStore.getState().fetchProducts()

      const state = productStore.getState()
      expect(state.products).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      ;(api.products.getAll as jest.Mock).mockReturnValue(promise)

      const fetchPromise = productStore.getState().fetchProducts()
      
      // Check loading state
      expect(productStore.getState().loading).toBe(true)

      // Resolve the promise
      resolvePromise!(mockApiResponse.paginated(mockProducts))
      await fetchPromise

      expect(productStore.getState().loading).toBe(false)
    })
  })

  describe('Fetch Product by ID', () => {
    it('should fetch product by ID successfully', async () => {
      const mockResponse = mockApiResponse.success(mockProduct)
      ;(api.products.getById as jest.Mock).mockResolvedValue(mockResponse)

      await productStore.getState().fetchProductById('product-1')

      expect(api.products.getById).toHaveBeenCalledWith('product-1')

      const state = productStore.getState()
      expect(state.currentProduct).toEqual(mockProduct)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch product by ID error', async () => {
      const errorMessage = 'Product not found'
      ;(api.products.getById as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await productStore.getState().fetchProductById('invalid-id')

      const state = productStore.getState()
      expect(state.currentProduct).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Search Products', () => {
    it('should search products successfully', async () => {
      const searchQuery = 'test product'
      const mockResponse = mockApiResponse.paginated(mockProducts, 1, 12, 3)
      ;(api.products.search as jest.Mock).mockResolvedValue(mockResponse)

      await productStore.getState().searchProducts(searchQuery)

      expect(api.products.search).toHaveBeenCalledWith(searchQuery, {
        category: '',
        priceRange: [0, 1000],
        rating: 0,
        brand: '',
        inStock: false
      })

      const state = productStore.getState()
      expect(state.products).toEqual(mockProducts)
      expect(state.searchQuery).toBe(searchQuery)
      expect(state.loading).toBe(false)
    })

    it('should handle search products error', async () => {
      const errorMessage = 'Search failed'
      ;(api.products.search as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await productStore.getState().searchProducts('test')

      const state = productStore.getState()
      expect(state.products).toEqual([])
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Featured Products', () => {
    it('should fetch featured products successfully', async () => {
      const featuredProducts = mockProducts.filter(p => p.featured)
      const mockResponse = mockApiResponse.success(featuredProducts)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await productStore.getState().fetchFeaturedProducts()

      expect(api.products.getAll).toHaveBeenCalledWith({ featured: true, limit: 10 })

      const state = productStore.getState()
      expect(state.featuredProducts).toEqual(featuredProducts)
      expect(state.loading).toBe(false)
    })

    it('should handle fetch featured products error', async () => {
      const errorMessage = 'Failed to fetch featured products'
      ;(api.products.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await productStore.getState().fetchFeaturedProducts()

      const state = productStore.getState()
      expect(state.featuredProducts).toEqual([])
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Filters and Sorting', () => {
    it('should set search query', () => {
      const query = 'new search'
      productStore.getState().setSearchQuery(query)

      expect(productStore.getState().searchQuery).toBe(query)
    })

    it('should set filters', () => {
      const newFilters = {
        category: 'electronics',
        priceRange: [50, 500] as [number, number],
        rating: 4,
        brand: 'Apple',
        inStock: true
      }

      productStore.getState().setFilters(newFilters)

      expect(productStore.getState().filters).toEqual(newFilters)
    })

    it('should set sort options', () => {
      productStore.getState().setSortBy('price')
      productStore.getState().setSortOrder('desc')

      const state = productStore.getState()
      expect(state.sortBy).toBe('price')
      expect(state.sortOrder).toBe('desc')
    })

    it('should set pagination', () => {
      const newPagination = {
        page: 2,
        limit: 24,
        total: 100,
        totalPages: 5
      }

      productStore.getState().setPagination(newPagination)

      expect(productStore.getState().pagination).toEqual(newPagination)
    })
  })

  describe('Clear Functions', () => {
    it('should clear current product', () => {
      // Set a current product first
      productStore.setState({ currentProduct: mockProduct })
      
      productStore.getState().clearCurrentProduct()

      expect(productStore.getState().currentProduct).toBeNull()
    })

    it('should clear error', () => {
      // Set an error first
      productStore.setState({ error: 'Some error' })
      
      productStore.getState().clearError()

      expect(productStore.getState().error).toBeNull()
    })

    it('should reset store to initial state', () => {
      // Modify state
      productStore.setState({
        products: mockProducts,
        currentProduct: mockProduct,
        searchQuery: 'test',
        error: 'some error',
        loading: true
      })

      productStore.getState().reset()

      const state = productStore.getState()
      expect(state.products).toEqual([])
      expect(state.currentProduct).toBeNull()
      expect(state.searchQuery).toBe('')
      expect(state.error).toBeNull()
      expect(state.loading).toBe(false)
    })
  })

  describe('Categories Management', () => {
    it('should fetch categories successfully', async () => {
      const categories = ['electronics', 'fashion', 'home']
      const mockResponse = mockApiResponse.success(categories)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await productStore.getState().fetchCategories()

      const state = productStore.getState()
      expect(state.categories).toEqual(categories)
    })

    it('should handle fetch categories error', async () => {
      const errorMessage = 'Failed to fetch categories'
      ;(api.products.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await productStore.getState().fetchCategories()

      const state = productStore.getState()
      expect(state.categories).toEqual([])
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Product Management (Admin)', () => {
    it('should create product successfully', async () => {
      const newProduct = { ...mockProduct, id: 'new-product' }
      const mockResponse = mockApiResponse.success(newProduct)
      ;(api.products.create as jest.Mock).mockResolvedValue(mockResponse)

      const result = await productStore.getState().createProduct(newProduct)

      expect(api.products.create).toHaveBeenCalledWith(newProduct)
      expect(result).toBe(true)

      const state = productStore.getState()
      expect(state.products).toContain(newProduct)
    })

    it('should handle create product error', async () => {
      const errorMessage = 'Failed to create product'
      ;(api.products.create as jest.Mock).mockRejectedValue(new Error(errorMessage))

      const result = await productStore.getState().createProduct(mockProduct)

      expect(result).toBe(false)
      expect(productStore.getState().error).toBe(errorMessage)
    })

    it('should update product successfully', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Product' }
      const mockResponse = mockApiResponse.success(updatedProduct)
      ;(api.products.update as jest.Mock).mockResolvedValue(mockResponse)

      // Set initial products
      productStore.setState({ products: [mockProduct] })

      const result = await productStore.getState().updateProduct('product-1', updatedProduct)

      expect(api.products.update).toHaveBeenCalledWith('product-1', updatedProduct)
      expect(result).toBe(true)

      const state = productStore.getState()
      expect(state.products[0]).toEqual(updatedProduct)
    })

    it('should delete product successfully', async () => {
      const mockResponse = mockApiResponse.success({ message: 'Product deleted' })
      ;(api.products.delete as jest.Mock).mockResolvedValue(mockResponse)

      // Set initial products
      productStore.setState({ products: [mockProduct] })

      const result = await productStore.getState().deleteProduct('product-1')

      expect(api.products.delete).toHaveBeenCalledWith('product-1')
      expect(result).toBe(true)

      const state = productStore.getState()
      expect(state.products).toHaveLength(0)
    })
  })
})