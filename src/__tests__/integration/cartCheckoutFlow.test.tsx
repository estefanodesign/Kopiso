import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import cartStore from '@/store/cartStore'
import orderStore from '@/store/orderStore'
import authStore from '@/store/authStore'
import notificationStore from '@/store/notificationStore'
import { mockProducts, mockProduct, mockUser, mockApiResponse, mockOrder } from '@/utils/testUtils'
import CartPage from '@/app/cart/page'
import CheckoutPage from '@/app/checkout/page'
import ProductDetailPage from '@/app/products/[id]/page'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock API client
jest.mock('@/utils/apiClient', () => ({
  api: {
    products: {
      getById: jest.fn(),
    },
    orders: {
      create: jest.fn(),
    }
  }
}))

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

import { api } from '@/utils/apiClient'

describe('Cart Management and Checkout Integration Tests', () => {
  const mockPush = jest.fn()
  const mockQuery = {}

  beforeEach(() => {
    // Reset stores
    cartStore.getState().clearCart()
    orderStore.getState().reset()
    notificationStore.getState().clearAll()
    
    // Reset mocks
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: mockQuery,
      pathname: '/cart',
    })
  })

  describe('Add to Cart Flow', () => {
    beforeEach(() => {
      const mockResponse = mockApiResponse.success(mockProduct)
      ;(api.products.getById as jest.Mock).mockResolvedValue(mockResponse)
    })

    it('should add product to cart from product detail page', async () => {
      const productId = 'product-1'
      
      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: { id: productId },
        pathname: `/products/${productId}`,
      })

      render(<ProductDetailPage params={{ id: productId }} />)

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      })

      // Select quantity
      const quantityInput = screen.getByLabelText('Quantity')
      fireEvent.change(quantityInput, { target: { value: '2' } })

      // Select variant (if available)
      if (mockProduct.variants && mockProduct.variants.length > 0) {
        const colorSelect = screen.getByLabelText('Color')
        fireEvent.change(colorSelect, { target: { value: 'Black' } })
      }

      // Add to cart
      const addToCartButton = screen.getByText('Add to Cart')
      fireEvent.click(addToCartButton)

      // Verify product is added to cart store
      await waitFor(() => {
        const cartState = cartStore.getState()
        expect(cartState.items).toHaveLength(1)
        expect(cartState.items[0].productId).toBe(productId)
        expect(cartState.items[0].quantity).toBe(2)
        if (mockProduct.variants) {
          expect(cartState.items[0].selectedVariant).toEqual({ color: 'Black' })
        }
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'success' && n.message.includes('added to cart')
        )).toBe(true)
      })

      // Verify cart persistence to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cart',
        expect.stringContaining(productId)
      )
    })

    it('should handle adding out of stock product', async () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 }
      const mockResponse = mockApiResponse.success(outOfStockProduct)
      ;(api.products.getById as jest.Mock).mockResolvedValue(mockResponse)

      render(<ProductDetailPage params={{ id: 'product-1' }} />)

      await waitFor(() => {
        expect(screen.getByText('Out of Stock')).toBeInTheDocument()
      })

      // Add to cart button should be disabled
      const addToCartButton = screen.getByText('Out of Stock')
      expect(addToCartButton).toBeDisabled()
    })

    it('should update existing cart item quantity', async () => {
      // Add product to cart first
      cartStore.getState().addItem('product-1', 1, { color: 'Black' })

      render(<ProductDetailPage params={{ id: 'product-1' }} />)

      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      })

      // Set quantity to 3
      const quantityInput = screen.getByLabelText('Quantity')
      fireEvent.change(quantityInput, { target: { value: '3' } })

      // Add to cart again
      const addToCartButton = screen.getByText('Add to Cart')
      fireEvent.click(addToCartButton)

      // Verify quantity is updated (not duplicated)
      await waitFor(() => {
        const cartState = cartStore.getState()
        expect(cartState.items).toHaveLength(1)
        expect(cartState.items[0].quantity).toBe(4) // 1 + 3
      })
    })
  })

  describe('Cart Management Flow', () => {
    beforeEach(() => {
      // Pre-populate cart with test items
      cartStore.getState().addItem('product-1', 2, { color: 'Black' })
      cartStore.getState().addItem('product-2', 1, {})
    })

    it('should display cart items and totals', async () => {
      render(<CartPage />)

      // Verify cart items are displayed
      await waitFor(() => {
        const cartState = cartStore.getState()
        cartState.items.forEach(item => {
          expect(screen.getByTestId(`cart-item-${item.productId}`)).toBeInTheDocument()
        })
      })

      // Verify cart summary
      const cartState = cartStore.getState()
      const cartTotal = cartState.getCartTotal()
      expect(screen.getByText(`Total: $${cartTotal.toFixed(2)}`)).toBeInTheDocument()
    })

    it('should update item quantity in cart', async () => {
      render(<CartPage />)

      // Find quantity input for first item
      const quantityInput = screen.getByTestId('quantity-input-product-1')
      
      // Increase quantity to 3
      fireEvent.change(quantityInput, { target: { value: '3' } })

      // Verify store is updated
      await waitFor(() => {
        const cartState = cartStore.getState()
        const item = cartState.items.find(i => i.productId === 'product-1')
        expect(item?.quantity).toBe(3)
      })

      // Verify total is recalculated
      await waitFor(() => {
        const cartState = cartStore.getState()
        const newTotal = cartState.getCartTotal()
        expect(screen.getByText(`Total: $${newTotal.toFixed(2)}`)).toBeInTheDocument()
      })
    })

    it('should remove item from cart', async () => {
      render(<CartPage />)

      // Click remove button for first item
      const removeButton = screen.getByTestId('remove-item-product-1')
      fireEvent.click(removeButton)

      // Verify item is removed from store
      await waitFor(() => {
        const cartState = cartStore.getState()
        expect(cartState.items.find(i => i.productId === 'product-1')).toBeUndefined()
      })

      // Verify UI is updated
      await waitFor(() => {
        expect(screen.queryByTestId('cart-item-product-1')).not.toBeInTheDocument()
      })

      // Verify notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'success' && n.message.includes('removed from cart')
        )).toBe(true)
      })
    })

    it('should clear entire cart', async () => {
      render(<CartPage />)

      // Click clear cart button
      const clearCartButton = screen.getByText('Clear Cart')
      fireEvent.click(clearCartButton)

      // Confirm in modal
      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)

      // Verify cart is empty
      await waitFor(() => {
        const cartState = cartStore.getState()
        expect(cartState.items).toHaveLength(0)
      })

      // Verify empty cart message is shown
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    })

    it('should handle empty cart state', async () => {
      // Start with empty cart
      cartStore.getState().clearCart()

      render(<CartPage />)

      // Verify empty cart message
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument()

      // Click continue shopping
      const continueButton = screen.getByText('Continue Shopping')
      fireEvent.click(continueButton)

      // Verify redirect to products page
      expect(mockPush).toHaveBeenCalledWith('/products')
    })
  })

  describe('Checkout Flow', () => {
    beforeEach(() => {
      // Set up authenticated user
      authStore.setState({
        isAuthenticated: true,
        user: mockUser,
        token: 'mock-token',
      })

      // Pre-populate cart
      cartStore.getState().addItem('product-1', 2, { color: 'Black' })
      cartStore.getState().addItem('product-2', 1, {})
    })

    it('should complete checkout process successfully', async () => {
      const mockOrderResponse = mockApiResponse.success(mockOrder)
      ;(api.orders.create as jest.Mock).mockResolvedValue(mockOrderResponse)

      ;(useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        query: {},
        pathname: '/checkout',
      })

      render(<CheckoutPage />)

      // Verify checkout summary is displayed
      const cartState = cartStore.getState()
      const cartTotal = cartState.getCartTotal()
      expect(screen.getByText(`Order Total: $${cartTotal.toFixed(2)}`)).toBeInTheDocument()

      // Select shipping address
      const shippingAddress = screen.getByTestId('address-option-0')
      fireEvent.click(shippingAddress)

      // Select payment method
      const creditCardOption = screen.getByLabelText('Credit Card')
      fireEvent.click(creditCardOption)

      // Fill payment details (if required)
      if (screen.queryByLabelText('Card Number')) {
        fireEvent.change(screen.getByLabelText('Card Number'), { 
          target: { value: '4111111111111111' } 
        })
        fireEvent.change(screen.getByLabelText('Expiry Date'), { 
          target: { value: '12/25' } 
        })
        fireEvent.change(screen.getByLabelText('CVV'), { 
          target: { value: '123' } 
        })
      }

      // Place order
      const placeOrderButton = screen.getByText('Place Order')
      fireEvent.click(placeOrderButton)

      // Verify API call
      await waitFor(() => {
        expect(api.orders.create).toHaveBeenCalledWith({
          items: cartState.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant,
            price: item.price || 0, // Assuming price is calculated
          })),
          shippingAddress: mockUser.addresses![0],
          billingAddress: mockUser.addresses![0],
          paymentMethod: 'credit_card',
          notes: '',
        })
      })

      // Verify order is created in store
      await waitFor(() => {
        const orderState = orderStore.getState()
        expect(orderState.currentOrder).toEqual(mockOrder)
      })

      // Verify cart is cleared
      await waitFor(() => {
        const cartState = cartStore.getState()
        expect(cartState.items).toHaveLength(0)
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'success' && n.message.includes('order placed successfully')
        )).toBe(true)
      })

      // Verify redirect to order confirmation
      expect(mockPush).toHaveBeenCalledWith(`/orders/${mockOrder.id}`)
    })

    it('should handle checkout validation errors', async () => {
      render(<CheckoutPage />)

      // Try to place order without selecting address or payment method
      const placeOrderButton = screen.getByText('Place Order')
      fireEvent.click(placeOrderButton)

      // Verify validation errors are shown
      await waitFor(() => {
        expect(screen.getByText('Please select a shipping address')).toBeInTheDocument()
        expect(screen.getByText('Please select a payment method')).toBeInTheDocument()
      })

      // Verify no API call was made
      expect(api.orders.create).not.toHaveBeenCalled()
    })

    it('should handle checkout API errors', async () => {
      const errorMessage = 'Payment failed'
      ;(api.orders.create as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<CheckoutPage />)

      // Select required fields
      const shippingAddress = screen.getByTestId('address-option-0')
      fireEvent.click(shippingAddress)

      const creditCardOption = screen.getByLabelText('Credit Card')
      fireEvent.click(creditCardOption)

      // Place order
      const placeOrderButton = screen.getByText('Place Order')
      fireEvent.click(placeOrderButton)

      // Verify error notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'error' && n.message.includes(errorMessage)
        )).toBe(true)
      })

      // Verify cart is not cleared
      const cartState = cartStore.getState()
      expect(cartState.items.length).toBeGreaterThan(0)
    })

    it('should redirect unauthenticated users to login', async () => {
      // Set up unauthenticated state
      authStore.setState({
        isAuthenticated: false,
        user: null,
        token: null,
      })

      render(<CheckoutPage />)

      // Verify redirect to login
      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/checkout')
    })
  })

  describe('Cart Persistence Flow', () => {
    it('should persist cart to localStorage', async () => {
      cartStore.getState().addItem('product-1', 2, { color: 'Black' })

      // Verify localStorage is updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cart',
        expect.stringContaining('product-1')
      )
    })

    it('should restore cart from localStorage on initialization', async () => {
      const savedCartData = [
        {
          productId: 'product-1',
          quantity: 2,
          selectedVariant: { color: 'Black' },
          addedAt: new Date().toISOString()
        }
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedCartData))

      // Simulate cart initialization
      cartStore.getState().loadFromStorage()

      // Verify cart state is restored
      const cartState = cartStore.getState()
      expect(cartState.items).toHaveLength(1)
      expect(cartState.items[0].productId).toBe('product-1')
      expect(cartState.items[0].quantity).toBe(2)
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')

      // Should not throw error
      expect(() => cartStore.getState().loadFromStorage()).not.toThrow()

      // Should maintain empty cart
      const cartState = cartStore.getState()
      expect(cartState.items).toHaveLength(0)
    })
  })

  describe('Cart Item Validation Flow', () => {
    it('should handle adding item with insufficient stock', async () => {
      const limitedStockProduct = { ...mockProduct, stock: 2 }
      const mockResponse = mockApiResponse.success(limitedStockProduct)
      ;(api.products.getById as jest.Mock).mockResolvedValue(mockResponse)

      render(<ProductDetailPage params={{ id: 'product-1' }} />)

      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      })

      // Try to add more than available stock
      const quantityInput = screen.getByLabelText('Quantity')
      fireEvent.change(quantityInput, { target: { value: '5' } })

      const addToCartButton = screen.getByText('Add to Cart')
      fireEvent.click(addToCartButton)

      // Verify error notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => 
          n.type === 'error' && n.message.includes('insufficient stock')
        )).toBe(true)
      })

      // Verify item is not added to cart
      const cartState = cartStore.getState()
      expect(cartState.items).toHaveLength(0)
    })

    it('should update cart totals correctly with discounts', async () => {
      // Add item with discount price
      const discountedProduct = { ...mockProduct, discountPrice: 79.99 }
      cartStore.getState().addItem('product-1', 2, {}, discountedProduct.discountPrice)

      render(<CartPage />)

      // Verify discounted total is calculated
      const cartState = cartStore.getState()
      const expectedTotal = discountedProduct.discountPrice * 2
      expect(screen.getByText(`Total: $${expectedTotal.toFixed(2)}`)).toBeInTheDocument()
    })
  })
})