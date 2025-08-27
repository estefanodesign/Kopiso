'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  Filter,
  MoreHorizontal,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Package,
  Settings,
  Tag,
  User,
  Clock
} from 'lucide-react'
import useNotificationStore from '@/store/notificationStore'
import { formatDistanceToNow } from 'date-fns'

interface NotificationPanelProps {
  className?: string
}

export default function NotificationPanel({ className = '' }: NotificationPanelProps) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isOpen,
    filter,
    togglePanel,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loadNotifications
  } = useNotificationStore()

  const [showActions, setShowActions] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (isOpen) togglePanel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, togglePanel])

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read
      case 'order':
        return notification.category === 'order'
      case 'system':
        return notification.category === 'system'
      case 'promotion':
        return notification.category === 'promotion'
      case 'account':
        return notification.category === 'account'
      default:
        return true
    }
  })

  const getNotificationIcon = (type: string, category?: string) => {
    if (category) {
      switch (category) {
        case 'order':
          return Package
        case 'system':
          return Settings
        case 'promotion':
          return Tag
        case 'account':
          return User
      }
    }

    switch (type) {
      case 'success':
        return CheckCircle
      case 'error':
        return AlertCircle
      case 'warning':
        return AlertTriangle
      case 'info':
      default:
        return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
      default:
        return 'text-blue-600'
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      togglePanel()
      router.push(notification.actionUrl)
    }
  }

  const filterOptions = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'order', label: 'Orders', count: notifications.filter(n => n.category === 'order').length },
    { key: 'system', label: 'System', count: notifications.filter(n => n.category === 'system').length },
    { key: 'promotion', label: 'Promotions', count: notifications.filter(n => n.category === 'promotion').length },
  ]

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        onClick={togglePanel}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={togglePanel}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {filterOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => setFilter(option.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filter === option.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === option.key ? 'bg-gray-100' : 'bg-gray-200'
                    }`}>
                      {option.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map(notification => {
                  const IconComponent = getNotificationIcon(notification.type, notification.category)
                  const iconColor = getNotificationColor(notification.type)
                  
                  return (
                    <div
                      key={notification.id}
                      className={`relative p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      } ${notification.actionUrl ? 'cursor-pointer' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Notification Content */}
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 ${iconColor}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {/* Action Button */}
                              {notification.actionUrl && notification.actionText && (
                                <button className="inline-flex items-center mt-2 text-xs text-blue-600 hover:text-blue-700 transition-colors">
                                  <span>{notification.actionText}</span>
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </button>
                              )}
                            </div>

                            {/* Actions Menu */}
                            <div className="relative ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowActions(showActions === notification.id ? null : notification.id)
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <MoreHorizontal className="h-4 w-4 text-gray-400" />
                              </button>

                              {showActions === notification.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  {!notification.read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsRead(notification.id)
                                        setShowActions(null)
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Check className="h-4 w-4" />
                                      <span>Mark as read</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                      setShowActions(null)
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  clearAllNotifications()
                  togglePanel()
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}