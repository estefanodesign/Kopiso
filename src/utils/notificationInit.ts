import useNotificationStore from '@/store/notificationStore'

// Initialize sample notifications for demonstration
export const initializeSampleNotifications = () => {
  const store = useNotificationStore.getState()
  
  // Only add sample notifications if none exist
  if (store.notifications.length === 0) {
    const sampleNotifications = [
      {
        type: 'info' as const,
        title: 'Welcome to Kopiso!',
        message: 'Your advanced notification system is now active. Click the bell icon to manage notifications.',
        category: 'system' as const,
        persistent: true,
        actionUrl: '/admin',
        actionText: 'Explore Dashboard'
      },
      {
        type: 'success' as const,
        title: 'Order Notification',
        message: 'New order #ORD-2024-001 received from John Smith',
        category: 'order' as const,
        persistent: true,
        actionUrl: '/admin/orders',
        actionText: 'View Orders'
      },
      {
        type: 'warning' as const,
        title: 'Low Stock Alert',
        message: 'iPhone 15 Pro has only 3 units remaining in inventory',
        category: 'system' as const,
        persistent: true,
        actionUrl: '/admin/products',
        actionText: 'Manage Inventory'
      },
      {
        type: 'info' as const,
        title: 'New User Registration',
        message: 'Sarah Johnson has created a new account',
        category: 'account' as const,
        persistent: true,
        actionUrl: '/admin/users',
        actionText: 'View Users'
      },
      {
        type: 'success' as const,
        title: 'Payment Processed',
        message: 'Payment of $299.99 successfully processed for order #ORD-2024-002',
        category: 'order' as const,
        persistent: true
      }
    ]

    // Add sample notifications with delay to simulate real-time updates
    sampleNotifications.forEach((notification, index) => {
      setTimeout(() => {
        store.addNotification(notification)
      }, index * 500) // Stagger notifications by 500ms
    })
  }
}

// Initialize notifications on page load for demo purposes
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add a small delay to ensure the store is ready
  setTimeout(() => {
    initializeSampleNotifications()
  }, 1000)
}

export default initializeSampleNotifications