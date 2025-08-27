import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types'
import { notifications } from '@/utils/notifications'
import { api, apiClient } from '@/utils/apiClient'
import { errorMonitoring, addBreadcrumb } from '@/utils/errorMonitoring'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  register: (data: RegisterData) => Promise<AuthResponse>
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  updateUser: (userData: Partial<User>) => void
  checkAuth: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
}

type AuthStore = AuthState & AuthActions

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })

          const data: AuthResponse = await response.json()

          if (data.success && data.user && data.token) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            
            // Show success notification
            notifications.auth.loggedIn()
          } else {
            set({
              error: data.message || 'Login failed',
              isLoading: false,
            })
          }

          return data
        } catch (error) {
          const errorMessage = 'Network error. Please try again.'
          set({
            error: errorMessage,
            isLoading: false,
          })
          return {
            success: false,
            message: errorMessage,
          }
        }
      },

      register: async (data: RegisterData): Promise<AuthResponse> => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          const result: AuthResponse = await response.json()

          if (result.success && result.user && result.token) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            
            // Show success notification
            notifications.auth.registered()
          } else {
            set({
              error: result.message || 'Registration failed',
              isLoading: false,
            })
          }

          return result
        } catch (error) {
          const errorMessage = 'Network error. Please try again.'
          set({
            error: errorMessage,
            isLoading: false,
          })
          return {
            success: false,
            message: errorMessage,
          }
        }
      },

      logout: () => {
        const token = get().token
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
        
        // Show logout notification
        notifications.auth.loggedOut()
        
        // Also call logout API to invalidate server session
        if (token) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).catch(() => {
            // Ignore errors on logout API call
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          return
        }

        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              set({
                user: data.user,
                isAuthenticated: true,
              })
            } else {
              // Token is invalid, clear auth state
              get().logout()
            }
          } else {
            // Token is invalid, clear auth state
            get().logout()
          }
        } catch (error) {
          // Network error, keep current state but log error
          console.error('Auth check failed:', error)
        }
      },

      updateProfile: async (userData: Partial<User>): Promise<boolean> => {
        const token = get().token
        if (!token) return false

        try {
          const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          })

          const data = await response.json()

          if (data.success && data.user) {
            set({ user: data.user })
            notifications.profile.updated()
            return true
          } else {
            notifications.error(data.message || 'Failed to update profile')
            return false
          }
        } catch (error) {
          notifications.network.error()
          return false
        }
      },

      changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
        const token = get().token
        if (!token) return false

        try {
          const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          })

          const data = await response.json()

          if (data.success) {
            notifications.profile.passwordChanged()
            return true
          } else {
            notifications.error(data.message || 'Failed to change password')
            return false
          }
        } catch (error) {
          notifications.network.error()
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore