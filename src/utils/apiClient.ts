import { ErrorHandler, createErrorContext } from './errorHandler'
import { notifications } from './notifications'

// API Error types and interfaces
export interface ApiErrorResponse {
  success: false
  message: string
  code?: string
  status?: number
  errors?: Array<{
    field: string
    message: string
    code?: string
  }>
  details?: any
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: any) => boolean
}

// Request configuration
export interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: RetryConfig
  showNotifications?: boolean
  showLoading?: boolean
  loadingMessage?: string
  requireAuth?: boolean
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors and 5xx server errors
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.response.status === 429 ||
      error.name === 'NetworkError'
    )
  }
}

// Enhanced API client class
export class ApiClient {
  private baseURL: string
  private defaultConfig: RequestConfig
  private errorHandler: ErrorHandler

  constructor(baseURL: string = '', defaultConfig: RequestConfig = {}) {
    this.baseURL = baseURL
    this.defaultConfig = {
      timeout: 30000,
      showNotifications: true,
      showLoading: false,
      requireAuth: false,
      ...defaultConfig
    }
    this.errorHandler = ErrorHandler.getInstance()
  }

  // Get authentication token
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  // Create request headers
  private createHeaders(config: RequestConfig): Headers {
    const headers = new Headers(config.headers)

    // Set content type if not already set
    if (!headers.has('Content-Type') && config.body) {
      if (typeof config.body === 'string') {
        headers.set('Content-Type', 'application/json')
      }
    }

    // Add authentication if required
    if (config.requireAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        throw new Error('Authentication required but no token found')
      }
    }

    return headers
  }

  // Create AbortController with timeout
  private createAbortController(timeout: number): AbortController {
    const controller = new AbortController()
    
    setTimeout(() => {
      controller.abort()
    }, timeout)

    return controller
  }

  // Delay function for retries
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt),
      config.maxDelay
    )
    
    // Add some jitter to prevent thundering herd
    return delay + Math.random() * 1000
  }

  // Handle API errors with proper classification
  private handleApiError(error: any, url: string, config: RequestConfig): never {
    const context = createErrorContext('ApiClient', 'request', {
      url,
      method: config.method || 'GET',
      requireAuth: config.requireAuth
    })

    // Handle different error types
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out')
      this.errorHandler.handleNetworkError(timeoutError, context)
      throw timeoutError
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      this.errorHandler.handleNetworkError(error, context)
      throw error
    }

    if (error.response) {
      const apiError = this.errorHandler.handleApiError(error.response, context)
      throw apiError
    }

    this.errorHandler.handleRuntimeError(error, context)
    throw error
  }

  // Core request method with retry logic
  private async makeRequest<T>(
    url: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
    const mergedConfig = { ...this.defaultConfig, ...config }
    const retryConfig = mergedConfig.retries || DEFAULT_RETRY_CONFIG

    let lastError: any
    let attempt = 0

    while (attempt <= retryConfig.maxRetries) {
      try {
        // Create abort controller for timeout
        const controller = this.createAbortController(mergedConfig.timeout || 30000)
        
        // Prepare request
        const requestConfig: RequestInit = {
          ...mergedConfig,
          headers: this.createHeaders(mergedConfig),
          signal: controller.signal
        }

        // Make the request
        const response = await fetch(fullUrl, requestConfig)

        // Handle non-ok responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: response.statusText,
            status: response.status
          }))

          const error = {
            response: {
              status: response.status,
              data: errorData
            },
            message: errorData.message || response.statusText
          }

          // Check if we should retry
          if (
            attempt < retryConfig.maxRetries &&
            retryConfig.retryCondition &&
            retryConfig.retryCondition(error)
          ) {
            lastError = error
            attempt++
            const delay = this.calculateRetryDelay(attempt - 1, retryConfig)
            await this.delay(delay)
            continue
          }

          this.handleApiError(error, fullUrl, mergedConfig)
        }

        // Parse and return successful response
        const data = await response.json()
        return data as ApiResponse<T>

      } catch (error) {
        lastError = error

        // Check if we should retry
        if (
          attempt < retryConfig.maxRetries &&
          retryConfig.retryCondition &&
          retryConfig.retryCondition(error)
        ) {
          attempt++
          const delay = this.calculateRetryDelay(attempt - 1, retryConfig)
          await this.delay(delay)
          continue
        }

        this.handleApiError(error, fullUrl, mergedConfig)
      }
    }

    // If we get here, all retries have failed
    this.handleApiError(lastError, fullUrl, mergedConfig)
  }

  // HTTP method helpers
  async get<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest(url, { ...config, method: 'GET' })
  }

  async post<T>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest(url, { ...config, method: 'DELETE' })
  }

  // Upload file with progress tracking
  async upload<T>(
    url: string,
    formData: FormData,
    config: RequestConfig & {
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<ApiResponse<T>> {
    const { onProgress, ...requestConfig } = config

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`

      // Set up progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            onProgress(progress)
          }
        })
      }

      // Set up response handling
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response)
          } else {
            const error = {
              response: {
                status: xhr.status,
                data: response
              },
              message: response.message || xhr.statusText
            }
            this.handleApiError(error, fullUrl, requestConfig)
          }
        } catch (error) {
          this.handleApiError(error, fullUrl, requestConfig)
        }
      })

      xhr.addEventListener('error', () => {
        const error = new Error('Upload failed')
        this.handleApiError(error, fullUrl, requestConfig)
      })

      xhr.addEventListener('timeout', () => {
        const error = new Error('Upload timed out')
        this.handleApiError(error, fullUrl, requestConfig)
      })

      // Configure request
      xhr.open('POST', fullUrl)
      xhr.timeout = requestConfig.timeout || 30000

      // Set headers
      if (requestConfig.requireAuth) {
        const token = this.getAuthToken()
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
      }

      // Send request
      xhr.send(formData)
    })
  }
}

// Create default API client instance
export const apiClient = new ApiClient('/api', {
  showNotifications: true,
  timeout: 30000
})

// Convenience functions for common API operations
export const api = {
  // Authentication
  auth: {
    login: (credentials: any) => 
      apiClient.post('/auth/login', credentials),
    
    register: (userData: any) => 
      apiClient.post('/auth/register', userData),
    
    logout: () => 
      apiClient.post('/auth/logout', {}, { requireAuth: true }),
    
    refreshToken: () => 
      apiClient.post('/auth/refresh', {}, { requireAuth: true }),
    
    forgotPassword: (email: string) => 
      apiClient.post('/auth/forgot-password', { email }),
    
    resetPassword: (data: any) => 
      apiClient.post('/auth/reset-password', data)
  },

  // Products
  products: {
    getAll: (params?: any) => 
      apiClient.get('/products', { 
        ...params && { body: JSON.stringify(params) }
      }),
    
    getById: (id: string) => 
      apiClient.get(`/products/${id}`),
    
    create: (productData: any) => 
      apiClient.post('/products', productData, { requireAuth: true }),
    
    update: (id: string, productData: any) => 
      apiClient.put(`/products/${id}`, productData, { requireAuth: true }),
    
    delete: (id: string) => 
      apiClient.delete(`/products/${id}`, { requireAuth: true }),
    
    search: (query: string, filters?: any) => 
      apiClient.get('/products/search', { 
        body: JSON.stringify({ query, ...filters })
      })
  },

  // Orders
  orders: {
    getAll: () => 
      apiClient.get('/orders', { requireAuth: true }),
    
    getById: (id: string) => 
      apiClient.get(`/orders/${id}`, { requireAuth: true }),
    
    create: (orderData: any) => 
      apiClient.post('/orders', orderData, { requireAuth: true }),
    
    updateStatus: (id: string, status: string) => 
      apiClient.patch(`/orders/${id}/status`, { status }, { requireAuth: true })
  },

  // Admin
  admin: {
    getAnalytics: (period?: string) => 
      apiClient.get(`/admin/analytics${period ? `?period=${period}` : ''}`, { 
        requireAuth: true 
      }),
    
    getUsers: () => 
      apiClient.get('/admin/users', { requireAuth: true }),
    
    updateUser: (id: string, userData: any) => 
      apiClient.put(`/admin/users/${id}`, userData, { requireAuth: true })
  }
}

// Error boundary specifically for API operations
export const withApiErrorBoundary = <T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  fallbackValue?: any
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await apiFunction(...args)
    } catch (error) {
      console.error('API operation failed:', error)
      
      if (fallbackValue !== undefined) {
        return fallbackValue
      }
      
      throw error
    }
  }) as T
}

// Batch API operations with error handling
export const batchApiOperations = async <T>(
  operations: Array<() => Promise<T>>,
  options: {
    concurrent?: boolean
    failFast?: boolean
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<Array<{ success: boolean; data?: T; error?: any }>> => {
  const { concurrent = false, failFast = false, onProgress } = options
  const results: Array<{ success: boolean; data?: T; error?: any }> = []

  if (concurrent) {
    // Run all operations concurrently
    const promises = operations.map(async (operation, index) => {
      try {
        const data = await operation()
        const result = { success: true, data }
        results[index] = result
        if (onProgress) onProgress(results.filter(r => r).length, operations.length)
        return result
      } catch (error) {
        const result = { success: false, error }
        results[index] = result
        if (onProgress) onProgress(results.filter(r => r).length, operations.length)
        if (failFast) throw error
        return result
      }
    })

    await Promise.all(promises)
  } else {
    // Run operations sequentially
    for (let i = 0; i < operations.length; i++) {
      try {
        const data = await operations[i]()
        results.push({ success: true, data })
      } catch (error) {
        results.push({ success: false, error })
        if (failFast) break
      }
      
      if (onProgress) onProgress(i + 1, operations.length)
    }
  }

  return results
}