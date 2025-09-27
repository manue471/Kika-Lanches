import { ref, computed } from 'vue'
import { categoriesService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Category, CreateCategoryRequest } from '@/types/api'

export function useCategories() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const categories = ref<Category[]>([])
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const isCreating = computed(() => loading.isLoading.value)
  const isUpdating = computed(() => loading.isLoading.value)
  const isDeleting = computed(() => loading.isLoading.value)
  
  // Methods
  const loadCategories = async () => {
    try {
      loading.setLoading(true)
      error.value = null
      const response = await categoriesService.list()
      categories.value = response
    } catch (err) {
      error.value = 'Erro ao carregar categorias'
      notifications.error('Erro ao carregar categorias')
    } finally {
      loading.setLoading(false)
    }
  }
  
  const createCategory = async (data: CreateCategoryRequest) => {
    try {
      loading.setLoading(true)
      const response = await categoriesService.create(data)
      categories.value.push(response)
      notifications.success('Categoria criada com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao criar categoria')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const updateCategory = async (id: number, data: any) => {
    try {
      loading.setLoading(true)
      const response = await categoriesService.update(id, data)
      const index = categories.value.findIndex(category => category.id === id)
      if (index !== -1) {
        categories.value[index] = response
      }
      notifications.success('Categoria atualizada com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao atualizar categoria')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const deleteCategory = async (id: number) => {
    try {
      loading.setLoading(true)
      await categoriesService.delete(id)
      categories.value = categories.value.filter(category => category.id !== id)
      notifications.success('Categoria excluída com sucesso!')
    } catch (err) {
      notifications.error('Erro ao excluir categoria')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  // Initialize
  loadCategories()
  
  return {
    // State
    categories,
    error,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Methods
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
}