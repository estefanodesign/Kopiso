import useNotificationStore from '@/store/notificationStore'
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast,
  showOrderToast,
  showCartToast,
  showAuthToast,
  showNetworkErrorToast,
  showValidationErrorToast,
  showLoadingToast
} from '@/components/ui/CustomToast'

// Re-export toast functions for convenience
export {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showOrderToast,
  showCartToast,
  showAuthToast,
  showNetworkErrorToast,
  showValidationErrorToast,
  showLoadingToast
}

// Notification utility class
class NotificationService {
  private static instance: NotificationService
  private store: any = null

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private getStore() {
    if (!this.store) {
      this.store = useNotificationStore.getState()
    }
    return this.store
  }

  // Order notifications
  orderCreated(orderId: string, customerName?: string) {
    const store = this.getStore()
    store.showOrderNotification(orderId, 'pending', customerName)
    showOrderToast(orderId, 'created')
  }

  orderUpdated(orderId: string, status: string, customerName?: string) {
    const store = this.getStore()
    store.showOrderNotification(orderId, status, customerName)
    showOrderToast(orderId, 'updated')
  }

  orderCancelled(orderId: string, customerName?: string) {
    const store = this.getStore()
    store.showOrderNotification(orderId, 'cancelled', customerName)
    showOrderToast(orderId, 'cancelled')
  }

  // Cart notifications
  productAddedToCart(productName: string) {
    showCartToast(productName, 'added')
  }

  productRemovedFromCart(productName: string) {
    showCartToast(productName, 'removed')
  }

  cartUpdated() {
    showCartToast('', 'updated')
  }

  // Authentication notifications
  userLoggedIn() {
    showAuthToast('login')
  }

  userLoggedOut() {
    showAuthToast('logout')
  }

  userRegistered() {
    showAuthToast('register')
  }

  // System notifications
  systemMaintenance(message: string, scheduledTime?: Date) {
    const store = this.getStore()
    store.showSystemNotification(
      scheduledTime 
        ? `${message} Scheduled for ${scheduledTime.toLocaleDateString()}`
        : message,
      'warning'
    )
    showWarningToast(message, 'System Maintenance')
  }

  systemError(message: string) {
    const store = this.getStore()
    store.showSystemNotification(message, 'error')
    showErrorToast(message, 'System Error')
  }

  systemInfo(message: string) {
    const store = this.getStore()
    store.showSystemNotification(message, 'info')
    showInfoToast(message, 'System Update')
  }

  // Promotional notifications
  newPromotion(title: string, message: string, actionUrl?: string) {
    const store = this.getStore()
    store.showPromotionalNotification(title, message, actionUrl)
    showInfoToast(message, title, actionUrl ? {
      label: 'View Offer',
      onClick: () => window.location.href = actionUrl
    } : undefined)
  }

  // Inventory notifications
  lowStock(productName: string, stock: number) {
    const store = this.getStore()
    store.addNotification({
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${productName} has only ${stock} items left`,
      category: 'system',
      persistent: true
    })
    showWarningToast(`${productName} is running low (${stock} left)`, 'Low Stock')
  }

  outOfStock(productName: string) {
    const store = this.getStore()
    store.addNotification({
      type: 'error',
      title: 'Out of Stock',
      message: `${productName} is now out of stock`,
      category: 'system',
      persistent: true
    })
    showErrorToast(`${productName} is out of stock`, 'Inventory Alert')
  }

  // Payment notifications
  paymentSuccessful(orderId: string, amount: number) {
    showSuccessToast(
      `Payment of $${amount.toFixed(2)} processed successfully`,
      'Payment Confirmed',
      {
        label: 'View Order',
        onClick: () => window.location.href = `/orders/${orderId}`
      }
    )
  }

  paymentFailed(reason?: string) {
    showErrorToast(
      reason || 'Payment could not be processed. Please try again.',
      'Payment Failed'
    )
  }

  // Validation and form notifications
  formValidationErrors(errors: string[]) {
    showValidationErrorToast(errors)
  }

  formSaved(formName: string) {
    showSuccessToast(`${formName} saved successfully`)
  }

  // Network and loading notifications
  networkError() {
    showNetworkErrorToast()
  }

  async withLoading<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ): Promise<T> {
    return showLoadingToast(promise, messages)
  }

  // Bulk operations
  bulkOperationCompleted(operation: string, successCount: number, totalCount: number) {
    if (successCount === totalCount) {
      showSuccessToast(
        `${operation} completed successfully for all ${totalCount} items`,
        'Bulk Operation Complete'
      )
    } else {
      showWarningToast(
        `${operation} completed for ${successCount} of ${totalCount} items`,
        'Partial Success'
      )
    }
  }

  // User notifications
  profileUpdated() {
    showSuccessToast('Profile updated successfully')
  }

  passwordChanged() {
    showSuccessToast('Password changed successfully')
  }

  accountVerified() {
    showSuccessToast('Account verified successfully', 'Welcome!')
  }

  // Generic notifications
  success(message: string, title?: string) {
    showSuccessToast(message, title)
  }

  error(message: string, title?: string) {
    showErrorToast(message, title)
  }

  warning(message: string, title?: string) {
    showWarningToast(message, title)
  }

  info(message: string, title?: string) {
    showInfoToast(message, title)
  }

  // Persistent notification
  persistent(type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, options?: {
    category?: 'order' | 'system' | 'promotion' | 'account' | 'general'
    actionUrl?: string
    actionText?: string
  }) {
    const store = this.getStore()
    store.addNotification({
      type,
      title,
      message,
      persistent: true,
      category: options?.category || 'general',
      actionUrl: options?.actionUrl,
      actionText: options?.actionText
    })
  }
}

// Export singleton instance
export const notify = NotificationService.getInstance()

// Export utility functions for direct use
export const notifications = {
  // Direct store access
  get store() {
    return useNotificationStore.getState()
  },

  // Quick access methods
  success: (message: string, title?: string) => notify.success(message, title),
  error: (message: string, title?: string) => notify.error(message, title),
  warning: (message: string, title?: string) => notify.warning(message, title),
  info: (message: string, title?: string) => notify.info(message, title),
  
  // Specialized methods
  order: {
    created: (orderId: string, customerName?: string) => notify.orderCreated(orderId, customerName),
    updated: (orderId: string, status: string, customerName?: string) => notify.orderUpdated(orderId, status, customerName),
    cancelled: (orderId: string, customerName?: string) => notify.orderCancelled(orderId, customerName),
  },
  
  cart: {
    added: (productName: string) => notify.productAddedToCart(productName),
    removed: (productName: string) => notify.productRemovedFromCart(productName),
    updated: () => notify.cartUpdated(),
  },
  
  auth: {
    loggedIn: () => notify.userLoggedIn(),
    loggedOut: () => notify.userLoggedOut(),
    registered: () => notify.userRegistered(),
  },
  
  system: {
    maintenance: (message: string, scheduledTime?: Date) => notify.systemMaintenance(message, scheduledTime),
    error: (message: string) => notify.systemError(message),
    info: (message: string) => notify.systemInfo(message),
  },
  
  inventory: {
    lowStock: (productName: string, stock: number) => notify.lowStock(productName, stock),
    outOfStock: (productName: string) => notify.outOfStock(productName),
  },
  
  payment: {
    successful: (orderId: string, amount: number) => notify.paymentSuccessful(orderId, amount),
    failed: (reason?: string) => notify.paymentFailed(reason),
  },
  
  form: {
    validationErrors: (errors: string[]) => notify.formValidationErrors(errors),
    saved: (formName: string) => notify.formSaved(formName),
  },
  
  network: {
    error: () => notify.networkError(),
  },
  
  profile: {
    updated: () => notify.profileUpdated(),
    passwordChanged: () => notify.passwordChanged(),
    accountVerified: () => notify.accountVerified(),
  },

  bulk: {
    completed: (operation: string, successCount: number, totalCount: number) => 
      notify.bulkOperationCompleted(operation, successCount, totalCount),
  },

  withLoading: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
    notify.withLoading(promise, messages),
}