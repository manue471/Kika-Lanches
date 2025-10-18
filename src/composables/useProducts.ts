import { ref, computed } from 'vue'
import { productsService, categoriesService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Product, CreateProductRequest, Category, ProductFilters } from '@/types/api'

export function useProducts() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // Search and filters
  const searchTerm = ref('')
  const selectedCategory = ref<number | undefined>(undefined)
  const selectedCategories = ref<number[]>([])
  const minPrice = ref<number | undefined>(undefined)
  const maxPrice = ref<number | undefined>(undefined)
  const inStock = ref<boolean | undefined>(undefined)
  const sortBy = ref<'name' | 'price' | 'created_at' | 'updated_at'>('created_at')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const showOnlyActive = ref<boolean | undefined>(undefined)
  
  // State
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const isCreating = computed(() => loading.isLoading.value)
  const isUpdating = computed(() => loading.isLoading.value)
  const isDeleting = computed(() => loading.isLoading.value)
  
  // Category options for dropdowns
  const categoryOptions = computed(() => {
    return categories.value.map(category => ({
      value: category.id,
      label: category.name
    }))
  })
  
  // Methods
  const loadProducts = async () => {
    try {
      loading.setLoading(true)
      error.value = null
      
      const filters: ProductFilters = {
        search: searchTerm.value || undefined,
        category_id: selectedCategory.value,
        category_ids: selectedCategories.value.length > 0 ? selectedCategories.value : undefined,
        min_price: minPrice.value,
        max_price: maxPrice.value,
        in_stock: inStock.value,
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        is_active: showOnlyActive.value,
        per_page: 50
      }
      
      const response = await productsService.list(filters)
      products.value = response.data
    } catch (err) {
      error.value = 'Erro ao carregar produtos'
      notifications.error('Erro ao carregar produtos')
    } finally {
      loading.setLoading(false)
    }
  }
  
  const loadCategories = async () => {
    try {
      const response = await categoriesService.list()
      categories.value = response.data
    } catch (err) {
      notifications.error('Erro ao carregar categorias')
    }
  }
  
  const createProduct = async (data: CreateProductRequest) => {
    try {
      loading.setLoading(true)
      const response = await productsService.create(data)
      products.value.push(response)
      notifications.success('Produto criado com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao criar produto')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const updateProduct = async (id: number, data: any) => {
    try {
      loading.setLoading(true)
      const response = await productsService.update(id, data)
      const index = products.value.findIndex(product => product.id === id)
      if (index !== -1) {
        products.value[index] = response
      }
      notifications.success('Produto atualizado com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao atualizar produto')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const getProduct = async (id: number) => {
    try {
      loading.setLoading(true)
      const response = await productsService.getById(id)
      return response
    } catch (err) {
      notifications.error('Erro ao carregar produto')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      loading.setLoading(true)
      await productsService.delete(id)
      products.value = products.value.filter(product => product.id !== id)
      notifications.success('Produto excluído com sucesso!')
    } catch (err) {
      notifications.error('Erro ao excluir produto')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  // Filter methods
  const searchProducts = (term: string) => {
    searchTerm.value = term
    loadProducts()
  }
  
  const filterByCategory = (categoryId: number | undefined) => {
    selectedCategory.value = categoryId
    loadProducts()
  }
  
  const filterByCategories = (categoryIds: number[]) => {
    selectedCategories.value = categoryIds
    loadProducts()
  }
  
  const filterByPriceRange = (min: number | undefined, max: number | undefined) => {
    minPrice.value = min
    maxPrice.value = max
    loadProducts()
  }
  
  const filterByStock = (inStockValue: boolean | undefined) => {
    inStock.value = inStockValue
    loadProducts()
  }
  
  const sortProducts = (by: 'name' | 'price' | 'created_at' | 'updated_at', order: 'asc' | 'desc') => {
    sortBy.value = by
    sortOrder.value = order
    loadProducts()
  }
  
  const toggleActiveFilter = () => {
    showOnlyActive.value = showOnlyActive.value === undefined ? true : undefined
    loadProducts()
  }
  
  const clearFilters = () => {
    searchTerm.value = ''
    selectedCategory.value = undefined
    selectedCategories.value = []
    minPrice.value = undefined
    maxPrice.value = undefined
    inStock.value = undefined
    sortBy.value = 'created_at'
    sortOrder.value = 'desc'
    showOnlyActive.value = undefined
    loadProducts()
  }
  
  const toggleActive = async (id: number) => {
    try {
      loading.setLoading(true)
      const product = products.value.find(p => p.id === id)
      if (product) {
        const updatedProduct = await productsService.update(id, { is_active: !product.is_active })
        const index = products.value.findIndex(p => p.id === id)
        if (index !== -1) {
          products.value[index] = updatedProduct
        }
        notifications.success('Status do produto atualizado!')
      }
    } catch (err) {
      notifications.error('Erro ao atualizar status do produto')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  // Initialize
  loadProducts()
  loadCategories()
  
  return {
    // State
    products,
    categories,
    searchTerm,
    selectedCategory,
    selectedCategories,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    sortOrder,
    showOnlyActive,
    error,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling: isUpdating,
    
    // Computed
    categoryOptions,
    
    // Methods
    loadProducts,
    loadCategories,
    createProduct,
    updateProduct,
    getProduct,
    deleteProduct,
    searchProducts,
    filterByCategory,
    filterByCategories,
    filterByPriceRange,
    filterByStock,
    sortProducts,
    toggleActiveFilter,
    toggleActive,
    refresh: loadProducts,
    clearFilters
  }
}