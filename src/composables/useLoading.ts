import { ref, computed } from 'vue'

export interface LoadingState {
  isLoading: boolean
  error: string | null
  data: any
}

export function useLoading<T = any>(initialData: T | null = null) {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(initialData)

  const loadingState = computed<LoadingState>(() => ({
    isLoading: isLoading.value,
    error: error.value,
    data: data.value
  }))

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
    if (loading) {
      error.value = null
    }
  }

  const setError = (err: string | Error) => {
    error.value = err instanceof Error ? err.message : err
    isLoading.value = false
  }

  const setData = (newData: T | null) => {
    data.value = newData
    error.value = null
    isLoading.value = false
  }

  const reset = () => {
    isLoading.value = false
    error.value = null
    data.value = initialData
  }

  const execute = async <R>(
    asyncFn: () => Promise<R>,
    options: {
      onSuccess?: (result: R) => void
      onError?: (error: Error) => void
      resetOnStart?: boolean
    } = {}
  ): Promise<R | null> => {
    const { onSuccess, onError, resetOnStart = true } = options

    try {
      if (resetOnStart) {
        reset()
      }
      
      setLoading(true)
      const result = await asyncFn()
      setData(result as T)
      onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      return null
    }
  }

  return {
    // State
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    data: computed(() => data.value),
    loadingState,

    // Actions
    setLoading,
    setError,
    setData,
    reset,
    execute,

    // Computed
    hasError: computed(() => !!error.value),
    hasData: computed(() => data.value !== null),
    isEmpty: computed(() => data.value === null || data.value === undefined)
  }
}

// Multiple loading states manager
export function useMultipleLoading() {
  const loadingStates = ref<Record<string, LoadingState>>({})

  const getLoadingState = (key: string): LoadingState => {
    return loadingStates.value[key] || {
      isLoading: false,
      error: null,
      data: null
    }
  }

  const setLoading = (key: string, loading: boolean) => {
    if (!loadingStates.value[key]) {
      loadingStates.value[key] = {
        isLoading: false,
        error: null,
        data: null
      }
    }
    loadingStates.value[key].isLoading = loading
    if (loading) {
      loadingStates.value[key].error = null
    }
  }

  const setError = (key: string, error: string | Error) => {
    if (!loadingStates.value[key]) {
      loadingStates.value[key] = {
        isLoading: false,
        error: null,
        data: null
      }
    }
    loadingStates.value[key].error = error instanceof Error ? error.message : error
    loadingStates.value[key].isLoading = false
  }

  const setData = (key: string, data: any) => {
    if (!loadingStates.value[key]) {
      loadingStates.value[key] = {
        isLoading: false,
        error: null,
        data: null
      }
    }
    loadingStates.value[key].data = data
    loadingStates.value[key].error = null
    loadingStates.value[key].isLoading = false
  }

  const reset = (key: string) => {
    loadingStates.value[key] = {
      isLoading: false,
      error: null,
      data: null
    }
  }

  const isAnyLoading = computed(() => {
    return Object.values(loadingStates.value).some(state => state.isLoading)
  })

  const hasAnyError = computed(() => {
    return Object.values(loadingStates.value).some(state => !!state.error)
  })

  return {
    loadingStates: computed(() => loadingStates.value),
    getLoadingState,
    setLoading,
    setError,
    setData,
    reset,
    isAnyLoading,
    hasAnyError
  }
}
