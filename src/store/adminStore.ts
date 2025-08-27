import { create } from 'zustand'
import { DashboardStats, Order, User, Product, Transaction, SalesData } from '@/types'

interface AdminState {
  stats: DashboardStats | null
  dashboardStats: DashboardStats | null
  recentOrders: Order[]
  users: User[]
  products: Product[]
  orders: Order[]
  transactions: Transaction[]
  salesData: SalesData[]
  isLoading: boolean
  error: string | null
  notifications: Array<{
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: string
    read: boolean
  }>
}

interface AdminActions {
  fetchDashboardStats: () => Promise<void>
  fetchRecentOrders: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchAllProducts: () => Promise<void>
  fetchAllOrders: () => Promise<void>
  fetchTransactions: () => Promise<void>
  fetchSalesData: (period: string) => Promise<void>
  
  // User management
  updateUserRole: (userId: string, role: 'customer' | 'admin') => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  
  // Product management
  createProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>
  updateProduct: (productId: string, productData: Partial<Product>) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  
  // Order management
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  addOrderNote: (orderId: string, note: string) => Promise<void>
  
  // Transaction management
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
  deleteTransaction: (transactionId: string) => Promise<void>
  
  // Notifications
  addNotification: (notification: Omit<AdminState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (notificationId: string) => void
  clearNotifications: () => void
  
  // Utility
  clearError: () => void
  setLoading: (loading: boolean) => void
}

type AdminStore = AdminState & AdminActions

const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  stats: null,
  dashboardStats: null,
  recentOrders: [],
  users: [],
  products: [],
  orders: [],
  transactions: [],
  salesData: [],
  isLoading: false,
  error: null,
  notifications: [],

  // Actions
  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }

      const data = await response.json()

      if (data.success) {
        set({
          stats: data.data,
          dashboardStats: data.data,
          isLoading: false,
        })
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard stats')
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
        isLoading: false,
      })
    }
  },

  fetchRecentOrders: async () => {
    try {
      const response = await fetch('/api/admin/orders?limit=10&sort=createdAt:desc', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          set({ recentOrders: data.data })
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent orders:', error)
    }
  },

  fetchUsers: async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          set({ users: data.data })
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  },

  fetchAllProducts: async () => {
    try {
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          set({ products: data.data })
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  },

  fetchAllOrders: async () => {
    try {
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          set({ orders: data.data })
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  },

  fetchTransactions: async () => {
    try {
      const response = await fetch('/api/admin/accounting/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          set({ transactions: data.data })
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  },

  fetchSalesData: async (period: string) => {
    try {
      const response = await fetch(`/api/admin/analytics/sales?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          set({ salesData: data.data })
        }
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error)
    }
  },

  updateUserRole: async (userId: string, role: 'customer' | 'admin') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        const updatedUsers = get().users.map(user =>
          user.id === userId ? { ...user, role } : user
        )
        set({ users: updatedUsers })
        
        get().addNotification({
          type: 'success',
          title: 'User Updated',
          message: `User role updated to ${role}`,
        })
      }
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update user role',
      })
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const updatedUsers = get().users.filter(user => user.id !== userId)
        set({ users: updatedUsers })
        
        get().addNotification({
          type: 'success',
          title: 'User Deleted',
          message: 'User has been successfully deleted',
        })
      }
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete user',
      })
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (data.success) {
        await get().fetchAllProducts() // Refresh products list
        get().addNotification({
          type: 'success',
          title: 'Product Created',
          message: 'Product has been successfully created',
        })
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      return { success: false, message: 'Failed to create product' }
    }
  },

  updateProduct: async (productId: string, productData: Partial<Product>) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        await get().fetchAllProducts() // Refresh products list
        get().addNotification({
          type: 'success',
          title: 'Product Updated',
          message: 'Product has been successfully updated',
        })
      }
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update product',
      })
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        await get().fetchAllProducts() // Refresh products list
        get().addNotification({
          type: 'success',
          title: 'Product Deleted',
          message: 'Product has been successfully deleted',
        })
      }
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete product',
      })
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const updatedOrders = get().orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
        set({ orders: updatedOrders })
        
        get().addNotification({
          type: 'success',
          title: 'Order Updated',
          message: `Order status updated to ${status}`,
        })
      }
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update order status',
      })
    }
  },

  addOrderNote: async (orderId: string, note: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ note }),
      })

      if (response.ok) {
        await get().fetchAllOrders() // Refresh orders list
      }
    } catch (error) {
      console.error('Failed to add order note:', error)
    }
  },

  addTransaction: async (transactionData) => {
    try {
      const response = await fetch('/api/admin/accounting/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(transactionData),
      })

      if (response.ok) {
        await get().fetchTransactions() // Refresh transactions list
        get().addNotification({
          type: 'success',
          title: 'Transaction Added',
          message: 'Transaction has been successfully recorded',
        })
      }
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: 'Failed to add transaction',
      })
    }
  },

  deleteTransaction: async (transactionId: string) => {
    try {
      const response = await fetch(`/api/admin/accounting/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const updatedTransactions = get().transactions.filter(
          transaction => transaction.id !== transactionId
        )
        set({ transactions: updatedTransactions })
        
        get().addNotification({
          type: 'success',
          title: 'Transaction Deleted',
          message: 'Transaction has been successfully deleted',
        })
      }
    } catch (error) {
      get().addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete transaction',
      })
    }
  },

  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    }
    
    set(state => ({
      notifications: [newNotification, ...state.notifications],
    }))
  },

  markNotificationRead: (notificationId: string) => {
    const updatedNotifications = get().notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    )
    set({ notifications: updatedNotifications })
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  clearError: () => {
    set({ error: null })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
}))

export default useAdminStore