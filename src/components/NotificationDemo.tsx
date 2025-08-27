'use client'

import React, { useState } from 'react'
import { notifications } from '@/utils/notifications'
import { Bell, TestTube, Package, User, Settings, ShoppingCart } from 'lucide-react'

export default function NotificationDemo() {
  const [isVisible, setIsVisible] = useState(false)

  const demoNotifications = [
    {
      title: 'Success Toast',
      action: () => notifications.success('This is a success message!', 'Great Job!')
    },
    {
      title: 'Error Toast',
      action: () => notifications.error('Something went wrong', 'Error Occurred')
    },
    {
      title: 'Warning Toast',
      action: () => notifications.warning('Please check your settings', 'Warning')
    },
    {
      title: 'Info Toast',
      action: () => notifications.info("Here's some helpful information", 'Info')
    },
    {
      title: 'Order Created',
      action: () => notifications.order.created('ORD-12345', 'John Doe')
    },
    {
      title: 'Order Updated',
      action: () => notifications.order.updated('ORD-12345', 'shipped', 'Jane Smith')
    },
    {
      title: 'Order Cancelled',
      action: () => notifications.order.cancelled('ORD-12345', 'Bob Johnson')
    },
    {
      title: 'Product Added to Cart',
      action: () => notifications.cart.added('Wireless Headphones')
    },
    {
      title: 'Product Removed from Cart',
      action: () => notifications.cart.removed('Gaming Mouse')
    },
    {
      title: 'Cart Updated',
      action: () => notifications.cart.updated()
    },
    {
      title: 'User Logged In',
      action: () => notifications.auth.loggedIn()
    },
    {
      title: 'User Logged Out',
      action: () => notifications.auth.loggedOut()
    },
    {
      title: 'User Registered',
      action: () => notifications.auth.registered()
    },
    {
      title: 'System Maintenance',
      action: () => notifications.system.maintenance('System will be down for maintenance', new Date(Date.now() + 24 * 60 * 60 * 1000))
    },
    {
      title: 'System Error',
      action: () => notifications.system.error('Database connection failed')
    },
    {
      title: 'System Info',
      action: () => notifications.system.info('New features have been added')
    },
    {
      title: 'Low Stock Alert',
      action: () => notifications.inventory.lowStock('iPhone 15 Pro', 3)
    },
    {
      title: 'Out of Stock',
      action: () => notifications.inventory.outOfStock('MacBook Air')
    },
    {
      title: 'Payment Successful',
      action: () => notifications.payment.successful('ORD-67890', 299.99)
    },
    {
      title: 'Payment Failed',
      action: () => notifications.payment.failed('Insufficient funds')
    },
    {
      title: 'Profile Updated',
      action: () => notifications.profile.updated()
    },
    {
      title: 'Password Changed',
      action: () => notifications.profile.passwordChanged()
    },
    {
      title: 'Validation Errors',
      action: () => notifications.form.validationErrors(['Email is required', 'Password too short', 'Phone number invalid'])
    },
    {
      title: 'Form Saved',
      action: () => notifications.form.saved('User Profile')
    },
    {
      title: 'Network Error',
      action: () => notifications.network.error()
    },
    {
      title: 'Bulk Operation',
      action: () => notifications.bulk.completed('Status update', 8, 10)
    },
    {
      title: 'Loading with Promise',
      action: () => {
        const promise = new Promise((resolve, reject) => {
          setTimeout(() => {
            Math.random() > 0.5 ? resolve('Success!') : reject('Failed!')
          }, 2000)
        })
        
        notifications.withLoading(promise, {
          loading: 'Processing your request...',
          success: 'Request completed successfully!',
          error: 'Request failed. Please try again.'
        })
      }
    }
  ]

  const categoryIcons: Record<string, any> = {
    order: Package,
    cart: ShoppingCart,
    auth: User,
    system: Settings,
    general: Bell
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Notification Demo"
      >
        <TestTube className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TestTube className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notification System Demo</h2>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Test all notification types and see how they work. Click any button below to trigger a notification.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoNotifications.map((demo, index) => {
              const category = demo.title.toLowerCase().includes('order') ? 'order' :
                              demo.title.toLowerCase().includes('cart') ? 'cart' :
                              demo.title.toLowerCase().includes('user') || demo.title.toLowerCase().includes('auth') ? 'auth' :
                              demo.title.toLowerCase().includes('system') || demo.title.toLowerCase().includes('error') ? 'system' :
                              'general'
              
              const IconComponent = categoryIcons[category]
              
              return (
                <button
                  key={index}
                  onClick={demo.action}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {demo.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to test this notification
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>💡 <strong>Tips:</strong></p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Check the notification panel (bell icon) for persistent notifications</li>
                <li>• Toast notifications appear temporarily and auto-dismiss</li>
                <li>• Admin notifications include order updates and system alerts</li>
              </ul>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}