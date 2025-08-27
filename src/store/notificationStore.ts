import { create } from 'zustand'
import { toast } from 'react-hot-toast'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  persistent?: boolean
  actionUrl?: string
  actionText?: string
  category?: 'order' | 'system' | 'promotion' | 'account' | 'general'
  userId?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  filter: 'all' | 'unread' | 'order' | 'system' | 'promotion' | 'account'
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAllNotifications: () => void
  togglePanel: () => void
  setFilter: (filter: NotificationState['filter']) => void
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, options?: {
    duration?: number
    persistent?: boolean
    action?: { text: string; onClick: () => void }
  }) => void
  showOrderNotification: (orderId: string, status: string, customerName?: string) => void
  showSystemNotification: (message: string, level: 'info' | 'warning' | 'error') => void
  showPromotionalNotification: (title: string, message: string, actionUrl?: string) => void
  loadNotifications: () => Promise<void>
  saveNotifications: () => void
}

type NotificationStore = NotificationState & NotificationActions

const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  filter: 'all',

  // Actions
  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    set(state => {
      const newNotifications = [notification, ...state.notifications].slice(0, 100) // Keep only 100 latest
      const unreadCount = newNotifications.filter(n => !n.read).length
      
      // Save to localStorage
      localStorage.setItem('kopiso_notifications', JSON.stringify(newNotifications))
      
      return {
        notifications: newNotifications,
        unreadCount
      }
    })

    // Show toast for non-persistent notifications
    if (!notificationData.persistent) {
      get().showToast(notificationData.type, notificationData.message)
    }
  },

  markAsRead: (id) => {
    set(state => {
      const updatedNotifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      const unreadCount = updatedNotifications.filter(n => !n.read).length
      
      // Save to localStorage
      localStorage.setItem('kopiso_notifications', JSON.stringify(updatedNotifications))
      
      return {
        notifications: updatedNotifications,
        unreadCount
      }
    })
  },

  markAllAsRead: () => {
    set(state => {
      const updatedNotifications = state.notifications.map(n => ({ ...n, read: true }))
      
      // Save to localStorage
      localStorage.setItem('kopiso_notifications', JSON.stringify(updatedNotifications))
      
      return {
        notifications: updatedNotifications,
        unreadCount: 0
      }
    })
  },

  deleteNotification: (id) => {
    set(state => {
      const updatedNotifications = state.notifications.filter(n => n.id !== id)
      const unreadCount = updatedNotifications.filter(n => !n.read).length
      
      // Save to localStorage
      localStorage.setItem('kopiso_notifications', JSON.stringify(updatedNotifications))
      
      return {
        notifications: updatedNotifications,
        unreadCount
      }
    })
  },

  clearAllNotifications: () => {
    localStorage.removeItem('kopiso_notifications')
    set({
      notifications: [],
      unreadCount: 0
    })
  },

  togglePanel: () => {
    set(state => ({ isOpen: !state.isOpen }))
  },

  setFilter: (filter) => {
    set({ filter })
  },

  showToast: (type, message, options = {}) => {
    const toastOptions = {
      duration: options.duration || 4000,
      position: 'top-right' as const,
    }

    switch (type) {
      case 'success':
        toast.success(message, toastOptions)
        break
      case 'error':
        toast.error(message, toastOptions)
        break
      case 'warning':
        toast(message, {
          ...toastOptions,
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        })
        break
      case 'info':
        toast(message, {
          ...toastOptions,
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff',
          },
        })
        break
    }

    // Handle action separately if provided
    if (options.action) {
      toast.success(`${message} - ${options.action.text}`, {
        ...toastOptions,
        duration: 6000,
        onClick: () => options.action!.onClick()
      })
    }
  },

  showOrderNotification: (orderId, status, customerName) => {
    const statusMessages = {
      pending: 'New order received',
      confirmed: 'Order confirmed',
      processing: 'Order is being processed',
      shipped: 'Order has been shipped',
      delivered: 'Order delivered successfully',
      cancelled: 'Order was cancelled',
    }

    const message = customerName 
      ? `${statusMessages[status as keyof typeof statusMessages]} for ${customerName}`
      : statusMessages[status as keyof typeof statusMessages] || `Order status updated to ${status}`

    get().addNotification({
      type: status === 'cancelled' ? 'error' : status === 'delivered' ? 'success' : 'info',
      title: 'Order Update',
      message,
      category: 'order',
      actionUrl: `/admin/orders/${orderId}`,
      actionText: 'View Order',
      persistent: true
    })
  },

  showSystemNotification: (message, level) => {
    get().addNotification({
      type: level,
      title: 'System Notification',
      message,
      category: 'system',
      persistent: true
    })
  },

  showPromotionalNotification: (title, message, actionUrl) => {
    get().addNotification({
      type: 'info',
      title,
      message,
      category: 'promotion',
      actionUrl,
      actionText: 'Learn More',
      persistent: true
    })
  },

  loadNotifications: async () => {
    try {
      const stored = localStorage.getItem('kopiso_notifications')
      if (stored) {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
        const unreadCount = notifications.filter((n: Notification) => !n.read).length
        
        set({
          notifications,
          unreadCount
        })
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  },

  saveNotifications: () => {
    const { notifications } = get()
    localStorage.setItem('kopiso_notifications', JSON.stringify(notifications))
  },
}))

export default useNotificationStore