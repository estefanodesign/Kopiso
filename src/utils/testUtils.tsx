import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { Product, User, Order, CartItem } from '@/types'

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // You can add providers here if needed (e.g., theme providers, context providers)
  return render(ui, options)
}

// Mock data generators
export const mockUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  role: 'customer',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  addresses: [
    {
      id: 'addr-1',
      firstName: 'John',
      lastName: 'Doe',
      company: '',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      phone: '+1234567890',
      isDefault: true,
    },
  ],
}

export const mockAdmin: User = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
}

export const mockProduct: Product = {
  id: 'product-1',
  name: 'Test Product',
  description: 'This is a test product description',
  price: 99.99,
  discountPrice: 79.99,
  category: 'electronics',
  brand: 'Test Brand',
  images: ['/test-image-1.jpg', '/test-image-2.jpg'],
  stock: 10,
  rating: 4.5,
  reviewCount: 25,
  tags: ['test', 'electronics'],
  specifications: {
    color: 'Black',
    weight: '1kg',
    dimensions: '10x10x5cm',
  },
  variants: [
    {
      id: 'variant-1',
      name: 'Color',
      options: ['Black', 'White', 'Blue'],
    },
  ],
  sku: 'TEST-001',
  isActive: true,
  featured: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockProducts: Product[] = [
  mockProduct,
  {
    ...mockProduct,
    id: 'product-2',
    name: 'Another Test Product',
    price: 149.99,
    discountPrice: undefined,
    category: 'fashion',
    brand: 'Another Brand',
    stock: 5,
    rating: 3.8,
    reviewCount: 12,
  },
  {
    ...mockProduct,
    id: 'product-3',
    name: 'Third Test Product',
    price: 199.99,
    category: 'home',
    brand: 'Third Brand',
    stock: 0,
    rating: 4.2,
    reviewCount: 8,
  },
]

export const mockCartItem: CartItem = {
  productId: 'product-1',
  quantity: 2,
  selectedVariant: {
    color: 'Black',
  },
  addedAt: new Date('2024-01-01'),
}

export const mockOrder: Order = {
  id: 'order-1',
  userId: 'user-1',
  items: [
    {
      productId: 'product-1',
      quantity: 2,
      price: 79.99,
      selectedVariant: { color: 'Black' },
    },
  ],
  status: 'pending',
  total: 159.98,
  subtotal: 159.98,
  tax: 0,
  shipping: 0,
  shippingAddress: mockUser.addresses![0],
  billingAddress: mockUser.addresses![0],
  paymentMethod: 'credit_card',
  paymentStatus: 'pending',
  notes: '',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock API responses
export const mockApiResponse = {
  success: <T>(data: T, message = 'Success') => ({
    success: true as const,
    data,
    message,
  }),
  error: (message = 'Error occurred', code?: string) => ({
    success: false as const,
    message,
    code,
  }),
  paginated: <T>(data: T[], page = 1, limit = 10, total?: number) => ({
    success: true as const,
    data: {
      data,
      meta: {
        page,
        limit,
        total: total ?? data.length,
        totalPages: Math.ceil((total ?? data.length) / limit),
      }
    },
  }),
}

// Mock fetch responses
export const mockFetchResponse = {
  success: <T>(data: T) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse.success(data)),
    } as Response)
  },
  error: (status = 400, message = 'Error') => {
    return Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve(mockApiResponse.error(message)),
    } as Response)
  },
}

// Test helpers for async operations
export const waitForAsyncAction = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock Zustand store
export const createMockStore = <T>(initialState: T) => {
  let state = initialState
  
  const getState = () => state
  const setState = (newState: Partial<T> | ((prev: T) => Partial<T>)) => {
    if (typeof newState === 'function') {
      state = { ...state, ...newState(state) }
    } else {
      state = { ...state, ...newState }
    }
  }
  
  return { getState, setState }
}

// Form testing helpers
export const fillForm = (form: HTMLFormElement, values: Record<string, string>) => {
  Object.entries(values).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      input.value = value
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
}

// Mock notifications (functions will be mocked in test files)
export const mockNotifications = {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  form: {
    validationErrors: () => {},
    saved: () => {},
  },
  auth: {
    loggedIn: () => {},
    loggedOut: () => {},
    registered: () => {},
  },
  cart: {
    added: () => {},
    removed: () => {},
    updated: () => {},
  },
  network: {
    error: () => {},
  },
}

// Custom matchers for better assertions
export const customMatchers = {
  toBeInTheDocument: (element: HTMLElement) => {
    return document.body.contains(element)
  },
  toHaveClass: (element: HTMLElement, className: string) => {
    return element.classList.contains(className)
  },
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export * from '@testing-library/jest-dom'