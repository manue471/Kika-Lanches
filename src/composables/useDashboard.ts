import { ref, computed } from 'vue'
import { reportsService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { DashboardResponse } from '@/types/api'

export function useDashboard() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const dashboardData = ref<DashboardResponse | null>(null)
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  
  // Methods
  const loadDashboard = async () => {
    try {
      loading.setLoading(true)
      error.value = null
      console.log('Loading dashboard data...')
      const response = await reportsService.getDashboard()
      dashboardData.value = response
      console.log('Dashboard data loaded:', response)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      error.value = 'Erro ao carregar dados do dashboard'
      notifications.error('Erro ao carregar dados do dashboard')
    } finally {
      loading.setLoading(false)
    }
  }
  
  const refresh = () => loadDashboard()
  
  return {
    // State
    dashboardData,
    error,
    
    // Computed
    isLoading,
    
    // Methods
    loadDashboard,
    refresh
  }
}
