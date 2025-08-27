'use client'

import { toast } from 'react-hot-toast'
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  X,
  ExternalLink 
} from 'lucide-react'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface CustomToastProps {
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  action?: ToastAction
  onDismiss?: () => void
}

const ToastComponent = ({ 
  type, 
  title, 
  message, 
  action, 
  onDismiss,
  toastId 
}: CustomToastProps & { toastId: string }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500'
      case 'error':
        return 'border-l-red-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'info':
      default:
        return 'border-l-blue-500'
    }
  }

  const handleDismiss = () => {
    toast.dismiss(toastId)
    onDismiss?.()
  }

  return (
    <div className={`bg-white border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 max-w-md`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-gray-700">
            {message}
          </p>
          
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {action.label}
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}

// Enhanced toast functions
export const showCustomToast = (props: CustomToastProps) => {
  return toast.custom((t) => (
    <ToastComponent {...props} toastId={t.id} />
  ), {
    duration: 5000,
    position: 'top-right',
  })
}

export const showSuccessToast = (message: string, title?: string, action?: ToastAction) => {
  return showCustomToast({
    type: 'success',
    title,
    message,
    action
  })
}

export const showErrorToast = (message: string, title?: string, action?: ToastAction) => {
  return showCustomToast({
    type: 'error',
    title,
    message,
    action
  })
}

export const showInfoToast = (message: string, title?: string, action?: ToastAction) => {
  return showCustomToast({
    type: 'info',
    title,
    message,
    action
  })
}

export const showWarningToast = (message: string, title?: string, action?: ToastAction) => {
  return showCustomToast({
    type: 'warning',
    title,
    message,
    action
  })
}

// Specialized toast functions for common use cases
export const showOrderToast = (orderId: string, action: 'created' | 'updated' | 'cancelled') => {
  const messages = {
    created: 'Order placed successfully!',
    updated: 'Order updated successfully',
    cancelled: 'Order cancelled'
  }

  const type = action === 'cancelled' ? 'warning' : 'success'
  
  return showCustomToast({
    type,
    title: 'Order Notification',
    message: messages[action],
    action: {
      label: 'View Order',
      onClick: () => window.location.href = `/orders/${orderId}`
    }
  })
}

export const showCartToast = (productName: string, action: 'added' | 'removed' | 'updated') => {
  const messages = {
    added: `${productName} added to cart`,
    removed: `${productName} removed from cart`,
    updated: `Cart updated`
  }

  return showCustomToast({
    type: action === 'removed' ? 'info' : 'success',
    message: messages[action],
    action: {
      label: 'View Cart',
      onClick: () => {
        // This will trigger the cart sidebar
        const event = new CustomEvent('toggle-cart')
        window.dispatchEvent(event)
      }
    }
  })
}

export const showAuthToast = (action: 'login' | 'logout' | 'register') => {
  const messages = {
    login: 'Welcome back!',
    logout: 'You have been logged out',
    register: 'Account created successfully!'
  }

  return showCustomToast({
    type: 'success',
    message: messages[action]
  })
}

export const showNetworkErrorToast = () => {
  return showCustomToast({
    type: 'error',
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
    action: {
      label: 'Retry',
      onClick: () => window.location.reload()
    }
  })
}

export const showValidationErrorToast = (errors: string[]) => {
  return showCustomToast({
    type: 'error',
    title: 'Validation Error',
    message: errors.length > 1 
      ? `${errors.length} validation errors found`
      : errors[0]
  })
}

// Batch operations toasts
export const showBatchOperationToast = (
  operation: string, 
  count: number, 
  success: boolean = true
) => {
  return showCustomToast({
    type: success ? 'success' : 'error',
    title: 'Batch Operation',
    message: success 
      ? `${operation} completed for ${count} items`
      : `${operation} failed for some items`
  })
}

// Loading toast with promise
export const showLoadingToast = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string
    error: string
  }
): Promise<T> => {
  return toast.promise(promise, messages, {
    style: {
      minWidth: '250px',
    },
    success: {
      duration: 3000,
    },
    error: {
      duration: 4000,
    },
  })
}