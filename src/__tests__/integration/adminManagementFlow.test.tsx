import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import adminStore from '@/store/adminStore'
import authStore from '@/store/authStore'
import notificationStore from '@/store/notificationStore'
import { mockProducts, mockProduct, mockUser, mockAdmin, mockOrder, mockApiResponse } from '@/utils/testUtils'
import AdminDashboard from '@/app/admin/page'
import AdminProductsPage from '@/app/admin/products/page'
import AdminOrdersPage from '@/app/admin/orders/page'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock API client
jest.mock('@/utils/apiClient', () => ({
  api: {
    admin: {
      getAnalytics: jest.fn(),
      getUsers: jest.fn(),
      updateUser: jest.fn(),
    },
    products: {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orders: {
      getAll: jest.fn(),
      updateStatus: jest.fn(),
    }
  }
}))

import { api } from '@/utils/apiClient'

describe('Admin Management Flow Integration Tests', () => {
  const mockPush = jest.fn()
  const mockQuery = {}

  beforeEach(() => {
    // Reset stores
    adminStore.getState().reset()
    notificationStore.getState().clearAll()
    
    // Set up admin authentication
    authStore.setState({
      isAuthenticated: true,
      user: mockAdmin,
      token: 'admin-token',
    })
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: mockQuery,
      pathname: '/admin',
    })
  })

  describe('Admin Dashboard Flow', () => {
    it('should load and display admin dashboard with analytics', async () => {
      const mockAnalytics = {
        totalUsers: 150,
        totalProducts: 25,
        totalOrders: 89,
        totalRevenue: 12450.50,
        dailyRevenue: [
          { date: '2024-01-01', revenue: 1250 },
          { date: '2024-01-02', revenue: 1800 }
        ],
        topProducts: [mockProduct],
        recentOrders: [mockOrder],
        salesTrend: 'up' as const,
        conversionRate: 3.2,
        averageOrderValue: 140.25,
      }

      const mockResponse = mockApiResponse.success(mockAnalytics)
      ;(api.admin.getAnalytics as jest.Mock).mockResolvedValue(mockResponse)

      render(<AdminDashboard />)

      // Verify loading state
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument()

      // Wait for analytics to load
      await waitFor(() => {
        expect(api.admin.getAnalytics).toHaveBeenCalled()
      })

      // Verify analytics data is displayed
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument() // Total Users
        expect(screen.getByText('25')).toBeInTheDocument()  // Total Products
        expect(screen.getByText('89')).toBeInTheDocument()  // Total Orders
        expect(screen.getByText('$12,450.50')).toBeInTheDocument() // Total Revenue
      })

      // Verify charts and visualizations
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument()
      expect(screen.getByTestId('top-products-list')).toBeInTheDocument()
      expect(screen.getByTestId('recent-orders-list')).toBeInTheDocument()

      // Verify store state is updated
      const adminState = adminStore.getState()
      expect(adminState.analytics).toEqual(mockAnalytics)
    })

    it('should handle dashboard loading errors', async () => {
      const errorMessage = 'Failed to load analytics'
      ;(api.admin.getAnalytics as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Error loading dashboard')).toBeInTheDocument()
        expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument()
      })

      // Verify error notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'error' && n.message.includes('Failed to load analytics')
        )).toBe(true)
      })
    })

    it('should filter analytics by time period', async () => {
      const mockAnalytics = {
        totalUsers: 100,
        totalProducts: 20,
        totalOrders: 50,
        totalRevenue: 8000,
        dailyRevenue: [],
        topProducts: [],
        recentOrders: [],
        salesTrend: 'down' as const,
        conversionRate: 2.8,
        averageOrderValue: 160,
      }

      const mockResponse = mockApiResponse.success(mockAnalytics)
      ;(api.admin.getAnalytics as jest.Mock).mockResolvedValue(mockResponse)

      render(<AdminDashboard />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
      })

      // Change time period filter
      const periodSelect = screen.getByLabelText('Time Period')
      fireEvent.change(periodSelect, { target: { value: '7d' } })

      // Verify API is called with new period
      await waitFor(() => {
        expect(api.admin.getAnalytics).toHaveBeenCalledWith('7d')
      })

      // Verify updated data is displayed
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument() // Updated total users
      })
    })
  })

  describe('Admin Product Management Flow', () => {
    beforeEach(() => {
      const mockResponse = mockApiResponse.success(mockProducts)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: {},
        pathname: '/admin/products',
      })
    })

    it('should load and display products in admin view', async () => {
      render(<AdminProductsPage />)

      // Wait for products to load
      await waitFor(() => {
        expect(api.products.getAll).toHaveBeenCalled()
      })

      // Verify products are displayed in table format
      await waitFor(() => {
        mockProducts.forEach(product => {
          expect(screen.getByText(product.name)).toBeInTheDocument()
          expect(screen.getByText(`$${product.price}`)).toBeInTheDocument()
          expect(screen.getByText(product.category)).toBeInTheDocument()
        })
      })

      // Verify admin action buttons are present
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
      
      // Verify edit and delete buttons for each product
      mockProducts.forEach((_, index) => {
        expect(screen.getByTestId(`edit-product-${index}`)).toBeInTheDocument()
        expect(screen.getByTestId(`delete-product-${index}`)).toBeInTheDocument()
      })
    })

    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Test Product',
        description: 'A new product for testing',
        price: 199.99,
        category: 'electronics',
        brand: 'Test Brand',
        stock: 50,
      }

      const mockCreateResponse = mockApiResponse.success({ ...newProduct, id: 'new-product-id' })
      ;(api.products.create as jest.Mock).mockResolvedValue(mockCreateResponse)

      render(<AdminProductsPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument()
      })

      // Click add new product button
      const addButton = screen.getByText('Add New Product')
      fireEvent.click(addButton)

      // Fill product form
      await waitFor(() => {
        expect(screen.getByLabelText('Product Name')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Product Name'), { 
        target: { value: newProduct.name } 
      })
      fireEvent.change(screen.getByLabelText('Description'), { 
        target: { value: newProduct.description } 
      })
      fireEvent.change(screen.getByLabelText('Price'), { 
        target: { value: newProduct.price.toString() } 
      })
      fireEvent.change(screen.getByLabelText('Category'), { 
        target: { value: newProduct.category } 
      })
      fireEvent.change(screen.getByLabelText('Stock'), { 
        target: { value: newProduct.stock.toString() } 
      })

      // Submit form
      const saveButton = screen.getByText('Save Product')
      fireEvent.click(saveButton)

      // Verify API call
      await waitFor(() => {
        expect(api.products.create).toHaveBeenCalledWith(expect.objectContaining(newProduct))
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'success' && n.message.includes('created successfully')
        )).toBe(true)
      })

      // Verify product is added to store
      const adminState = adminStore.getState()
      expect(adminState.products.some(p => p.name === newProduct.name)).toBe(true)
    })

    it('should edit an existing product', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Product Name', price: 149.99 }
      const mockUpdateResponse = mockApiResponse.success(updatedProduct)
      ;(api.products.update as jest.Mock).mockResolvedValue(mockUpdateResponse)

      render(<AdminProductsPage />)

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      })

      // Click edit button for first product
      const editButton = screen.getByTestId('edit-product-0')
      fireEvent.click(editButton)

      // Wait for edit form to appear
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockProduct.name)).toBeInTheDocument()
      })

      // Update product name and price
      const nameInput = screen.getByDisplayValue(mockProduct.name)
      const priceInput = screen.getByDisplayValue(mockProduct.price.toString())

      fireEvent.change(nameInput, { target: { value: updatedProduct.name } })
      fireEvent.change(priceInput, { target: { value: updatedProduct.price.toString() } })

      // Save changes
      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Verify API call
      await waitFor(() => {
        expect(api.products.update).toHaveBeenCalledWith(
          mockProduct.id,
          expect.objectContaining({
            name: updatedProduct.name,
            price: updatedProduct.price
          })
        )
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'success' && n.message.includes('updated successfully')
        )).toBe(true)
      })
    })

    it('should delete a product', async () => {
      const mockDeleteResponse = mockApiResponse.success({ message: 'Product deleted' })
      ;(api.products.delete as jest.Mock).mockResolvedValue(mockDeleteResponse)

      render(<AdminProductsPage />)

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      })

      // Click delete button for first product
      const deleteButton = screen.getByTestId('delete-product-0')
      fireEvent.click(deleteButton)

      // Confirm deletion in modal
      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Verify API call
      await waitFor(() => {
        expect(api.products.delete).toHaveBeenCalledWith(mockProduct.id)
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'success' && n.message.includes('deleted successfully')
        )).toBe(true)
      })

      // Verify product is removed from view
      await waitFor(() => {
        expect(screen.queryByText(mockProduct.name)).not.toBeInTheDocument()
      })
    })
  })

  describe('Admin Order Management Flow', () => {
    const mockOrders = [mockOrder, { ...mockOrder, id: 'order-2', status: 'completed' }]

    beforeEach(() => {
      const mockResponse = mockApiResponse.success(mockOrders)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockResponse)

      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: {},
        pathname: '/admin/orders',
      })
    })

    it('should load and display orders in admin view', async () => {
      render(<AdminOrdersPage />)

      // Wait for orders to load
      await waitFor(() => {
        expect(api.orders.getAll).toHaveBeenCalled()
      })

      // Verify orders are displayed
      await waitFor(() => {
        mockOrders.forEach(order => {
          expect(screen.getByText(order.id)).toBeInTheDocument()
          expect(screen.getByText(`$${order.total}`)).toBeInTheDocument()
          expect(screen.getByText(order.status)).toBeInTheDocument()
        })
      })
    })

    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: 'processing' }
      const mockUpdateResponse = mockApiResponse.success(updatedOrder)
      ;(api.orders.updateStatus as jest.Mock).mockResolvedValue(mockUpdateResponse)

      render(<AdminOrdersPage />)

      // Wait for orders to load
      await waitFor(() => {
        expect(screen.getByText(mockOrder.id)).toBeInTheDocument()
      })

      // Find status dropdown for first order
      const statusSelect = screen.getByTestId(`status-select-${mockOrder.id}`)
      fireEvent.change(statusSelect, { target: { value: 'processing' } })

      // Verify API call
      await waitFor(() => {
        expect(api.orders.updateStatus).toHaveBeenCalledWith(mockOrder.id, 'processing')
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'success' && n.message.includes('status updated')
        )).toBe(true)
      })

      // Verify status is updated in UI
      await waitFor(() => {
        expect(screen.getByDisplayValue('processing')).toBeInTheDocument()
      })
    })

    it('should filter orders by status', async () => {
      const filteredOrders = mockOrders.filter(o => o.status === 'pending')
      const mockFilterResponse = mockApiResponse.success(filteredOrders)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockFilterResponse)

      render(<AdminOrdersPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockOrder.id)).toBeInTheDocument()
      })

      // Apply status filter
      const statusFilter = screen.getByLabelText('Filter by Status')
      fireEvent.change(statusFilter, { target: { value: 'pending' } })

      // Verify API is called with filter
      await waitFor(() => {
        expect(api.orders.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending'
          })
        )
      })

      // Verify filtered results
      await waitFor(() => {
        filteredOrders.forEach(order => {
          expect(screen.getByText(order.id)).toBeInTheDocument()
        })
      })
    })

    it('should search orders by customer or order ID', async () => {
      const searchQuery = 'john'
      const searchResults = [mockOrder]
      const mockSearchResponse = mockApiResponse.success(searchResults)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockSearchResponse)

      render(<AdminOrdersPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockOrder.id)).toBeInTheDocument()
      })

      // Enter search query
      const searchInput = screen.getByLabelText('Search Orders')
      fireEvent.change(searchInput, { target: { value: searchQuery } })

      // Trigger search
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)

      // Verify API is called with search query
      await waitFor(() => {
        expect(api.orders.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            search: searchQuery
          })
        )
      })
    })
  })

  describe('Admin Authentication Flow', () => {
    it('should redirect non-admin users', async () => {
      // Set up regular user authentication
      authStore.setState({
        isAuthenticated: true,
        user: mockUser, // Regular user, not admin
        token: 'user-token',
      })

      render(<AdminDashboard />)

      // Verify redirect to unauthorized page
      expect(mockPush).toHaveBeenCalledWith('/unauthorized')
    })

    it('should redirect unauthenticated users to login', async () => {
      // Set up unauthenticated state
      authStore.setState({
        isAuthenticated: false,
        user: null,
        token: null,
      })

      render(<AdminDashboard />)

      // Verify redirect to login
      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/admin')
    })
  })

  describe('Admin Error Handling Flow', () => {
    it('should handle product management errors gracefully', async () => {
      const errorMessage = 'Failed to create product'
      ;(api.products.create as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<AdminProductsPage />)

      // Try to create a product (assuming form is opened)
      const addButton = screen.getByText('Add New Product')
      fireEvent.click(addButton)

      // Fill and submit form
      await waitFor(() => {
        fireEvent.change(screen.getByLabelText('Product Name'), { 
          target: { value: 'Test Product' } 
        })
      })

      const saveButton = screen.getByText('Save Product')
      fireEvent.click(saveButton)

      // Verify error notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'error' && n.message.includes(errorMessage)
        )).toBe(true)
      })
    })

    it('should handle order status update errors', async () => {
      const errorMessage = 'Failed to update order status'
      ;(api.orders.updateStatus as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<AdminOrdersPage />)

      // Wait for orders to load
      await waitFor(() => {
        expect(screen.getByText(mockOrder.id)).toBeInTheDocument()
      })

      // Try to update status
      const statusSelect = screen.getByTestId(`status-select-${mockOrder.id}`)
      fireEvent.change(statusSelect, { target: { value: 'processing' } })

      // Verify error notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'error' && n.message.includes('Failed to update order status')
        )).toBe(true)
      })
    })
  })
})