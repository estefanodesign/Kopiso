import adminStore from '../adminStore'
import { mockUser, mockProduct, mockOrder, mockApiResponse, waitForAsyncAction } from '@/utils/testUtils'
import '@testing-library/jest-dom'

// Mock the API client
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
    info: jest.fn(),
  }
}))

import { api } from '@/utils/apiClient'
import { notifications } from '@/utils/notifications'

describe('AdminStore', () => {
  beforeEach(() => {
    // Reset store state
    adminStore.getState().reset()
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = adminStore.getState()
      
      expect(state.analytics).toEqual({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        dailyRevenue: [],
        topProducts: [],
        recentOrders: [],
        salesTrend: 'up',
        conversionRate: 0,
        averageOrderValue: 0,
      })
      expect(state.users).toEqual([])
      expect(state.products).toEqual([])
      expect(state.orders).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.currentView).toBe('dashboard')
    })
  })

  describe('Analytics', () => {
    it('should fetch analytics successfully', async () => {
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

      await adminStore.getState().fetchAnalytics()

      expect(api.admin.getAnalytics).toHaveBeenCalled()

      const state = adminStore.getState()
      expect(state.analytics).toEqual(mockAnalytics)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch analytics error', async () => {
      const errorMessage = 'Failed to fetch analytics'
      ;(api.admin.getAnalytics as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await adminStore.getState().fetchAnalytics()

      const state = adminStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
      expect(notifications.error).toHaveBeenCalledWith('Failed to load analytics data')
    })

    it('should fetch analytics with custom period', async () => {
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

      await adminStore.getState().fetchAnalytics('7d')

      expect(api.admin.getAnalytics).toHaveBeenCalledWith('7d')
      expect(adminStore.getState().analytics.totalUsers).toBe(100)
    })
  })

  describe('User Management', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [mockUser]
      const mockResponse = mockApiResponse.success(mockUsers)
      ;(api.admin.getUsers as jest.Mock).mockResolvedValue(mockResponse)

      await adminStore.getState().fetchUsers()

      expect(api.admin.getUsers).toHaveBeenCalled()

      const state = adminStore.getState()
      expect(state.users).toEqual(mockUsers)
      expect(state.loading).toBe(false)
    })

    it('should handle fetch users error', async () => {
      const errorMessage = 'Failed to fetch users'
      ;(api.admin.getUsers as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await adminStore.getState().fetchUsers()

      const state = adminStore.getState()
      expect(state.users).toEqual([])
      expect(state.error).toBe(errorMessage)
    })

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' }
      const mockResponse = mockApiResponse.success(updatedUser)
      ;(api.admin.updateUser as jest.Mock).mockResolvedValue(mockResponse)

      // Set initial users
      adminStore.setState({ users: [mockUser] })

      const result = await adminStore.getState().updateUser('user-1', { name: 'Updated Name' })

      expect(api.admin.updateUser).toHaveBeenCalledWith('user-1', { name: 'Updated Name' })
      expect(result).toBe(true)

      const state = adminStore.getState()
      expect(state.users[0]).toEqual(updatedUser)
      expect(notifications.success).toHaveBeenCalledWith('User updated successfully')
    })

    it('should handle update user error', async () => {
      const errorMessage = 'Failed to update user'
      ;(api.admin.updateUser as jest.Mock).mockRejectedValue(new Error(errorMessage))

      const result = await adminStore.getState().updateUser('user-1', { name: 'Updated Name' })

      expect(result).toBe(false)
      expect(adminStore.getState().error).toBe(errorMessage)
      expect(notifications.error).toHaveBeenCalledWith('Failed to update user')
    })
  })

  describe('Product Management', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [mockProduct]
      const mockResponse = mockApiResponse.success(mockProducts)
      ;(api.products.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await adminStore.getState().fetchProducts()

      expect(api.products.getAll).toHaveBeenCalled()

      const state = adminStore.getState()
      expect(state.products).toEqual(mockProducts)
      expect(state.loading).toBe(false)
    })

    it('should create product successfully', async () => {
      const newProduct = { ...mockProduct, id: 'new-product', name: 'New Product' }
      const mockResponse = mockApiResponse.success(newProduct)
      ;(api.products.create as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminStore.getState().createProduct(newProduct)

      expect(api.products.create).toHaveBeenCalledWith(newProduct)
      expect(result).toBe(true)

      const state = adminStore.getState()
      expect(state.products).toContain(newProduct)
      expect(notifications.success).toHaveBeenCalledWith('Product created successfully')
    })

    it('should update product successfully', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Product' }
      const mockResponse = mockApiResponse.success(updatedProduct)
      ;(api.products.update as jest.Mock).mockResolvedValue(mockResponse)

      // Set initial products
      adminStore.setState({ products: [mockProduct] })

      const result = await adminStore.getState().updateProduct('product-1', updatedProduct)

      expect(api.products.update).toHaveBeenCalledWith('product-1', updatedProduct)
      expect(result).toBe(true)

      const state = adminStore.getState()
      expect(state.products[0]).toEqual(updatedProduct)
      expect(notifications.success).toHaveBeenCalledWith('Product updated successfully')
    })

    it('should delete product successfully', async () => {
      const mockResponse = mockApiResponse.success({ message: 'Product deleted' })
      ;(api.products.delete as jest.Mock).mockResolvedValue(mockResponse)

      // Set initial products
      adminStore.setState({ products: [mockProduct] })

      const result = await adminStore.getState().deleteProduct('product-1')

      expect(api.products.delete).toHaveBeenCalledWith('product-1')
      expect(result).toBe(true)

      const state = adminStore.getState()
      expect(state.products).toHaveLength(0)
      expect(notifications.success).toHaveBeenCalledWith('Product deleted successfully')
    })
  })

  describe('Order Management', () => {
    it('should fetch orders successfully', async () => {
      const mockOrders = [mockOrder]
      const mockResponse = mockApiResponse.success(mockOrders)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await adminStore.getState().fetchOrders()

      expect(api.orders.getAll).toHaveBeenCalled()

      const state = adminStore.getState()
      expect(state.orders).toEqual(mockOrders)
      expect(state.loading).toBe(false)
    })

    it('should update order status successfully', async () => {
      const updatedOrder = { ...mockOrder, status: 'processing' }
      const mockResponse = mockApiResponse.success(updatedOrder)
      ;(api.orders.updateStatus as jest.Mock).mockResolvedValue(mockResponse)

      // Set initial orders
      adminStore.setState({ orders: [mockOrder] })

      const result = await adminStore.getState().updateOrderStatus('order-1', 'processing')

      expect(api.orders.updateStatus).toHaveBeenCalledWith('order-1', 'processing')
      expect(result).toBe(true)

      const state = adminStore.getState()
      expect(state.orders[0].status).toBe('processing')
      expect(notifications.success).toHaveBeenCalledWith('Order status updated successfully')
    })

    it('should handle update order status error', async () => {
      const errorMessage = 'Failed to update order status'
      ;(api.orders.updateStatus as jest.Mock).mockRejectedValue(new Error(errorMessage))

      const result = await adminStore.getState().updateOrderStatus('order-1', 'processing')

      expect(result).toBe(false)
      expect(adminStore.getState().error).toBe(errorMessage)
      expect(notifications.error).toHaveBeenCalledWith('Failed to update order status')
    })
  })

  describe('View Management', () => {
    it('should set current view', () => {
      adminStore.getState().setCurrentView('users')
      expect(adminStore.getState().currentView).toBe('users')

      adminStore.getState().setCurrentView('products')
      expect(adminStore.getState().currentView).toBe('products')

      adminStore.getState().setCurrentView('orders')
      expect(adminStore.getState().currentView).toBe('orders')
    })
  })

  describe('Error and Loading Management', () => {
    it('should set loading state', () => {
      adminStore.getState().setLoading(true)
      expect(adminStore.getState().loading).toBe(true)

      adminStore.getState().setLoading(false)
      expect(adminStore.getState().loading).toBe(false)
    })

    it('should clear error', () => {
      // Set an error first
      adminStore.setState({ error: 'Some error' })
      
      adminStore.getState().clearError()
      expect(adminStore.getState().error).toBeNull()
    })

    it('should reset store to initial state', () => {
      // Modify state
      adminStore.setState({
        users: [mockUser],
        products: [mockProduct],
        orders: [mockOrder],
        error: 'some error',
        loading: true,
        currentView: 'users'
      })

      adminStore.getState().reset()

      const state = adminStore.getState()
      expect(state.users).toEqual([])
      expect(state.products).toEqual([])
      expect(state.orders).toEqual([])
      expect(state.error).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.currentView).toBe('dashboard')
    })
  })

  describe('Statistics and Calculations', () => {
    it('should calculate admin statistics correctly', () => {
      const users = [mockUser, { ...mockUser, id: 'user-2' }]
      const products = [mockProduct, { ...mockProduct, id: 'product-2' }]
      const orders = [
        { ...mockOrder, status: 'pending', total: 100 },
        { ...mockOrder, id: 'order-2', status: 'completed', total: 200 },
        { ...mockOrder, id: 'order-3', status: 'completed', total: 150 },
      ]

      adminStore.setState({ users, products, orders: orders as any })

      const stats = adminStore.getState().getAdminStats()

      expect(stats.totalUsers).toBe(2)
      expect(stats.totalProducts).toBe(2)
      expect(stats.totalOrders).toBe(3)
      expect(stats.completedOrders).toBe(2)
      expect(stats.pendingOrders).toBe(1)
      expect(stats.totalRevenue).toBe(450) // 100 + 200 + 150
      expect(stats.completedRevenue).toBe(350) // 200 + 150
    })

    it('should return zero stats for empty data', () => {
      adminStore.setState({ users: [], products: [], orders: [] })

      const stats = adminStore.getState().getAdminStats()

      expect(stats.totalUsers).toBe(0)
      expect(stats.totalProducts).toBe(0)
      expect(stats.totalOrders).toBe(0)
      expect(stats.completedOrders).toBe(0)
      expect(stats.pendingOrders).toBe(0)
      expect(stats.totalRevenue).toBe(0)
      expect(stats.completedRevenue).toBe(0)
    })
  })

  describe('Loading States', () => {
    it('should set loading state during fetch operations', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      ;(api.admin.getAnalytics as jest.Mock).mockReturnValue(promise)

      const fetchPromise = adminStore.getState().fetchAnalytics()
      
      // Check loading state
      expect(adminStore.getState().loading).toBe(true)

      // Resolve the promise
      resolvePromise!(mockApiResponse.success({}))
      await fetchPromise

      expect(adminStore.getState().loading).toBe(false)
    })
  })
})