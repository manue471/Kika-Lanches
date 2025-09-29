import { ref, computed } from 'vue'
import { usersService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/api'

export function useUsers() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const users = ref<User[]>([])
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  
  // Methods
  const loadUsers = async () => {
    try {
      loading.setLoading(true)
      error.value = null
      console.log('Loading users...')
      const response = await usersService.list()
      console.log('Users response:', response)
      users.value = response.data
      console.log('Users set:', users.value)
    } catch (err) {
      console.error('Error loading users:', err)
      error.value = 'Erro ao carregar usuários'
      notifications.error('Erro ao carregar usuários')
    } finally {
      loading.setLoading(false)
    }
  }
  
  const createUser = async (userData: CreateUserRequest) => {
    try {
      loading.setLoading(true)
      console.log('Creating user:', userData)
      const response = await usersService.create(userData)
      console.log('User created:', response)
      notifications.success('Usuário criado com sucesso')
      return response
    } catch (err) {
      console.error('Error creating user:', err)
      notifications.error('Erro ao criar usuário')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const updateUser = async (id: number, userData: UpdateUserRequest) => {
    try {
      loading.setLoading(true)
      console.log('Updating user:', id, userData)
      const response = await usersService.update(id, userData)
      console.log('User updated:', response)
      notifications.success('Usuário atualizado com sucesso')
      return response
    } catch (err) {
      console.error('Error updating user:', err)
      notifications.error('Erro ao atualizar usuário')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const deleteUser = async (id: number) => {
    try {
      loading.setLoading(true)
      console.log('Deleting user:', id)
      await usersService.delete(id)
      console.log('User deleted')
      notifications.success('Usuário excluído com sucesso')
      // Reload users after deletion
      await loadUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      notifications.error('Erro ao excluir usuário')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const getUserById = async (id: number) => {
    try {
      loading.setLoading(true)
      const response = await usersService.getById(id)
      return response
    } catch (err) {
      notifications.error('Erro ao carregar usuário')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  return {
    // State
    users,
    error,
    
    // Computed
    isLoading,
    isCreating: computed(() => loading.isLoading.value),
    isUpdating: computed(() => loading.isLoading.value),
    
    // Methods
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    refresh: loadUsers
  }
}
