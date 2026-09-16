import { ref, computed } from 'vue'
import { reportsService, customersService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { CustomerReportResponse, CustomerReportPeriod, Customer } from '@/types/api'

export interface CustomerReportFilterParams {
  period?: CustomerReportPeriod
  status?: string
  limit?: number
  payment_method?: string
  from_date?: string
  to_date?: string
}

export function useCustomerReports() {
  const notifications = useNotifications()
  const loading = useLoading()

  // State
  const customerReport = ref<CustomerReportResponse | null>(null)
  const error = ref<string | null>(null)
  const selectedPeriod = ref<CustomerReportPeriod | ''>('last_month')
  const selectedStatus = ref<string>('')
  const selectedLimit = ref<number>(10)
  const selectedPaymentMethod = ref<string>('')
  const selectedFromDate = ref<string>('')
  const selectedToDate = ref<string>('')

  // Search and pagination for customers list
  const searchTerm = ref('')
  const customers = ref<Customer[]>([])
  const currentPage = ref(1)
  const perPage = ref(20)
  const totalPages = ref(0)
  const totalCustomers = ref(0)
  const hasMorePages = ref(true)
  const isLoadingMore = ref(false)

  // Computed
  const isLoading = computed(() => loading.isLoading.value)

  /** Custom date range takes priority over period preset. */
  const hasCustomDateRange = computed(
    () => !!(selectedFromDate.value && selectedToDate.value)
  )

  const activeFilterLabels = computed(() => {
    const labels: string[] = []
    if (hasCustomDateRange.value) {
      labels.push(`De ${selectedFromDate.value} até ${selectedToDate.value}`)
    } else if (selectedPeriod.value) {
      const opt = periodOptions.find((o) => o.value === selectedPeriod.value)
      labels.push(opt?.label || selectedPeriod.value)
    }
    if (selectedStatus.value) {
      const opt = statusOptions.find((o) => o.value === selectedStatus.value)
      labels.push(`Status: ${opt?.label || selectedStatus.value}`)
    }
    if (selectedPaymentMethod.value) {
      const opt = paymentMethodOptions.find((o) => o.value === selectedPaymentMethod.value)
      labels.push(`Pagamento: ${opt?.label || selectedPaymentMethod.value}`)
    }
    if (selectedLimit.value && selectedLimit.value !== 10) {
      labels.push(`Limite: ${selectedLimit.value}`)
    }
    return labels
  })

  // Period options
  const periodOptions = [
    { value: 'last_week', label: 'Última Semana' },
    { value: 'last_15_days', label: 'Últimos 15 Dias' },
    { value: 'last_month', label: 'Último Mês' },
    { value: 'last_quarter', label: 'Último Trimestre' }
  ]

  // Status options aligned with Sales / order lifecycle
  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'processing', label: 'Em Processamento' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'paid', label: 'Pago' },
    { value: 'cancelled', label: 'Cancelado' }
  ]

  // Payment method options
  const paymentMethodOptions = [
    { value: '', label: 'Todos os Métodos' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'pix', label: 'PIX' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'a_prazo', label: 'À Prazo' }
  ]

  const buildFilterParams = (): CustomerReportFilterParams => {
    const params: CustomerReportFilterParams = {
      status: selectedStatus.value || undefined,
      limit: selectedLimit.value || 10,
      payment_method: selectedPaymentMethod.value || undefined
    }

    if (hasCustomDateRange.value) {
      params.from_date = selectedFromDate.value
      params.to_date = selectedToDate.value
    } else if (selectedPeriod.value) {
      params.period = selectedPeriod.value as CustomerReportPeriod
    }

    return params
  }

  // Methods
  const getCustomerReport = async (customerId: number) => {
    try {
      loading.setLoading(true)
      error.value = null

      const filters = buildFilterParams()
      const response = await reportsService.getCustomerReport(customerId, filters)

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

  const resetFilters = () => {
    selectedPeriod.value = 'last_month'
    selectedStatus.value = ''
    selectedLimit.value = 10
    selectedPaymentMethod.value = ''
    selectedFromDate.value = ''
    selectedToDate.value = ''
  }

  // Customer list methods
  const loadCustomers = async (reset = true) => {
    try {
      if (reset) {
        loading.setLoading(true)
        currentPage.value = 1
        customers.value = []
      } else {
        isLoadingMore.value = true
      }

      error.value = null

      const reportFilters = buildFilterParams()
      const response = await customersService.list({
        search: searchTerm.value || undefined,
        per_page: perPage.value,
        page: currentPage.value,
        period: reportFilters.period,
        from_date: reportFilters.from_date,
        to_date: reportFilters.to_date,
        status: reportFilters.status,
        payment_method: reportFilters.payment_method
      })

      if (reset) {
        customers.value = response.data
      } else {
        customers.value.push(...response.data)
      }

      totalPages.value = response.last_page
      totalCustomers.value = response.total
      hasMorePages.value = currentPage.value < response.last_page
    } catch (err) {
      error.value = 'Erro ao carregar clientes'
      notifications.error('Erro ao carregar clientes')
    } finally {
      loading.setLoading(false)
      isLoadingMore.value = false
    }
  }

  const loadMoreCustomers = async () => {
    if (!hasMorePages.value || isLoadingMore.value) return

    currentPage.value++
    await loadCustomers(false)
  }

  const searchCustomers = (term: string) => {
    searchTerm.value = term
    loadCustomers(true)
  }

  return {
    // State
    customerReport,
    error,
    selectedPeriod,
    selectedStatus,
    selectedLimit,
    selectedPaymentMethod,
    selectedFromDate,
    selectedToDate,

    // Customer list state
    customers,
    searchTerm,
    totalCustomers,
    hasMorePages,
    isLoadingMore,

    // Computed
    isLoading,
    hasCustomDateRange,
    activeFilterLabels,

    // Options
    periodOptions,
    statusOptions,
    paymentMethodOptions,

    // Methods
    getCustomerReport,
    buildFilterParams,
    updateFilters,
    clearReport,
    resetFilters,

    // Customer list methods
    loadCustomers,
    loadMoreCustomers,
    searchCustomers,

    // Notifications for page-level toasts
    notifications
  }
}
