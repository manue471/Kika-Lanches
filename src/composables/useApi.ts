import { ref, computed, watch } from 'vue'
import { useLoading } from './useLoading'
import { useNotifications } from './useNotifications'
import type { PaginatedResponse } from '@/types/api'

export interface ApiOptions {
  autoLoad?: boolean
  showNotifications?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useApi<T = any>(
  apiFunction: () => Promise<T>,
  options: ApiOptions = {}
) {
  const {
    autoLoad = false,
    showNotifications = true,
    onSuccess,
    onError
  } = options

  const loading = useLoading<T>()
  const notifications = useNotifications()

  const load = async (showLoadingNotification = false) => {
    if (showLoadingNotification && showNotifications) {
      notifications.info('Carregando dados...')
    }

    const result = await loading.execute(apiFunction, {
      onSuccess: (data) => {
        onSuccess?.(data)
        if (showNotifications) {
          notifications.success('Dados carregados com sucesso!')
        }
      },
      onError: (error) => {
        onError?.(error)
        if (showNotifications) {
          notifications.error(`Erro ao carregar dados: ${error.message}`)
        }
      }
    })

    return result
  }

  const refresh = () => load()

  if (autoLoad) {
    load()
  }

  return {
    ...loading,
    load,
    refresh
  }
}

export function usePaginatedApi<T>(
  apiFunction: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
  options: ApiOptions = {}
) {
  const loading = useLoading<PaginatedResponse<T>>()
  const notifications = useNotifications()
  
  const currentPage = ref(1)
  const perPage = ref(10)
  const totalPages = ref(0)
  const total = ref(0)

  const {
    autoLoad = false,
    showNotifications = true,
    onSuccess,
    onError
  } = options

  const loadPage = async (page: number = currentPage.value) => {
    currentPage.value = page

    const result = await loading.execute(
      () => apiFunction(page, perPage.value),
      {
        onSuccess: (data) => {
          totalPages.value = data.last_page
          total.value = data.total
          onSuccess?.(data)
          if (showNotifications) {
            notifications.success('Dados carregados com sucesso!')
          }
        },
        onError: (error) => {
          onError?.(error)
          if (showNotifications) {
            notifications.error(`Erro ao carregar dados: ${error.message}`)
          }
        }
      }
    )

    return result
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      loadPage(currentPage.value + 1)
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      loadPage(currentPage.value - 1)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      loadPage(page)
    }
  }

  const changePerPage = (newPerPage: number) => {
    perPage.value = newPerPage
    loadPage(1) // Reset to first page
  }

  const pagination = computed(() => ({
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    perPage: perPage.value,
    total: total.value,
    hasNext: currentPage.value < totalPages.value,
    hasPrev: currentPage.value > 1,
    from: (currentPage.value - 1) * perPage.value + 1,
    to: Math.min(currentPage.value * perPage.value, total.value)
  }))

  if (autoLoad) {
    loadPage()
  }

  return {
    ...loading,
    currentPage: computed(() => currentPage.value),
    perPage: computed(() => perPage.value),
    totalPages: computed(() => totalPages.value),
    total: computed(() => total.value),
    pagination,
    loadPage,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    refresh: () => loadPage()
  }
}

export function useApiMutation<TData = any, TVariables = any>(
  mutationFunction: (variables: TVariables) => Promise<TData>,
  options: ApiOptions = {}
) {
  const loading = useLoading<TData>()
  const notifications = useNotifications()

  const {
    showNotifications = true,
    onSuccess,
    onError
  } = options

  const mutate = async (variables: TVariables, showSuccessNotification = true) => {
    const result = await loading.execute(
      () => mutationFunction(variables),
      {
        onSuccess: (data) => {
          onSuccess?.(data)
          if (showNotifications && showSuccessNotification) {
            notifications.success('Operação realizada com sucesso!')
          }
        },
        onError: (error) => {
          onError?.(error)
          if (showNotifications) {
            notifications.error(`Erro na operação: ${error.message}`)
          }
        }
      }
    )

    return result
  }

  return {
    ...loading,
    mutate
  }
}
