import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href, ...props }) {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  User: () => <div data-testid="user-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  X: () => <div data-testid="x-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  Home: () => <div data-testid="home-icon" />,
  Package: () => <div data-testid="package-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  Check: () => <div data-testid="check-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  SortAsc: () => <div data-testid="sort-asc-icon" />,
  SortDesc: () => <div data-testid="sort-desc-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Truck: () => <div data-testid="truck-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  CreditCard: () => <div data-testid="credit-card-icon" />,
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    custom: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}))

// Mock Swiper components
jest.mock('swiper/react', () => ({
  Swiper: ({ children, ...props }) => <div data-testid="swiper" {...props}>{children}</div>,
  SwiperSlide: ({ children, ...props }) => <div data-testid="swiper-slide" {...props}>{children}</div>,
}))

jest.mock('swiper/modules', () => ({
  Navigation: 'Navigation',
  Pagination: 'Pagination',
  Autoplay: 'Autoplay',
}))

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock fetch API
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Mock process.env for testing
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

// Suppress console warnings during tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear()
  }
})