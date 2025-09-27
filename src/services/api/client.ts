import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'
import { useToast } from 'vue-toastification'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const TENANT_ID = import.meta.env.VITE_TENANT_ID || '1'

class ApiClient {
  private client: ReturnType<typeof axios.create>
  private toast = useToast()

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token from cookie if available
        const token = this.getAuthTokenFromCookie()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add idempotency key for POST requests
        if (config.method === 'post') {
          config.headers['Idempotency-Key'] = this.generateIdempotencyKey()
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error: AxiosError) => {
        this.handleError(error)
        return Promise.reject(error)
      }
    )
  }

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getAuthTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'auth_token') {
        return value
      }
    }
    return null
  }

  private handleError(error: AxiosError) {
    const status = error.response?.status
    const data = error.response?.data as any

    switch (status) {
      case 401:
        this.toast.error('Sessão expirada. Faça login novamente.')
        this.clearAuthAndRedirect()
        break
      case 403:
        this.toast.error('Acesso negado.')
        break
      case 404:
        this.toast.error('Recurso não encontrado.')
        break
      case 422:
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0] as string[]
          this.toast.error(firstError[0] || 'Dados inválidos.')
        } else {
          this.toast.error(data?.message || 'Dados inválidos.')
        }
        break
      case 500:
        this.toast.error('Erro interno do servidor.')
        break
      default:
        if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
          this.toast.error('Erro de conexão. Verifique sua internet.')
        } else {
          this.toast.error(data?.message || 'Erro inesperado.')
        }
    }
  }

  private clearAuth() {
    // Clear auth cookie
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  private clearAuthAndRedirect() {
    this.clearAuth()
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  // Utility methods
  setAuthToken(token: string) {
    // Set cookie with 7 days expiration
    const expires = new Date()
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000))
    document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
    this.client.defaults.headers.Authorization = `Bearer ${token}`
  }

  clearAuthToken() {
    // Clear auth cookie
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    delete this.client.defaults.headers.Authorization
  }

  getAuthToken(): string | null {
    return this.getAuthTokenFromCookie()
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
