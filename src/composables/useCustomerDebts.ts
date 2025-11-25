import { ref, computed } from 'vue'
import { customersService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { 
  CustomerDebt,
  PayDebtRequest,
  PayDebtResponse
} from '@/types/api'

export function useCustomerDebts() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const balance = ref<number>(0)
  const debts = ref<CustomerDebt[]>([])
  const error = ref<string | null>(null)
  
  // Pagination state
  const currentPage = ref(1)
  const perPage = ref(20)
  const totalPages = ref(0)
  const totalDebts = ref(0)
  
  // Loading states
  const isLoading = computed(() => loading.isLoading.value)
  const isPayingDebt = computed(() => loading.isLoading.value)
  
  /**
   * Get customer balance
   */
  const loadBalance = async (customerId: number) => {
    try {
      loading.setLoading(true)
      error.value = null
      
      const response = await customersService.getBalance(customerId)
      balance.value = response.balance || 0
      
      return {
        ...response,
        customer_id: response.customer.id
      }
    } catch (err: any) {
      error.value = 'Erro ao carregar saldo do cliente'
      notifications.error('Erro ao carregar saldo do cliente')
      balance.value = 0
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  /**
   * Load customer debts
   */
  const loadDebts = async (
    customerId: number,
    filters?: {
      page?: number
      per_page?: number
      type?: 'debit' | 'payment'
    }
  ) => {
    try {
      loading.setLoading(true)
      error.value = null
      
      const params = {
        page: filters?.page || currentPage.value,
        per_page: filters?.per_page || perPage.value,
        type: filters?.type
      }
      
      const response = await customersService.getDebts(customerId, params)
      
      // Update balance from response
      if (response.current_balance !== undefined) {
        balance.value = response.current_balance
      }
      
      // Extract debts from nested structure
      debts.value = response.debts.data
      currentPage.value = response.debts.current_page
      totalPages.value = response.debts.last_page
      totalDebts.value = response.debts.total
      
      return response
    } catch (err: any) {
      error.value = 'Erro ao carregar histórico de débitos'
      notifications.error('Erro ao carregar histórico de débitos')
      debts.value = []
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  /**
   * Pay customer debt
   */
  const payDebt = async (customerId: number, data: PayDebtRequest): Promise<PayDebtResponse> => {
    try {
      loading.setLoading(true)
      error.value = null
      
      const response = await customersService.payDebt(customerId, data)
      
      // Update balance after payment
      if (response.customer.balance !== undefined) {
        balance.value = response.customer.balance
      }
      
      // Reload debts to show new payment
      await loadDebts(customerId)
      
      notifications.success('Pagamento registrado com sucesso!')
      
      return response
    } catch (err: any) {
      error.value = 'Erro ao registrar pagamento'
      notifications.error('Erro ao registrar pagamento')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  /**
   * Reset state
   */
  const reset = () => {
    balance.value = 0
    debts.value = []
    error.value = null
    currentPage.value = 1
    totalPages.value = 0
    totalDebts.value = 0
  }
  
  return {
    // State
    balance,
    debts,
    error,
    
    // Pagination state
    currentPage,
    perPage,
    totalPages,
    totalDebts,
    
    // Loading states
    isLoading,
    isPayingDebt,
    
    // Methods
    loadBalance,
    loadDebts,
    payDebt,
    reset
  }
}
