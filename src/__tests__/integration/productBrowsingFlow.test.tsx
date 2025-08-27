import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import productStore from '@/store/productStore'
import { mockProducts, mockProduct, mockApiResponse } from '@/utils/testUtils'
import ProductsPage from '@/app/products/page'
import ProductDetailPage from '@/app/products/[id]/page'
import SearchResultsPage from '@/app/search/page'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock API client
jest.mock('@/utils/apiClient', () => ({
  api: {
    products: {
      getAll: jest.fn(),
      getById: jest.fn(),
      search: jest.fn(),
    }
  }
}))

import { api } from '@/utils/apiClient'

describe('Product Browsing and Search Integration Tests', () => {
  const mockPush = jest.fn()
  const mockQuery = {}

  beforeEach(() => {
    // Reset store
    productStore.getState().reset()
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: mockQuery,
      pathname: '/products',
    })
  })

  describe('Product Listing Flow', () => {
    it('should load and display products on the products page', async () => {
      const mockResponse = mockApiResponse.paginated(mockProducts, 1, 12, 50)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      render(<ProductsPage />)

      // Verify loading state is shown initially
      expect(screen.getByTestId('products-loading')).toBeInTheDocument()

      // Wait for products to load
      await waitFor(() => {
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
      })

      // Verify products are displayed
      await waitFor(() => {
        mockProducts.forEach(product => {
          expect(screen.getByText(product.name)).toBeInTheDocument()
          expect(screen.getByText(`$${product.price}`)).toBeInTheDocument()
        })
      })

      // Verify pagination info
      await waitFor(() => {
        expect(screen.getByText('Showing 1-12 of 50 products')).toBeInTheDocument()
      })

      // Verify store state is updated
      const productState = productStore.getState()
      expect(productState.products).toEqual(mockProducts)
      expect(productState.pagination.total).toBe(50)
      expect(productState.loading).toBe(false)
    })

    it('should handle empty product list', async () => {
      const mockResponse = mockApiResponse.paginated([], 1, 12, 0)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your filters or search terms')).toBeInTheDocument()
      })
    })

    it('should handle product loading errors', async () => {
      const errorMessage = 'Failed to load products'
      ;(api.products.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText('Error loading products')).toBeInTheDocument()
        expect(screen.getByText('Please try again later')).toBeInTheDocument()
      })

      // Verify error is stored in state
      const productState = productStore.getState()
      expect(productState.error).toBe(errorMessage)
    })
  })

  describe('Product Filtering Flow', () => {
    beforeEach(() => {
      const mockResponse = mockApiResponse.paginated(mockProducts, 1, 12, 50)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)
    })

    it('should filter products by category', async () => {
      render(<ProductsPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Click on electronics category filter
      const electronicsFilter = screen.getByText('Electronics')
      fireEvent.click(electronicsFilter)

      // Verify API is called with category filter
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              category: 'electronics'
            })
          })
        )
      })

      // Verify store state is updated
      const productState = productStore.getState()
      expect(productState.filters.category).toBe('electronics')
    })

    it('should filter products by price range', async () => {
      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Set price range filter
      const minPriceInput = screen.getByLabelText('Min Price')
      const maxPriceInput = screen.getByLabelText('Max Price')
      const applyFilterButton = screen.getByText('Apply Filters')

      fireEvent.change(minPriceInput, { target: { value: '50' } })
      fireEvent.change(maxPriceInput, { target: { value: '200' } })
      fireEvent.click(applyFilterButton)

      // Verify API is called with price range filter
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              priceRange: [50, 200]
            })
          })
        )
      })
    })

    it('should filter products by rating', async () => {
      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Click on 4-star rating filter
      const ratingFilter = screen.getByTestId('rating-filter-4')
      fireEvent.click(ratingFilter)

      // Verify API is called with rating filter
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              rating: 4
            })
          })
        )
      })
    })

    it('should combine multiple filters', async () => {
      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Apply multiple filters
      const electronicsFilter = screen.getByText('Electronics')
      const inStockFilter = screen.getByLabelText('In Stock Only')
      const brandFilter = screen.getByLabelText('Brand')

      fireEvent.click(electronicsFilter)
      fireEvent.click(inStockFilter)
      fireEvent.change(brandFilter, { target: { value: 'Apple' } })

      const applyFilterButton = screen.getByText('Apply Filters')
      fireEvent.click(applyFilterButton)

      // Verify API is called with combined filters
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: {
              category: 'electronics',
              priceRange: [0, 1000],
              rating: 0,
              brand: 'Apple',
              inStock: true
            }
          })
        )
      })
    })

    it('should clear all filters', async () => {
      render(<ProductsPage />)

      // Apply some filters first
      const electronicsFilter = screen.getByText('Electronics')
      fireEvent.click(electronicsFilter)

      await waitFor(() => {
        expect(productStore.getState().filters.category).toBe('electronics')
      })

      // Clear filters
      const clearFiltersButton = screen.getByText('Clear Filters')
      fireEvent.click(clearFiltersButton)

      // Verify filters are reset
      await waitFor(() => {
        const productState = productStore.getState()
        expect(productState.filters).toEqual({
          category: '',
          priceRange: [0, 1000],
          rating: 0,
          brand: '',
          inStock: false
        })
      })
    })
  })

  describe('Product Sorting Flow', () => {
    beforeEach(() => {
      const mockResponse = mockApiResponse.paginated(mockProducts, 1, 12, 50)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)
    })

    it('should sort products by price', async () => {
      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Change sort option to price
      const sortSelect = screen.getByLabelText('Sort by')
      fireEvent.change(sortSelect, { target: { value: 'price' } })

      // Verify API is called with new sort option
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'price',
            sortOrder: 'asc'
          })
        )
      })
    })

    it('should toggle sort order', async () => {
      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Click sort order toggle
      const sortOrderButton = screen.getByLabelText('Toggle sort order')
      fireEvent.click(sortOrderButton)

      // Verify API is called with descending order
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            sortOrder: 'desc'
          })
        )
      })
    })
  })

  describe('Product Search Flow', () => {
    it('should search products by query', async () => {
      const searchQuery = 'laptop'
      const searchResults = [mockProduct]
      const mockResponse = mockApiResponse.paginated(searchResults, 1, 12, 1)
      ;(api.products.search as jest.Mock).mockResolvedValue(mockResponse)

      // Mock router with search query
      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: { q: searchQuery },
        pathname: '/search',
      })

      render(<SearchResultsPage />)

      // Verify search API is called
      await waitFor(() => {
        expect(api.products.search).toHaveBeenCalledWith(searchQuery, expect.any(Object))
      })

      // Verify search results are displayed
      await waitFor(() => {
        expect(screen.getByText(`Search results for \"${searchQuery}\"`)).toBeInTheDocument()
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      })

      // Verify store state is updated
      const productState = productStore.getState()
      expect(productState.searchQuery).toBe(searchQuery)
      expect(productState.products).toEqual(searchResults)
    })

    it('should handle empty search results', async () => {
      const searchQuery = 'nonexistent product'
      const mockResponse = mockApiResponse.paginated([], 1, 12, 0)
      ;(api.products.search as jest.Mock).mockResolvedValue(mockResponse)

      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: { q: searchQuery },
        pathname: '/search',
      })

      render(<SearchResultsPage />)

      await waitFor(() => {
        expect(screen.getByText(`No results found for \"${searchQuery}\"`)).toBeInTheDocument()
        expect(screen.getByText('Try different keywords or browse our categories')).toBeInTheDocument()
      })
    })

    it('should handle search errors', async () => {
      const searchQuery = 'laptop'
      const errorMessage = 'Search service unavailable'
      ;(api.products.search as jest.Mock).mockRejectedValue(new Error(errorMessage))

      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: { q: searchQuery },
        pathname: '/search',
      })

      render(<SearchResultsPage />)

      await waitFor(() => {
        expect(screen.getByText('Search error')).toBeInTheDocument()
        expect(screen.getByText('Please try again later')).toBeInTheDocument()
      })
    })
  })

  describe('Product Detail Flow', () => {
    it('should load and display product details', async () => {
      const productId = 'product-1'
      const mockResponse = mockApiResponse.success(mockProduct)
      ;(api.products.getById as jest.Mock).mockResolvedValue(mockResponse)

      // Mock router with product ID
      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: { id: productId },
        pathname: `/products/${productId}`,
      })

      render(<ProductDetailPage params={{ id: productId }} />)

      // Verify API is called with correct product ID
      await waitFor(() => {
        expect(api.products.getById).toHaveBeenCalledWith(productId)
      })

      // Verify product details are displayed
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
        expect(screen.getByText(mockProduct.description)).toBeInTheDocument()
        expect(screen.getByText(`$${mockProduct.price}`)).toBeInTheDocument()
        expect(screen.getByText(`${mockProduct.rating} stars`)).toBeInTheDocument()
      })

      // Verify store state is updated
      const productState = productStore.getState()
      expect(productState.currentProduct).toEqual(mockProduct)
    })

    it('should handle product not found', async () => {
      const productId = 'nonexistent-product'
      const errorMessage = 'Product not found'
      ;(api.products.getById as jest.Mock).mockRejectedValue(new Error(errorMessage))

      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: { id: productId },
        pathname: `/products/${productId}`,
      })

      render(<ProductDetailPage params={{ id: productId }} />)

      await waitFor(() => {
        expect(screen.getByText('Product not found')).toBeInTheDocument()
        expect(screen.getByText('The product you are looking for does not exist')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination Flow', () => {
    it('should navigate between pages', async () => {
      const mockResponse = mockApiResponse.paginated(mockProducts, 1, 12, 50)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      render(<ProductsPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Click next page
      const nextPageButton = screen.getByLabelText('Next page')
      fireEvent.click(nextPageButton)

      // Verify API is called for page 2
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2
          })
        )
      })
    })

    it('should update page size', async () => {
      const mockResponse = mockApiResponse.paginated(mockProducts, 1, 12, 50)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      render(<ProductsPage />)

      await waitFor(() => {
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument()
      })

      // Change page size
      const pageSizeSelect = screen.getByLabelText('Items per page')
      fireEvent.change(pageSizeSelect, { target: { value: '24' } })

      // Verify API is called with new page size
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 24,
            page: 1 // Should reset to first page
          })
        )
      })
    })
  })

  describe('Featured Products Flow', () => {
    it('should load featured products on homepage', async () => {
      const featuredProducts = mockProducts.filter(p => p.featured)
      const mockResponse = mockApiResponse.success(featuredProducts)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      // Simulate homepage loading featured products
      await productStore.getState().fetchFeaturedProducts()

      // Verify API is called for featured products
      expect(api.products.getAll).toHaveBeenCalledWith({
        featured: true,
        limit: 10
      })

      // Verify store state is updated
      const productState = productStore.getState()
      expect(productState.featuredProducts).toEqual(featuredProducts)
    })
  })
})