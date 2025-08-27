import cartStore from '../cartStore'
import { mockProduct, mockCartItem, mockApiResponse, waitForAsyncAction } from '@/utils/testUtils'
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

// Mock notifications
jest.mock('@/utils/notifications', () => ({
  notifications: {
    success: jest.fn(),
    error: jest.fn(),
    cart: {
      added: jest.fn(),
      removed: jest.fn(),
      updated: jest.fn(),
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

import { notifications } from '@/utils/notifications'

describe('CartStore', () => {
  beforeEach(() => {
    // Reset store state
    cartStore.getState().clearCart()
    
    // Clear all mocks
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = cartStore.getState()
      
      expect(state.items).toEqual([])
      expect(state.total).toBe(0)
      expect(state.itemCount).toBe(0)
      expect(state.isOpen).toBe(false)
    })
  })

  describe('Add to Cart', () => {
    it('should add new item to cart', () => {
      const productId = 'product-1'
      const quantity = 2
      const selectedVariant = { color: 'Black' }

      cartStore.getState().addToCart(productId, quantity, selectedVariant)

      const state = cartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]).toEqual({
        productId,
        quantity,
        selectedVariant,
        addedAt: expect.any(Date)
      })
      expect(state.itemCount).toBe(2)
      expect(notifications.cart.added).toHaveBeenCalledWith(productId, quantity)
    })

    it('should increase quantity for existing item with same variant', () => {
      const productId = 'product-1'
      const selectedVariant = { color: 'Black' }

      // Add item first
      cartStore.getState().addToCart(productId, 1, selectedVariant)
      // Add same item again
      cartStore.getState().addToCart(productId, 2, selectedVariant)

      const state = cartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(3)
      expect(state.itemCount).toBe(3)
    })

    it('should add separate item for different variant', () => {
      const productId = 'product-1'

      cartStore.getState().addToCart(productId, 1, { color: 'Black' })
      cartStore.getState().addToCart(productId, 1, { color: 'White' })

      const state = cartStore.getState()
      expect(state.items).toHaveLength(2)
      expect(state.itemCount).toBe(2)
    })

    it('should handle adding item without variant', () => {
      const productId = 'product-1'
      const quantity = 1

      cartStore.getState().addToCart(productId, quantity)

      const state = cartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].selectedVariant).toBeUndefined()
    })
  })

  describe('Remove from Cart', () => {
    it('should remove item completely', () => {
      const productId = 'product-1'
      const selectedVariant = { color: 'Black' }

      // Add item first
      cartStore.getState().addToCart(productId, 2, selectedVariant)
      
      // Remove item
      cartStore.getState().removeFromCart(productId, selectedVariant)

      const state = cartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.itemCount).toBe(0)
      expect(notifications.cart.removed).toHaveBeenCalledWith(productId)
    })

    it('should not remove item if variant does not match', () => {
      const productId = 'product-1'

      // Add item with black color
      cartStore.getState().addToCart(productId, 2, { color: 'Black' })
      
      // Try to remove item with white color
      cartStore.getState().removeFromCart(productId, { color: 'White' })

      const state = cartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.itemCount).toBe(2)
    })

    it('should handle removing item without variant', () => {
      const productId = 'product-1'

      // Add item without variant
      cartStore.getState().addToCart(productId, 1)
      
      // Remove item without variant
      cartStore.getState().removeFromCart(productId)

      const state = cartStore.getState()
      expect(state.items).toHaveLength(0)
    })
  })

  describe('Update Quantity', () => {
    it('should update item quantity', () => {
      const productId = 'product-1'
      const selectedVariant = { color: 'Black' }

      // Add item first
      cartStore.getState().addToCart(productId, 2, selectedVariant)
      
      // Update quantity
      cartStore.getState().updateQuantity(productId, 5, selectedVariant)

      const state = cartStore.getState()
      expect(state.items[0].quantity).toBe(5)
      expect(state.itemCount).toBe(5)
      expect(notifications.cart.updated).toHaveBeenCalledWith(productId, 5)
    })

    it('should remove item if quantity is 0', () => {
      const productId = 'product-1'
      const selectedVariant = { color: 'Black' }

      // Add item first
      cartStore.getState().addToCart(productId, 2, selectedVariant)
      
      // Update quantity to 0
      cartStore.getState().updateQuantity(productId, 0, selectedVariant)

      const state = cartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.itemCount).toBe(0)
      expect(notifications.cart.removed).toHaveBeenCalledWith(productId)
    })

    it('should not update if item not found', () => {
      const productId = 'product-1'

      cartStore.getState().updateQuantity(productId, 5)

      const state = cartStore.getState()
      expect(state.items).toHaveLength(0)
    })
  })

  describe('Clear Cart', () => {
    it('should clear all items from cart', () => {
      // Add some items first
      cartStore.getState().addToCart('product-1', 2)
      cartStore.getState().addToCart('product-2', 1)

      // Clear cart
      cartStore.getState().clearCart()

      const state = cartStore.getState()
      expect(state.items).toEqual([])
      expect(state.total).toBe(0)
      expect(state.itemCount).toBe(0)
    })
  })

  describe('Cart UI State', () => {
    it('should toggle cart open/close', () => {
      expect(cartStore.getState().isOpen).toBe(false)

      cartStore.getState().toggleCart()
      expect(cartStore.getState().isOpen).toBe(true)

      cartStore.getState().toggleCart()
      expect(cartStore.getState().isOpen).toBe(false)
    })

    it('should set cart open state', () => {
      cartStore.getState().setCartOpen(true)
      expect(cartStore.getState().isOpen).toBe(true)

      cartStore.getState().setCartOpen(false)
      expect(cartStore.getState().isOpen).toBe(false)
    })
  })

  describe('Total Calculation', () => {
    it('should calculate total from items', () => {
      // Mock products in cart with prices
      const items = [
        { productId: 'product-1', quantity: 2, price: 50 },
        { productId: 'product-2', quantity: 1, price: 30 }
      ]

      cartStore.setState({ 
        items: items as any,
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      })

      const state = cartStore.getState()
      expect(state.total).toBe(130) // (50 * 2) + (30 * 1)
    })
  })

  describe('Item Count Calculation', () => {
    it('should calculate total item count', () => {
      cartStore.getState().addToCart('product-1', 2)
      cartStore.getState().addToCart('product-2', 3)
      cartStore.getState().addToCart('product-3', 1)

      const state = cartStore.getState()
      expect(state.itemCount).toBe(6) // 2 + 3 + 1
    })
  })

  describe('Get Item', () => {
    it('should get item from cart', () => {
      const productId = 'product-1'
      const selectedVariant = { color: 'Black' }

      cartStore.getState().addToCart(productId, 2, selectedVariant)

      const item = cartStore.getState().getItem(productId, selectedVariant)
      
      expect(item).toBeDefined()
      expect(item?.productId).toBe(productId)
      expect(item?.quantity).toBe(2)
      expect(item?.selectedVariant).toEqual(selectedVariant)
    })

    it('should return undefined if item not found', () => {
      const item = cartStore.getState().getItem('non-existent')
      expect(item).toBeUndefined()
    })
  })

  describe('Local Storage Integration', () => {
    it('should save cart to localStorage on changes', () => {
      cartStore.getState().addToCart('product-1', 2)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cart',
        expect.stringContaining('product-1')
      )
    })

    it('should load cart from localStorage on initialization', () => {
      const savedCart = [
        {
          productId: 'product-1',
          quantity: 2,
          selectedVariant: { color: 'Black' },
          addedAt: new Date().toISOString()
        }
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedCart))

      // Simulate store initialization
      cartStore.getState().loadFromStorage()

      const state = cartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].productId).toBe('product-1')
      expect(state.itemCount).toBe(2)
    })

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      // Should not throw error
      cartStore.getState().loadFromStorage()

      const state = cartStore.getState()
      expect(state.items).toEqual([])
    })
  })

  describe('Variant Comparison', () => {
    it('should correctly compare variants', () => {
      const variant1 = { color: 'Black', size: 'M' }
      const variant2 = { color: 'Black', size: 'M' }
      const variant3 = { color: 'White', size: 'M' }

      cartStore.getState().addToCart('product-1', 1, variant1)
      cartStore.getState().addToCart('product-1', 1, variant2) // Should update existing
      cartStore.getState().addToCart('product-1', 1, variant3) // Should add new

      const state = cartStore.getState()
      expect(state.items).toHaveLength(2) // One for each unique variant
      expect(state.items.find(item => 
        item.selectedVariant?.color === 'Black'
      )?.quantity).toBe(2)
      expect(state.items.find(item => 
        item.selectedVariant?.color === 'White'
      )?.quantity).toBe(1)
    })
  })
})