export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: 'customer' | 'admin';
  avatar?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  stock: number;
  specifications: Record<string, string>;
  rating: number;
  reviewCount: number;
  tags: string[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedVariant?: Record<string, string>;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  total: number;
  selectedVariant?: Record<string, string>;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  provider?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface Transaction {
  id: string;
  orderId?: string;
  type: 'revenue' | 'expense' | 'refund';
  amount: number;
  description: string;
  category: string;
  reference?: string;
  date: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

// Filter and Search Types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
  tags?: string[];
  search?: string;
}

export interface SortOptions {
  field: 'name' | 'price' | 'rating' | 'createdAt' | 'popularity';
  order: 'asc' | 'desc';
}

export interface SearchParams {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: string;
  filters?: ProductFilters;
}

// Dashboard and Analytics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  topProducts: Product[];
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Form Types
export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface CheckoutForm {
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'promotion' | 'system' | 'payment';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: ValidationError[];
}