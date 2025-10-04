import { ref, computed } from 'vue'
import { reportsService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { CustomerReportResponse, CustomerReportPeriod } from '@/types/api'

export function useCustomerReports() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const customerReport = ref<CustomerReportResponse | null>(null)
  const error = ref<string | null>(null)
  const selectedPeriod = ref<CustomerReportPeriod>('last_month')
  const selectedStatus = ref<string>('')
  const selectedLimit = ref<number>(10)
  const selectedPaymentMethod = ref<string>('')
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  
  // Period options
  const periodOptions = [
    { value: 'last_week', label: 'Última Semana' },
    { value: 'last_15_days', label: 'Últimos 15 Dias' },
    { value: 'last_month', label: 'Último Mês' },
    { value: 'last_quarter', label: 'Último Trimestre' }
  ]
  
  // Status options
  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'processing', label: 'Em Processamento' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' }
  ]
  
  // Payment method options
  const paymentMethodOptions = [
    { value: '', label: 'Todos os Métodos' },
    { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
    { value: 'pix', label: '🔑 PIX' },
    { value: 'dinheiro', label: '💵 Dinheiro' },
    { value: 'a_prazo', label: '📋 À Prazo' }
  ]
  
  // Methods
  const getCustomerReport = async (customerId: number) => {
    try {
      loading.setLoading(true)
      error.value = null
      
      const response = await reportsService.getCustomerReport(
        customerId,
        selectedPeriod.value,
        selectedStatus.value || undefined,
        selectedLimit.value,
        selectedPaymentMethod.value || undefined
      )
      
      customerReport.value = response
      notifications.success('Relatório carregado com sucesso')
    } catch (err) {
      console.error('Error loading customer report:', err)
      error.value = 'Erro ao carregar relatório do cliente'
      notifications.error('Erro ao carregar relatório do cliente')
    } finally {
      loading.setLoading(false)
    }
  }
  
  const updateFilters = (period?: CustomerReportPeriod, status?: string, limit?: number) => {
    if (period) selectedPeriod.value = period
    if (status !== undefined) selectedStatus.value = status
    if (limit) selectedLimit.value = limit
  }
  
  const clearReport = () => {
    customerReport.value = null
    error.value = null
  }
  
  return {
    // State
    customerReport,
    error,
    selectedPeriod,
    selectedStatus,
    selectedLimit,
    selectedPaymentMethod,
    
    // Computed
    isLoading,
    
    // Options
    periodOptions,
    statusOptions,
    paymentMethodOptions,
    
    // Methods
    getCustomerReport,
    updateFilters,
    clearReport
  }
}
