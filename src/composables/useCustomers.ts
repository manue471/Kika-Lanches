import { ref, computed } from 'vue'
import { customersService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Customer, CreateCustomerRequest } from '@/types/api'

export function useCustomers() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // Search and filters
  const searchTerm = ref('')
  const showOnlyActive = ref(true)
  
  // State
  const customers = ref<Customer[]>([])
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const isCreating = computed(() => loading.isLoading.value)
  const isUpdating = computed(() => loading.isLoading.value)
  const isDeleting = computed(() => loading.isLoading.value)
  
  // Methods
  const loadCustomers = async () => {
    try {
      loading.setLoading(true)
      error.value = null
      const response = await customersService.list()
      customers.value = response.data
    } catch (err) {
      error.value = 'Erro ao carregar clientes'
      notifications.error('Erro ao carregar clientes')
    } finally {
      loading.setLoading(false)
    }
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
    loadCustomers()
  }
  
  const toggleActiveFilter = () => {
    showOnlyActive.value = !showOnlyActive.value
    loadCustomers()
  }
  
  const clearFilters = () => {
    searchTerm.value = ''
    showOnlyActive.value = true
    loadCustomers()
  }
  
  // Initialize
  loadCustomers()
  
  return {
    // State
    customers,
    searchTerm,
    showOnlyActive,
    error,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Methods
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    toggleActiveFilter,
    clearFilters
  }
}