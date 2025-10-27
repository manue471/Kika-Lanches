import { ref, computed } from 'vue'
import { customersService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Customer } from '@/types/api'

export function useCustomerSearch() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const searchResults = ref<Customer[]>([])
  const searchTerm = ref('')
  const selectedCustomer = ref<Customer | null>(null)
  const isSearching = ref(false)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value || isSearching.value)
  
  // Methods
  const searchCustomers = async (term: string) => {
    if (!term || term.length < 2) {
      searchResults.value = []
      return
    }
    
    try {
      isSearching.value = true
      searchTerm.value = term
      
      const response = await customersService.list({
        search: term,
        per_page: 20,
        page: 1
      })
      
      searchResults.value = response.data
      
    } catch (err) {
      console.error('Error searching customers:', err)
      notifications.error('Erro ao buscar clientes')
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }
  
  const selectCustomer = (customer: Customer) => {
    selectedCustomer.value = customer
    searchTerm.value = customer.name
  }
  
  const clearSelection = () => {
    selectedCustomer.value = null
    searchTerm.value = ''
    searchResults.value = []
  }
  
  const reset = () => {
    searchResults.value = []
    searchTerm.value = ''
    selectedCustomer.value = null
    isSearching.value = false
  }
  
  return {
    // State
    searchResults,
    searchTerm,
    selectedCustomer,
    isSearching,
    
    // Computed
    isLoading,
    
    // Methods
    searchCustomers,
    selectCustomer,
    clearSelection,
    reset
  }
}
