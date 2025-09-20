import { ref, watch } from 'vue'

/**
 * Composable para gerenciamento de localStorage
 */
export function useStorage<T>(key: string, defaultValue: T) {
  const storedValue = localStorage.getItem(key)
  const value = ref<T>(
    storedValue ? JSON.parse(storedValue) : defaultValue
  )

  // Watch for changes and save to localStorage
  watch(
    value,
    (newValue) => {
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    { deep: true }
  )

  return value
}

/**
 * Composable para dados da aplicação
 */
export function useAppData() {
  const defaultData = {
    products: [],
    customers: [],
    sales: [],
    settings: {
      stockControl: true,
      lowStockThreshold: 5
    }
  }

  return useStorage('lancheOrganizado', defaultData)
}

/**
 * Composable para tema
 */
export function useTheme() {
  const theme = useStorage('theme', 'light')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  const initTheme = () => {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return {
    theme,
    toggleTheme,
    initTheme
  }
}

