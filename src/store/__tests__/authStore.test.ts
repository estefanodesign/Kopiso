import { act, renderHook } from '@testing-library/react'
import useAuthStore from '@/store/authStore'
import { mockUser, mockApiResponse, mockFetchResponse } from '@/utils/testUtils'

// Mock the fetch function
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    
    // Clear all mocks
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-token-123',
      })

      mockFetch.mockResolvedValueOnce(mockFetchResponse.success(mockResponse))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.login(loginData)
        expect(response.success).toBe(true)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe('mock-token-123')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle login failure with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const mockResponse = mockApiResponse.error('Invalid credentials')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.login(loginData)
        expect(response.success).toBe(false)
        expect(response.message).toBe('Invalid credentials')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle network errors during login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.login(loginData)
        expect(response.success).toBe(false)
        expect(response.message).toBe('Network error. Please try again.')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Network error. Please try again.')
    })

    it('should set loading state during login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      // Create a promise that we can control
      let resolvePromise: (value: any) => void
      const mockPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(mockPromise as any)

      const { result } = renderHook(() => useAuthStore())

      // Start login
      act(() => {
        result.current.login(loginData)
      })

      // Check loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockFetchResponse.success(mockApiResponse.success({
          user: mockUser,
          token: 'test-token',
        })))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Register', () => {
    it('should register successfully with valid data', async () => {
      const registerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'password123',
      }

      const mockResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-token-123',
      })

      mockFetch.mockResolvedValueOnce(mockFetchResponse.success(mockResponse))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.register(registerData)
        expect(response.success).toBe(true)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe('mock-token-123')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should handle registration failure', async () => {
      const registerData = {
        name: 'John Doe',
        email: 'existing@example.com',
        phone: '+1234567890',
        password: 'password123',
      }

      const mockResponse = mockApiResponse.error('Email already exists')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        const response = await result.current.register(registerData)
        expect(response.success).toBe(false)
        expect(response.message).toBe('Email already exists')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Email already exists')
    })
  })

  describe('Logout', () => {
    it('should logout and clear user data', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set up authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
        })
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Logout
      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should call logout API when token exists', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set up authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: 'test-token',
          isAuthenticated: true,
        })
      })

      mockFetch.mockResolvedValueOnce(mockFetchResponse.success({}))

      act(() => {
        result.current.logout()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      })
    })
  })

  describe('Utility Methods', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set error state
      act(() => {
        useAuthStore.setState({ error: 'Test error' })
      })

      expect(result.current.error).toBe('Test error')

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should update user data', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        useAuthStore.setState({ user: mockUser })
      })

      const updatedData = { name: 'Jane Doe', phone: '+9876543210' }

      act(() => {
        result.current.updateUser(updatedData)
      })

      expect(result.current.user).toEqual({
        ...mockUser,
        ...updatedData,
      })
    })

    it('should not update user if no user exists', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.user).toBeNull()

      act(() => {
        result.current.updateUser({ name: 'Jane Doe' })
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('Check Auth', () => {
    it('should validate existing token', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set token
      act(() => {
        useAuthStore.setState({ token: 'valid-token' })
      })

      const mockResponse = mockApiResponse.success({ user: mockUser })
      mockFetch.mockResolvedValueOnce(mockFetchResponse.success(mockResponse))

      await act(async () => {
        await result.current.checkAuth()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      })
    })

    it('should logout if token is invalid', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set token
      act(() => {
        useAuthStore.setState({ 
          token: 'invalid-token',
          user: mockUser,
          isAuthenticated: true 
        })
      })

      mockFetch.mockResolvedValueOnce(mockFetchResponse.error(401, 'Unauthorized'))

      await act(async () => {
        await result.current.checkAuth()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should do nothing if no token exists', async () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.token).toBeNull()

      await act(async () => {
        await result.current.checkAuth()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})