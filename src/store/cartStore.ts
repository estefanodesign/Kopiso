import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'
import { notifications } from '@/utils/notifications'

interface CartState {
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
}

interface CartActions {
  addItem: (productId: string, quantity?: number, variant?: Record<string, string>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getItemCount: () => number
  getCartTotal: (products: Product[]) => number
  getCartSubtotal: (products: Product[]) => number
  isItemInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
}

type CartStore = CartState & CartActions

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      isLoading: false,

      // Actions
      addItem: (productId: string, quantity = 1, variant?: Record<string, string>) => {
        const { items } = get()
        const existingItemIndex = items.findIndex(
          item => item.productId === productId && 
          JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
        )

        let productName = 'Product' // Default fallback
        
        // Try to get product name from a global product store or passed parameter
        // This could be enhanced to fetch product details
        
        if (existingItemIndex > -1) {
          // Item exists, update quantity
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += quantity
          set({ items: updatedItems })
          notifications.cart.updated()
        } else {
          // New item, add to cart
          const newItem: CartItem = {
            productId,
            quantity,
            selectedVariant: variant,
          }
          set({ items: [...items, newItem] })
          notifications.cart.added(productName)
        }
      },

      removeItem: (productId: string) => {
        const { items } = get()
        const itemToRemove = items.find(item => item.productId === productId)
        
        if (itemToRemove) {
          const updatedItems = items.filter(item => item.productId !== productId)
          set({ items: updatedItems })
          
          // Show notification
          let productName = 'Product' // Default fallback
          notifications.cart.removed(productName)
        }
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        const { items } = get()
        const updatedItems = items.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        )
        set({ items: updatedItems })
      },

      clearCart: () => {
        const { items } = get()
        if (items.length > 0) {
          set({ items: [] })
          notifications.success('Cart cleared')
        }
      },

      toggleCart: () => {
        set(state => ({ isOpen: !state.isOpen }))
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      getItemCount: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      getCartTotal: (products: Product[]) => {
        const { items } = get()
        const subtotal = get().getCartSubtotal(products)
        const shipping = subtotal > 50 ? 0 : 5.99 // Free shipping over $50
        const tax = subtotal * 0.1 // 10% tax
        return subtotal + shipping + tax
      },

      getCartSubtotal: (products: Product[]) => {
        const { items } = get()
        return items.reduce((total, item) => {
          const product = products.find(p => p.id === item.productId)
          if (product) {
            const price = product.discountPrice || product.price
            return total + (price * item.quantity)
          }
          return total
        }, 0)
      },

      isItemInCart: (productId: string) => {
        const { items } = get()
        return items.some(item => item.productId === productId)
      },

      getItemQuantity: (productId: string) => {
        const { items } = get()
        const item = items.find(item => item.productId === productId)
        return item ? item.quantity : 0
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
)

export default useCartStore