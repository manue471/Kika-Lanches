import { ref, computed } from 'vue'
import { ordersService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Order, CreateOrderRequest } from '@/types/api'

export function useOrders() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // Search and filters
  const searchTerm = ref('')
  const statusFilter = ref('')
  const startDate = ref('')
  const endDate = ref('')
  
  // State
  const orders = ref<Order[]>([])
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const isCreating = computed(() => loading.isLoading.value)
  const isUpdating = computed(() => loading.isLoading.value)
  const isDeleting = computed(() => loading.isLoading.value)
  
  // Methods
  const loadOrders = async () => {
    try {
      loading.setLoading(true)
      error.value = null
      const response = await ordersService.list()
      orders.value = response
    } catch (err) {
      error.value = 'Erro ao carregar pedidos'
      notifications.error('Erro ao carregar pedidos')
    } finally {
      loading.setLoading(false)
    }
  }
  
  const createOrder = async (data: CreateOrderRequest) => {
    try {
      loading.setLoading(true)
      const response = await ordersService.create(data)
      orders.value.push(response.order)
      notifications.success('Pedido criado com sucesso!')
      return response.order
    } catch (err) {
      notifications.error('Erro ao criar pedido')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const updateOrder = async (id: number, data: any) => {
    try {
      loading.setLoading(true)
      const response = await ordersService.update(id, data)
      const index = orders.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orders.value[index] = response
      }
      notifications.success('Pedido atualizado com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao atualizar pedido')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const deleteOrder = async (id: number) => {
    try {
      loading.setLoading(true)
      await ordersService.delete(id)
      orders.value = orders.value.filter(order => order.id !== id)
      notifications.success('Pedido excluído com sucesso!')
    } catch (err) {
      notifications.error('Erro ao excluir pedido')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const cancelOrder = async (id: number) => {
    try {
      loading.setLoading(true)
      const response = await ordersService.cancel(id)
      const index = orders.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orders.value[index] = response
      }
      notifications.success('Pedido cancelado com sucesso!')
      return response
    } catch (err) {
      notifications.error('Erro ao cancelar pedido')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  // Filter methods
  const searchOrders = (term: string) => {
    searchTerm.value = term
    loadOrders()
  }
  
  const filterByStatus = (status: string) => {
    statusFilter.value = status
    loadOrders()
  }
  
  const filterByDateRange = (start: string, end: string) => {
    startDate.value = start
    endDate.value = end
    loadOrders()
  }
  
  const clearFilters = () => {
    searchTerm.value = ''
    statusFilter.value = ''
    startDate.value = ''
    endDate.value = ''
    loadOrders()
  }
  
  // Initialize
  loadOrders()
  
  return {
    // State
    orders,
    searchTerm,
    statusFilter,
    startDate,
    endDate,
    error,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Methods
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    cancelOrder,
    searchOrders,
    filterByStatus,
    filterByDateRange,
    clearFilters
  }
}