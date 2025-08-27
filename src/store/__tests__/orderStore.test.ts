import orderStore from '../orderStore'
import { mockOrder, mockApiResponse, mockUser, waitForAsyncAction } from '@/utils/testUtils'
import '@testing-library/jest-dom'

// Mock the API client
jest.mock('@/utils/apiClient', () => ({
  api: {
    orders: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
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
    info: jest.fn(),
  }
}))

import { api } from '@/utils/apiClient'
import { notifications } from '@/utils/notifications'

describe('OrderStore', () => {
  beforeEach(() => {
    // Reset store state
    orderStore.getState().reset()
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = orderStore.getState()
      
      expect(state.orders).toEqual([])
      expect(state.currentOrder).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.orderHistory).toEqual([])
      expect(state.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      })
    })
  })

  describe('Fetch Orders', () => {
    it('should fetch orders successfully', async () => {
      const mockOrders = [mockOrder]
      const mockResponse = mockApiResponse.paginated(mockOrders, 1, 10, 1)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await orderStore.getState().fetchOrders()

      expect(api.orders.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      })

      const state = orderStore.getState()
      expect(state.orders).toEqual(mockOrders)
      expect(state.pagination.total).toBe(1)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch orders error', async () => {
      const errorMessage = 'Failed to fetch orders'
      ;(api.orders.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await orderStore.getState().fetchOrders()

      const state = orderStore.getState()
      expect(state.orders).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      ;(api.orders.getAll as jest.Mock).mockReturnValue(promise)

      const fetchPromise = orderStore.getState().fetchOrders()
      
      // Check loading state
      expect(orderStore.getState().loading).toBe(true)

      // Resolve the promise
      resolvePromise!(mockApiResponse.paginated([mockOrder]))
      await fetchPromise

      expect(orderStore.getState().loading).toBe(false)
    })

    it('should fetch orders with custom pagination', async () => {
      const mockResponse = mockApiResponse.paginated([mockOrder], 2, 5, 20)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await orderStore.getState().fetchOrders(2, 5)

      expect(api.orders.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5
      })

      const state = orderStore.getState()
      expect(state.pagination.page).toBe(2)
      expect(state.pagination.limit).toBe(5)
      expect(state.pagination.total).toBe(20)
      expect(state.pagination.totalPages).toBe(4)
    })
  })

  describe('Fetch Order by ID', () => {
    it('should fetch order by ID successfully', async () => {
      const mockResponse = mockApiResponse.success(mockOrder)
      ;(api.orders.getById as jest.Mock).mockResolvedValue(mockResponse)

      await orderStore.getState().fetchOrderById('order-1')

      expect(api.orders.getById).toHaveBeenCalledWith('order-1')

      const state = orderStore.getState()
      expect(state.currentOrder).toEqual(mockOrder)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle fetch order by ID error', async () => {
      const errorMessage = 'Order not found'
      ;(api.orders.getById as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await orderStore.getState().fetchOrderById('invalid-id')

      const state = orderStore.getState()
      expect(state.currentOrder).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Create Order', () => {
    const newOrderData = {
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          price: 50,
          selectedVariant: { color: 'Black' }
        }
      ],
      shippingAddress: mockUser.addresses![0],
      billingAddress: mockUser.addresses![0],
      paymentMethod: 'credit_card',
      notes: 'Test order'
    }

    it('should create order successfully', async () => {
      const createdOrder = { ...mockOrder, ...newOrderData }
      const mockResponse = mockApiResponse.success(createdOrder)
      ;(api.orders.create as jest.Mock).mockResolvedValue(mockResponse)

      const result = await orderStore.getState().createOrder(newOrderData)

      expect(api.orders.create).toHaveBeenCalledWith(newOrderData)
      expect(result).toBe(true)

      const state = orderStore.getState()
      expect(state.orders).toContain(createdOrder)
      expect(state.currentOrder).toEqual(createdOrder)
      expect(notifications.success).toHaveBeenCalledWith('Order created successfully!')
    })

    it('should handle create order error', async () => {
      const errorMessage = 'Failed to create order'
      ;(api.orders.create as jest.Mock).mockRejectedValue(new Error(errorMessage))

      const result = await orderStore.getState().createOrder(newOrderData)

      expect(result).toBe(false)
      expect(orderStore.getState().error).toBe(errorMessage)
      expect(notifications.error).toHaveBeenCalledWith('Failed to create order')
    })

    it('should set loading state during order creation', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      ;(api.orders.create as jest.Mock).mockReturnValue(promise)

      const createPromise = orderStore.getState().createOrder(newOrderData)
      
      // Check loading state
      expect(orderStore.getState().loading).toBe(true)

      // Resolve the promise
      resolvePromise!(mockApiResponse.success(mockOrder))
      await createPromise

      expect(orderStore.getState().loading).toBe(false)
    })
  })

  describe('Update Order Status', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = { ...mockOrder, status: 'processing' }
      const mockResponse = mockApiResponse.success(updatedOrder)
      ;(api.orders.updateStatus as jest.Mock).mockResolvedValue(mockResponse)

      // Set initial orders
      orderStore.setState({ 
        orders: [mockOrder],
        currentOrder: mockOrder
      })

      const result = await orderStore.getState().updateOrderStatus('order-1', 'processing')

      expect(api.orders.updateStatus).toHaveBeenCalledWith('order-1', 'processing')
      expect(result).toBe(true)

      const state = orderStore.getState()
      expect(state.orders[0].status).toBe('processing')
      expect(state.currentOrder?.status).toBe('processing')
      expect(notifications.success).toHaveBeenCalledWith('Order status updated successfully!')
    })

    it('should handle update order status error', async () => {
      const errorMessage = 'Failed to update order status'
      ;(api.orders.updateStatus as jest.Mock).mockRejectedValue(new Error(errorMessage))

      const result = await orderStore.getState().updateOrderStatus('order-1', 'processing')

      expect(result).toBe(false)
      expect(orderStore.getState().error).toBe(errorMessage)
      expect(notifications.error).toHaveBeenCalledWith('Failed to update order status')
    })

    it('should not update if order not found in store', async () => {
      const mockResponse = mockApiResponse.success(mockOrder)
      ;(api.orders.updateStatus as jest.Mock).mockResolvedValue(mockResponse)

      // Empty orders array
      orderStore.setState({ orders: [] })

      const result = await orderStore.getState().updateOrderStatus('order-1', 'processing')

      expect(result).toBe(true) // API call still succeeds
      expect(orderStore.getState().orders).toHaveLength(0) // But local state unchanged
    })
  })

  describe('Order History', () => {
    it('should fetch user order history successfully', async () => {
      const orderHistory = [mockOrder]
      const mockResponse = mockApiResponse.success(orderHistory)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await orderStore.getState().fetchOrderHistory('user-1')

      expect(api.orders.getAll).toHaveBeenCalledWith({
        userId: 'user-1',
        limit: 50
      })

      const state = orderStore.getState()
      expect(state.orderHistory).toEqual(orderHistory)
      expect(state.loading).toBe(false)
    })

    it('should handle fetch order history error', async () => {
      const errorMessage = 'Failed to fetch order history'
      ;(api.orders.getAll as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await orderStore.getState().fetchOrderHistory('user-1')

      const state = orderStore.getState()
      expect(state.orderHistory).toEqual([])
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Clear Functions', () => {
    it('should clear current order', () => {
      // Set a current order first
      orderStore.setState({ currentOrder: mockOrder })
      
      orderStore.getState().clearCurrentOrder()

      expect(orderStore.getState().currentOrder).toBeNull()
    })

    it('should clear error', () => {
      // Set an error first
      orderStore.setState({ error: 'Some error' })
      
      orderStore.getState().clearError()

      expect(orderStore.getState().error).toBeNull()
    })

    it('should reset store to initial state', () => {
      // Modify state
      orderStore.setState({
        orders: [mockOrder],
        currentOrder: mockOrder,
        orderHistory: [mockOrder],
        error: 'some error',
        loading: true
      })

      orderStore.getState().reset()

      const state = orderStore.getState()
      expect(state.orders).toEqual([])
      expect(state.currentOrder).toBeNull()
      expect(state.orderHistory).toEqual([])
      expect(state.error).toBeNull()
      expect(state.loading).toBe(false)
    })
  })

  describe('Pagination', () => {
    it('should set pagination correctly', () => {
      const newPagination = {
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5
      }

      orderStore.getState().setPagination(newPagination)

      expect(orderStore.getState().pagination).toEqual(newPagination)
    })
  })

  describe('Order Filtering and Sorting', () => {
    it('should fetch orders with status filter', async () => {
      const mockResponse = mockApiResponse.paginated([mockOrder], 1, 10, 5)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await orderStore.getState().fetchOrdersByStatus('pending')

      expect(api.orders.getAll).toHaveBeenCalledWith({
        status: 'pending',
        page: 1,
        limit: 10
      })

      const state = orderStore.getState()
      expect(state.orders).toEqual([mockOrder])
    })

    it('should fetch orders within date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const mockResponse = mockApiResponse.paginated([mockOrder], 1, 10, 3)
      ;(api.orders.getAll as jest.Mock).mockResolvedValue(mockResponse)

      await orderStore.getState().fetchOrdersByDateRange(startDate, endDate)

      expect(api.orders.getAll).toHaveBeenCalledWith({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page: 1,
        limit: 10
      })

      const state = orderStore.getState()
      expect(state.orders).toEqual([mockOrder])
    })
  })

  describe('Order Statistics', () => {
    it('should calculate order statistics correctly', () => {
      const orders = [
        { ...mockOrder, status: 'pending', total: 100 },
        { ...mockOrder, id: 'order-2', status: 'completed', total: 200 },
        { ...mockOrder, id: 'order-3', status: 'completed', total: 150 },
        { ...mockOrder, id: 'order-4', status: 'cancelled', total: 75 }
      ]

      orderStore.setState({ orders: orders as any })

      const stats = orderStore.getState().getOrderStats()

      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(1)
      expect(stats.completed).toBe(2)
      expect(stats.cancelled).toBe(1)
      expect(stats.totalRevenue).toBe(525) // 100 + 200 + 150 + 75
      expect(stats.completedRevenue).toBe(350) // 200 + 150
    })

    it('should return zero stats for empty orders', () => {
      orderStore.setState({ orders: [] })

      const stats = orderStore.getState().getOrderStats()

      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.cancelled).toBe(0)
      expect(stats.totalRevenue).toBe(0)
      expect(stats.completedRevenue).toBe(0)
    })
  })
})