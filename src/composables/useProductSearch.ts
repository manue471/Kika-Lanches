import { ref, computed } from 'vue'
import { productsService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Product } from '@/types/api'

export function useProductSearch() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const searchResults = ref<Product[]>([])
  const searchTerm = ref('')
  const selectedProduct = ref<Product | null>(null)
  const isSearching = ref(false)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value || isSearching.value)
  
  // Methods
  const searchProducts = async (term: string) => {
    if (!term || term.length < 3) {
      searchResults.value = []
      return
    }
    
    try {
      isSearching.value = true
      searchTerm.value = term
      
      const response = await productsService.list({
        search: term,
        is_active: true, // Only search active products
        per_page: 20,
        page: 1
      })
      
      searchResults.value = response.data
      
    } catch (err) {
      console.error('Error searching products:', err)
      notifications.error('Erro ao buscar produtos')
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }
  
  const selectProduct = (product: Product) => {
    selectedProduct.value = product
    searchTerm.value = product.name
  }
  
  const clearSelection = () => {
    selectedProduct.value = null
    searchTerm.value = ''
    searchResults.value = []
  }
  
  const reset = () => {
    searchResults.value = []
    searchTerm.value = ''
    selectedProduct.value = null
    isSearching.value = false
  }
  
  return {
    // State
    searchResults,
    searchTerm,
    selectedProduct,
    isSearching,
    
    // Computed
    isLoading,
    
    // Methods
    searchProducts,
    selectProduct,
    clearSelection,
    reset
  }
}

