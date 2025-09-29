import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { LoginRequest, RegisterRequest, User } from '@/types/api'

export function useAuth() {
  const router = useRouter()
  const notifications = useNotifications()
  const loading = useLoading()
  
  // Auth state
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)

  // Methods
  const setAuthToken = (token: string) => {
    // Set cookie with 7 days expiration
    const expires = new Date()
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000))
    document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
  }

  const getAuthToken = (): string | null => {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'auth_token') {
        return value
      }
    }
    return null
  }

  const clearAuth = () => {
    // Remove cookie
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    user.value = null
  }

  const login = async (data: LoginRequest) => {
    try {
      loading.setLoading(true)
      const response = await authService.login(data)
      
      if (response?.token) {
        setAuthToken(response.token)
        user.value = response.user
        notifications.success('Login realizado com sucesso!')
        return response
      }
    } catch (error) {
      notifications.error('Erro ao fazer login. Verifique suas credenciais.')
      throw error
    } finally {
      loading.setLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      loading.setLoading(true)
      const response = await authService.register(data)
      
      if (response?.token) {
        setAuthToken(response.token)
        user.value = response.user
        notifications.success('Cadastro realizado com sucesso!')
        return response
      }
    } catch (error) {
      notifications.error('Erro ao cadastrar. Tente novamente.')
      throw error
    } finally {
      loading.setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      notifications.success('Logout realizado com sucesso!')
      router.push('/login')
    }
  }

  const checkAuth = async () => {
    try {
      const token = getAuthToken()
      if (token && !user.value) {
        loading.setLoading(true)
        const response = await authService.getMe()
        user.value = response
        return true
      }
      return isAuthenticated.value
    } catch (error) {
      console.error('Auth check error:', error)
      // If getMe fails, user is not authenticated
      clearAuth()
      return false
    } finally {
      loading.setLoading(false)
    }
  }

  const requireAuth = async () => {
    const isAuth = await checkAuth()
    if (!isAuth) {
      router.push('/login')
      return false
    }
    return true
  }

  // Initialize auth on app start
  const initAuth = async () => {
    await checkAuth()
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    
    // Methods
    login,
    register,
    logout,
    checkAuth,
    requireAuth,
    initAuth,
    clearAuth
  }
}
