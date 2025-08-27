import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import authStore from '@/store/authStore'
import notificationStore from '@/store/notificationStore'
import { mockUser, mockApiResponse } from '@/utils/testUtils'
import LoginPage from '@/app/auth/login/page'
import RegisterPage from '@/app/auth/register/page'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock API client
jest.mock('@/utils/apiClient', () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
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

import { api } from '@/utils/apiClient'

describe('User Authentication Flow Integration Tests', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    // Reset stores
    authStore.getState().logout()
    notificationStore.getState().clearAll()
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      pathname: '/auth/login',
      query: {},
    })
  })

  describe('User Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const mockRegisterResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      })
      ;(api.auth.register as jest.Mock).mockResolvedValue(mockRegisterResponse)

      render(<RegisterPage />)

      // Fill registration form
      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /register/i })

      fireEvent.change(nameInput, { target: { value: mockUser.name } })
      fireEvent.change(emailInput, { target: { value: mockUser.email } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      // Submit form
      fireEvent.click(submitButton)

      // Wait for API call and state updates
      await waitFor(() => {
        expect(api.auth.register).toHaveBeenCalledWith({
          name: mockUser.name,
          email: mockUser.email,
          password: 'password123',
        })
      })

      // Verify auth store is updated
      await waitFor(() => {
        const authState = authStore.getState()
        expect(authState.isAuthenticated).toBe(true)
        expect(authState.user).toEqual(mockUser)
        expect(authState.token).toBe('mock-jwt-token')
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => n.type === 'success' && n.message.includes('registered'))).toBe(true)
      })

      // Verify redirect to home page
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should handle registration validation errors', async () => {
      render(<RegisterPage />)

      const submitButton = screen.getByRole('button', { name: /register/i })

      // Submit form without filling required fields
      fireEvent.click(submitButton)

      // Check for validation error messages
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })

      // Verify no API call was made
      expect(api.auth.register).not.toHaveBeenCalled()

      // Verify user is not authenticated
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
    })

    it('should handle registration API errors', async () => {
      const errorMessage = 'Email already exists'
      ;(api.auth.register as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<RegisterPage />)

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: mockUser.name } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: mockUser.email } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /register/i }))

      // Wait for error handling
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => n.type === 'error' && n.message.includes(errorMessage))).toBe(true)
      })

      // Verify user is not authenticated
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
    })
  })

  describe('User Login Flow', () => {
    it('should successfully log in an existing user', async () => {
      const mockLoginResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      })
      ;(api.auth.login as jest.Mock).mockResolvedValue(mockLoginResponse)

      render(<LoginPage />)

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /login/i })

      fireEvent.change(emailInput, { target: { value: mockUser.email } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      fireEvent.click(submitButton)

      // Wait for API call and state updates
      await waitFor(() => {
        expect(api.auth.login).toHaveBeenCalledWith({
          email: mockUser.email,
          password: 'password123',
        })
      })

      // Verify auth store is updated
      await waitFor(() => {
        const authState = authStore.getState()
        expect(authState.isAuthenticated).toBe(true)
        expect(authState.user).toEqual(mockUser)
        expect(authState.token).toBe('mock-jwt-token')
      })

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => n.type === 'success' && n.message.includes('logged in'))).toBe(true)
      })

      // Verify redirect to home page
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should handle invalid login credentials', async () => {
      const errorMessage = 'Invalid email or password'
      ;(api.auth.login as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<LoginPage />)

      // Fill form with invalid credentials
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid@email.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /login/i }))

      // Wait for error handling
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => n.type === 'error' && n.message.includes(errorMessage))).toBe(true)
      })

      // Verify user is not authenticated
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)

      // Verify no redirect occurred
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle login with remember me option', async () => {
      const mockLoginResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      })
      ;(api.auth.login as jest.Mock).mockResolvedValue(mockLoginResponse)

      render(<LoginPage />)

      // Fill form and check remember me
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: mockUser.email } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
      fireEvent.click(rememberMeCheckbox)

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /login/i }))

      // Verify API call includes remember option
      await waitFor(() => {
        expect(api.auth.login).toHaveBeenCalledWith({
          email: mockUser.email,
          password: 'password123',
          remember: true,
        })
      })
    })
  })

  describe('User Logout Flow', () => {
    beforeEach(() => {
      // Set up authenticated state
      authStore.setState({
        isAuthenticated: true,
        user: mockUser,
        token: 'mock-jwt-token',
      })
    })

    it('should successfully log out the user', async () => {
      const mockLogoutResponse = mockApiResponse.success({ message: 'Logged out successfully' })
      ;(api.auth.logout as jest.Mock).mockResolvedValue(mockLogoutResponse)

      // Simulate logout action (this would typically be triggered by a logout button)
      await authStore.getState().logout()

      // Wait for API call
      await waitFor(() => {
        expect(api.auth.logout).toHaveBeenCalled()
      })

      // Verify auth store is cleared
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
      expect(authState.user).toBeNull()
      expect(authState.token).toBeNull()

      // Verify success notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => n.type === 'success' && n.message.includes('logged out'))).toBe(true)
      })
    })

    it('should handle logout errors gracefully', async () => {
      const errorMessage = 'Logout failed'
      ;(api.auth.logout as jest.Mock).mockRejectedValue(new Error(errorMessage))

      // Simulate logout action
      await authStore.getState().logout()

      // Even if API call fails, user should be logged out locally
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
      expect(authState.user).toBeNull()
      expect(authState.token).toBeNull()
    })
  })

  describe('Token Refresh Flow', () => {
    beforeEach(() => {
      // Set up authenticated state with expired token scenario
      authStore.setState({
        isAuthenticated: true,
        user: mockUser,
        token: 'expired-token',
        refreshToken: 'valid-refresh-token',
      })
    })

    it('should refresh token automatically', async () => {
      const mockRefreshResponse = mockApiResponse.success({
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token'
      })
      ;(api.auth.refreshToken as jest.Mock).mockResolvedValue(mockRefreshResponse)

      // Simulate token refresh
      await authStore.getState().refreshToken()

      // Verify API call
      expect(api.auth.refreshToken).toHaveBeenCalledWith('valid-refresh-token')

      // Verify tokens are updated
      const authState = authStore.getState()
      expect(authState.token).toBe('new-jwt-token')
      expect(authState.refreshToken).toBe('new-refresh-token')
      expect(authState.isAuthenticated).toBe(true)
    })

    it('should logout user when refresh token is invalid', async () => {
      const errorMessage = 'Invalid refresh token'
      ;(api.auth.refreshToken as jest.Mock).mockRejectedValue(new Error(errorMessage))

      // Simulate token refresh
      await authStore.getState().refreshToken()

      // Verify user is logged out
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
      expect(authState.user).toBeNull()
      expect(authState.token).toBeNull()

      // Verify error notification
      await waitFor(() => {
        const notifications = notificationStore.getState().notifications
        expect(notifications.some(n => n.type === 'error' && n.message.includes('session expired'))).toBe(true)
      })
    })
  })

  describe('Authentication State Persistence', () => {
    it('should persist authentication state across browser sessions', () => {
      // Mock localStorage to have saved auth data
      const savedAuthData = {
        user: mockUser,
        token: 'saved-token',
        refreshToken: 'saved-refresh-token',
      }

      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(savedAuthData))

      // Simulate app initialization
      authStore.getState().initializeFromStorage()

      // Verify auth state is restored
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(true)
      expect(authState.user).toEqual(mockUser)
      expect(authState.token).toBe('saved-token')
      expect(authState.refreshToken).toBe('saved-refresh-token')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-json')

      // Should not throw error
      expect(() => authStore.getState().initializeFromStorage()).not.toThrow()

      // Should maintain clean initial state
      const authState = authStore.getState()
      expect(authState.isAuthenticated).toBe(false)
      expect(authState.user).toBeNull()
    })
  })
})