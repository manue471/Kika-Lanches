import { ref, computed } from 'vue'
import { customersService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Customer, CreateCustomerRequest, CustomerFilters } from '@/types/api'

export function useCustomers() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // Search and filters
  const searchTerm = ref('')
  const showOnlyActive = ref<boolean | undefined>(undefined)
  
  // Pagination state
  const currentPage = ref(1)
  const perPage = ref(20)
  const totalPages = ref(0)
  const totalCustomers = ref(0)
  const hasMorePages = ref(true)
  const isLoadingMore = ref(false)
  
  // State
  const customers = ref<Customer[]>([])
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const isCreating = computed(() => loading.isLoading.value)
  const isUpdating = computed(() => loading.isLoading.value)
  const isDeleting = computed(() => loading.isLoading.value)
  
  // Methods
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
      
      const filters: CustomerFilters = {
        search: searchTerm.value || undefined,
        is_active: showOnlyActive.value,
        per_page: perPage.value,
        page: currentPage.value
      }
      
      const response = await customersService.list(filters)
      
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
  
  const createCustomer = async (data: CreateCustomerRequest) => {
    try {
      loading.setLoading(true)
      const response = await customersService.create(data)
      customers.value.push(response)
      notifications.success('Cliente criado com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao criar cliente')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const updateCustomer = async (id: number, data: any) => {
    try {
      loading.setLoading(true)
      const response = await customersService.update(id, data)
      const index = customers.value.findIndex(customer => customer.id === id)
      if (index !== -1) {
        customers.value[index] = response
      }
      notifications.success('Cliente atualizado com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao atualizar cliente')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const deleteCustomer = async (id: number) => {
    try {
      loading.setLoading(true)
      await customersService.delete(id)
      customers.value = customers.value.filter(customer => customer.id !== id)
      notifications.success('Cliente excluído com sucesso!')
    } catch (err) {
      notifications.error('Erro ao excluir cliente')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  // Filter methods
  const searchCustomers = (term: string) => {
    searchTerm.value = term
    loadCustomers(true)
  }
  
  const toggleActiveFilter = () => {
    showOnlyActive.value = showOnlyActive.value === undefined ? true : undefined
    loadCustomers(true)
  }
  
  const clearFilters = () => {
    searchTerm.value = ''
    showOnlyActive.value = undefined
    loadCustomers(true)
  }
  
  const refreshCustomers = () => {
    loadCustomers(true)
  }
  
  // Initialize
  loadCustomers()
  
  return {
    // State
    customers,
    searchTerm,
    showOnlyActive,
    error,
    
    // Pagination state
    currentPage,
    perPage,
    totalPages,
    totalCustomers,
    hasMorePages,
    isLoadingMore,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Methods
    loadCustomers,
    loadMoreCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    toggleActiveFilter,
    clearFilters,
    refreshCustomers
  }
}