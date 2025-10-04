import { apiClient } from './client'
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User 
} from '@/types/api'

export class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/login', credentials)
    
    // Store auth data in cookie
    apiClient.setAuthToken(response.token)
    
    // Store user role in localStorage for role-based access
    if (response.user?.role) {
      localStorage.setItem('user_role', response.user.role)
    }
    
    return response
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/register', userData)
    
    // Store auth data in cookie
    apiClient.setAuthToken(response.token)
    
    // Store user role in localStorage for role-based access
    if (response.user?.role) {
      localStorage.setItem('user_role', response.user.role)
    }
    
    return response
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      // Clear local auth data
      apiClient.clearAuthToken()
      localStorage.removeItem('user_role')
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/me')
    return response.user
  }

  /**
   * Get user from API (no localStorage needed with cookies)
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/me')
    return response.user
  }

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated() && !!this.getStoredUser()
  }

  /**
   * Refresh user data
   */
  async refreshUser(): Promise<User> {
    const user = await this.getCurrentUser()
    localStorage.setItem('user', JSON.stringify(user))
    return user
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getStoredUser()
    return user?.role === role
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getStoredUser()
    return user ? roles.includes(user.role) : false
  }

  /**
   * Check if user is admin or tenant owner
   */
  isAdmin(): boolean {
    return this.hasAnyRole(['admin', 'tenant_owner'])
  }

  /**
   * Check if user can manage content
   */
  canManage(): boolean {
    return this.hasAnyRole(['admin', 'tenant_owner', 'staff'])
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService
