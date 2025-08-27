import notificationStore from '../notificationStore'
import { waitForAsyncAction } from '@/utils/testUtils'
import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('NotificationStore', () => {
  beforeEach(() => {
    // Reset store state
    notificationStore.getState().clearAll()
    
    // Clear all mocks
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = notificationStore.getState()
      
      expect(state.notifications).toEqual([])
      expect(state.unreadCount).toBe(0)
      expect(state.isOpen).toBe(false)
      expect(state.settings).toEqual({
        enableToast: true,
        enableInApp: true,
        enablePersistent: true,
        autoHideDelay: 5000,
        maxVisible: 5,
        position: 'top-right'
      })
    })
  })

  describe('Add Notification', () => {
    it('should add new notification with default values', () => {
      const message = 'Test notification'
      
      notificationStore.getState().addNotification(message)

      const state = notificationStore.getState()
      expect(state.notifications).toHaveLength(1)
      
      const notification = state.notifications[0]
      expect(notification.message).toBe(message)
      expect(notification.type).toBe('info')
      expect(notification.read).toBe(false)
      expect(notification.persistent).toBe(false)
      expect(notification.id).toBeDefined()
      expect(notification.timestamp).toBeInstanceOf(Date)
    })

    it('should add notification with custom properties', () => {
      const message = 'Error notification'
      const type = 'error'
      const title = 'Error Title'
      const persistent = true
      const actions = [{ label: 'Retry', action: jest.fn() }]

      notificationStore.getState().addNotification(message, {
        type,
        title,
        persistent,
        actions
      })

      const state = notificationStore.getState()
      const notification = state.notifications[0]
      
      expect(notification.message).toBe(message)
      expect(notification.type).toBe(type)
      expect(notification.title).toBe(title)
      expect(notification.persistent).toBe(persistent)
      expect(notification.actions).toEqual(actions)
    })

    it('should increment unread count', () => {
      notificationStore.getState().addNotification('First notification')
      notificationStore.getState().addNotification('Second notification')

      expect(notificationStore.getState().unreadCount).toBe(2)
    })

    it('should limit visible notifications based on maxVisible setting', () => {
      // Set max visible to 3
      notificationStore.getState().updateSettings({ maxVisible: 3 })

      // Add 5 notifications
      for (let i = 1; i <= 5; i++) {
        notificationStore.getState().addNotification(`Notification ${i}`)
      }

      const state = notificationStore.getState()
      expect(state.notifications).toHaveLength(5) // All stored
      
      const visibleNotifications = state.notifications.filter(n => !n.hidden)
      expect(visibleNotifications).toHaveLength(3) // Only 3 visible
    })
  })

  describe('Mark as Read', () => {
    it('should mark single notification as read', () => {
      notificationStore.getState().addNotification('Test notification')
      const notificationId = notificationStore.getState().notifications[0].id

      notificationStore.getState().markAsRead(notificationId)

      const state = notificationStore.getState()
      expect(state.notifications[0].read).toBe(true)
      expect(state.unreadCount).toBe(0)
    })

    it('should mark all notifications as read', () => {
      notificationStore.getState().addNotification('First notification')
      notificationStore.getState().addNotification('Second notification')
      notificationStore.getState().addNotification('Third notification')

      notificationStore.getState().markAllAsRead()

      const state = notificationStore.getState()
      expect(state.notifications.every(n => n.read)).toBe(true)
      expect(state.unreadCount).toBe(0)
    })

    it('should not affect already read notifications', () => {
      notificationStore.getState().addNotification('Test notification')
      const notificationId = notificationStore.getState().notifications[0].id

      // Mark as read twice
      notificationStore.getState().markAsRead(notificationId)
      notificationStore.getState().markAsRead(notificationId)

      const state = notificationStore.getState()
      expect(state.notifications[0].read).toBe(true)
      expect(state.unreadCount).toBe(0)
    })
  })

  describe('Remove Notification', () => {
    it('should remove single notification', () => {
      notificationStore.getState().addNotification('Test notification')
      const notificationId = notificationStore.getState().notifications[0].id

      notificationStore.getState().removeNotification(notificationId)

      const state = notificationStore.getState()
      expect(state.notifications).toHaveLength(0)
      expect(state.unreadCount).toBe(0)
    })

    it('should remove read notifications only', () => {
      notificationStore.getState().addNotification('Unread notification')
      notificationStore.getState().addNotification('Read notification')
      
      const notifications = notificationStore.getState().notifications
      notificationStore.getState().markAsRead(notifications[1].id)

      notificationStore.getState().removeRead()

      const state = notificationStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0].message).toBe('Unread notification')
    })

    it('should clear all notifications', () => {
      notificationStore.getState().addNotification('First notification')
      notificationStore.getState().addNotification('Second notification')

      notificationStore.getState().clearAll()

      const state = notificationStore.getState()
      expect(state.notifications).toEqual([])
      expect(state.unreadCount).toBe(0)
    })
  })

  describe('Panel State', () => {
    it('should toggle panel open/close', () => {
      expect(notificationStore.getState().isOpen).toBe(false)

      notificationStore.getState().togglePanel()
      expect(notificationStore.getState().isOpen).toBe(true)

      notificationStore.getState().togglePanel()
      expect(notificationStore.getState().isOpen).toBe(false)
    })

    it('should set panel open state', () => {
      notificationStore.getState().setOpen(true)
      expect(notificationStore.getState().isOpen).toBe(true)

      notificationStore.getState().setOpen(false)
      expect(notificationStore.getState().isOpen).toBe(false)
    })
  })

  describe('Settings Management', () => {
    it('should update notification settings', () => {
      const newSettings = {
        enableToast: false,
        autoHideDelay: 3000,
        maxVisible: 10,
        position: 'bottom-left' as const
      }

      notificationStore.getState().updateSettings(newSettings)

      const state = notificationStore.getState()
      expect(state.settings.enableToast).toBe(false)
      expect(state.settings.autoHideDelay).toBe(3000)
      expect(state.settings.maxVisible).toBe(10)
      expect(state.settings.position).toBe('bottom-left')
      
      // Should preserve other settings
      expect(state.settings.enableInApp).toBe(true)
      expect(state.settings.enablePersistent).toBe(true)
    })

    it('should save settings to localStorage', () => {
      const newSettings = { enableToast: false }
      
      notificationStore.getState().updateSettings(newSettings)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notificationSettings',
        expect.stringContaining('enableToast')
      )
    })
  })

  describe('Notification Types', () => {
    it('should add success notification', () => {
      notificationStore.getState().addSuccess('Success message')

      const notification = notificationStore.getState().notifications[0]
      expect(notification.type).toBe('success')
      expect(notification.message).toBe('Success message')
    })

    it('should add error notification', () => {
      notificationStore.getState().addError('Error message')

      const notification = notificationStore.getState().notifications[0]
      expect(notification.type).toBe('error')
      expect(notification.message).toBe('Error message')
    })

    it('should add warning notification', () => {
      notificationStore.getState().addWarning('Warning message')

      const notification = notificationStore.getState().notifications[0]
      expect(notification.type).toBe('warning')
      expect(notification.message).toBe('Warning message')
    })

    it('should add info notification', () => {
      notificationStore.getState().addInfo('Info message')

      const notification = notificationStore.getState().notifications[0]
      expect(notification.type).toBe('info')
      expect(notification.message).toBe('Info message')
    })
  })

  describe('Auto Hide Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should auto-hide non-persistent notifications', () => {
      notificationStore.getState().updateSettings({ autoHideDelay: 1000 })
      notificationStore.getState().addNotification('Auto-hide notification')

      const notificationId = notificationStore.getState().notifications[0].id

      // Fast-forward time
      jest.advanceTimersByTime(1000)

      const state = notificationStore.getState()
      expect(state.notifications.find(n => n.id === notificationId)).toBeUndefined()
    })

    it('should not auto-hide persistent notifications', () => {
      notificationStore.getState().updateSettings({ autoHideDelay: 1000 })
      notificationStore.getState().addNotification('Persistent notification', { persistent: true })

      const notificationId = notificationStore.getState().notifications[0].id

      // Fast-forward time
      jest.advanceTimersByTime(1000)

      const state = notificationStore.getState()
      expect(state.notifications.find(n => n.id === notificationId)).toBeDefined()
    })
  })

  describe('Notification Actions', () => {
    it('should execute notification action', () => {
      const mockAction = jest.fn()
      const actions = [{ label: 'Test Action', action: mockAction }]

      notificationStore.getState().addNotification('Test notification', { actions })
      const notificationId = notificationStore.getState().notifications[0].id

      notificationStore.getState().executeAction(notificationId, 0)

      expect(mockAction).toHaveBeenCalled()
    })

    it('should remove notification after action execution', () => {
      const mockAction = jest.fn()
      const actions = [{ label: 'Test Action', action: mockAction, removeAfter: true }]

      notificationStore.getState().addNotification('Test notification', { actions })
      const notificationId = notificationStore.getState().notifications[0].id

      notificationStore.getState().executeAction(notificationId, 0)

      const state = notificationStore.getState()
      expect(state.notifications.find(n => n.id === notificationId)).toBeUndefined()
    })
  })

  describe('Filtering and Sorting', () => {
    beforeEach(() => {
      // Add test notifications
      notificationStore.getState().addSuccess('Success message')
      notificationStore.getState().addError('Error message')
      notificationStore.getState().addWarning('Warning message')
      
      // Mark one as read
      const notifications = notificationStore.getState().notifications
      notificationStore.getState().markAsRead(notifications[0].id)
    })

    it('should get notifications by type', () => {
      const errorNotifications = notificationStore.getState().getByType('error')
      
      expect(errorNotifications).toHaveLength(1)
      expect(errorNotifications[0].type).toBe('error')
    })

    it('should get unread notifications', () => {
      const unreadNotifications = notificationStore.getState().getUnread()
      
      expect(unreadNotifications).toHaveLength(2)
      expect(unreadNotifications.every(n => !n.read)).toBe(true)
    })

    it('should get read notifications', () => {
      const readNotifications = notificationStore.getState().getRead()
      
      expect(readNotifications).toHaveLength(1)
      expect(readNotifications.every(n => n.read)).toBe(true)
    })

    it('should get recent notifications', () => {
      const recentNotifications = notificationStore.getState().getRecent(2)
      
      expect(recentNotifications).toHaveLength(2)
      // Should be sorted by timestamp (newest first)
      expect(recentNotifications[0].timestamp.getTime())
        .toBeGreaterThanOrEqual(recentNotifications[1].timestamp.getTime())
    })
  })

  describe('Persistence', () => {
    it('should save notifications to localStorage', () => {
      notificationStore.getState().addNotification('Persistent notification', { persistent: true })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notifications',
        expect.stringContaining('Persistent notification')
      )
    })

    it('should load notifications from localStorage on initialization', () => {
      const savedNotifications = [
        {
          id: 'notification-1',
          message: 'Saved notification',
          type: 'info',
          read: false,
          persistent: true,
          timestamp: new Date().toISOString()
        }
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedNotifications))

      // Simulate store initialization
      notificationStore.getState().loadFromStorage()

      const state = notificationStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0].message).toBe('Saved notification')
      expect(state.unreadCount).toBe(1)
    })

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      // Should not throw error
      notificationStore.getState().loadFromStorage()

      const state = notificationStore.getState()
      expect(state.notifications).toEqual([])
    })
  })
})