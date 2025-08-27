import { create } from 'zustand'
import { Order, CheckoutForm, OrderItem, Address, PaymentMethod } from '@/types'

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  checkoutData: Partial<CheckoutForm>
}

interface OrderActions {
  fetchOrders: () => Promise<void>
  fetchUserOrders: () => Promise<void>
  fetchOrderById: (id: string) => Promise<Order | null>
  createOrder: (orderData: {
    items: OrderItem[]
    shippingAddress: Address
    paymentMethod: PaymentMethod
    notes?: string
  }) => Promise<{ success: boolean; orderId?: string; message?: string }>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  setCurrentOrder: (order: Order | null) => void
  updateCheckoutData: (data: Partial<CheckoutForm>) => void
  clearCheckoutData: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

type OrderStore = OrderState & OrderActions

const useOrderStore = create<OrderStore>((set, get) => ({
  // Initial state
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  checkoutData: {},

  // Actions
  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()

      if (data.success) {
        set({
          orders: data.data,
          isLoading: false,
        })
      } else {
        throw new Error(data.message || 'Failed to fetch orders')
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false,
      })
    }
  },

  fetchUserOrders: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch('/api/orders/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user orders')
      }

      const data = await response.json()

      if (data.success) {
        set({
          orders: data.data,
          isLoading: false,
        })
      } else {
        throw new Error(data.message || 'Failed to fetch user orders')
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user orders',
        isLoading: false,
      })
    }
  },

  fetchOrderById: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Order not found')
      }

      const data = await response.json()

      if (data.success) {
        set({
          currentOrder: data.data,
          isLoading: false,
        })
        return data.data
      } else {
        throw new Error(data.message || 'Order not found')
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch order',
        isLoading: false,
      })
      return null
    }
  },

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh orders list
        await get().fetchOrders()
        
        set({
          isLoading: false,
          currentOrder: data.data,
        })

        return {
          success: true,
          orderId: data.data.id,
          message: 'Order created successfully',
        }
      } else {
        set({
          error: data.message || 'Failed to create order',
          isLoading: false,
        })
        return {
          success: false,
          message: data.message || 'Failed to create order',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return {
        success: false,
        message: errorMessage,
      }
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      const data = await response.json()

      if (data.success) {
        // Update orders in state
        const updatedOrders = get().orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
        set({ orders: updatedOrders })

        // Update current order if it matches
        const currentOrder = get().currentOrder
        if (currentOrder && currentOrder.id === orderId) {
          set({ currentOrder: { ...currentOrder, status } })
        }
      } else {
        throw new Error(data.message || 'Failed to update order status')
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update order status',
      })
    }
  },

  setCurrentOrder: (order: Order | null) => {
    set({ currentOrder: order })
  },

  updateCheckoutData: (data: Partial<CheckoutForm>) => {
    const currentData = get().checkoutData
    set({
      checkoutData: { ...currentData, ...data },
    })
  },

  clearCheckoutData: () => {
    set({ checkoutData: {} })
  },

  clearError: () => {
    set({ error: null })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
}))

export default useOrderStore