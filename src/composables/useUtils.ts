/**
 * Composable com funções utilitárias migradas do utilities.js
 */

/**
 * Validação de dados
 */
export const useValidator = () => {
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    return phoneRegex.test(phone)
  }

  const isPositiveNumber = (value: number): boolean => {
    return !isNaN(value) && value > 0
  }

  const isRequired = (value: string): boolean => {
    return value !== null && value !== undefined && value.trim() !== ''
  }

  const isValidPrice = (price: number): boolean => {
    return isPositiveNumber(price) && price >= 0.01
  }

  const isValidStock = (stock: string | number): boolean => {
    return stock === '' || (Number.isInteger(Number(stock)) && Number(stock) >= 0)
  }

  return {
    isValidEmail,
    isValidPhone,
    isPositiveNumber,
    isRequired,
    isValidPrice,
    isValidStock
  }
}

/**
 * Formatação de dados
 */
export const useFormatter = () => {
  const currency = (value: number): string => {
    if (isNaN(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const date = (date: Date | string): string => {
    if (!date) return ''
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj)
  }

  const datetime = (date: Date | string): string => {
    if (!date) return ''
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  const phone = (phone: string): string => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const number = (value: number): string => {
    if (isNaN(value)) return '0'
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const percentage = (value: number): string => {
    if (isNaN(value)) return '0%'
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  const capitalize = (text: string): string => {
    if (!text) return ''
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const truncate = (text: string, length: number = 50): string => {
    if (!text) return ''
    return text.length > length ? text.substring(0, length) + '...' : text
  }

  return {
    currency,
    date,
    datetime,
    phone,
    number,
    percentage,
    capitalize,
    truncate
  }
}

/**
 * Utilitários de data
 */
export const useDateUtils = () => {
  const startOfDay = (date: Date = new Date()): Date => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const endOfDay = (date: Date = new Date()): Date => {
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    return end
  }

  const startOfWeek = (date: Date = new Date()): Date => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day
    start.setDate(diff)
    return startOfDay(start)
  }

  const endOfWeek = (date: Date = new Date()): Date => {
    const end = new Date(date)
    const day = end.getDay()
    const diff = end.getDate() + (6 - day)
    end.setDate(diff)
    return endOfDay(end)
  }

  const startOfMonth = (date: Date = new Date()): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const endOfMonth = (date: Date = new Date()): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isThisWeek = (date: Date): boolean => {
    const startWeek = startOfWeek()
    const endWeek = endOfWeek()
    return date >= startWeek && date <= endWeek
  }

  const isThisMonth = (date: Date): boolean => {
    const today = new Date()
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }

  const toInputFormat = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  return {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isToday,
    isThisWeek,
    isThisMonth,
    toInputFormat
  }
}

/**
 * Utilitários de array
 */
export const useArrayUtils = () => {
  const groupBy = <T>(array: T[], property: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const key = String(item[property])
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  const sortBy = <T>(array: T[], property: keyof T, ascending: boolean = true): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[property]
      const bVal = b[property]
      
      if (aVal < bVal) return ascending ? -1 : 1
      if (aVal > bVal) return ascending ? 1 : -1
      return 0
    })
  }

  const unique = <T>(array: T[]): T[] => {
    return [...new Set(array)]
  }

  const uniqueBy = <T>(array: T[], property: keyof T): T[] => {
    const seen = new Set()
    return array.filter(item => {
      const key = item[property]
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  const sumBy = <T>(array: T[], property: keyof T): number => {
    return array.reduce((sum, item) => sum + (Number(item[property]) || 0), 0)
  }

  const averageBy = <T>(array: T[], property: keyof T): number => {
    if (array.length === 0) return 0
    return sumBy(array, property) / array.length
  }

  const findBy = <T>(array: T[], property: keyof T, value: any): T | undefined => {
    return array.find(item => item[property] === value)
  }

  return {
    groupBy,
    sortBy,
    unique,
    uniqueBy,
    sumBy,
    averageBy,
    findBy
  }
}

/**
 * Utilitários matemáticos
 */
export const useMathUtils = () => {
  const round = (number: number, decimals: number = 2): number => {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  const percentage = (value: number, total: number): number => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  const percentageChange = (oldValue: number, newValue: number): number => {
    if (oldValue === 0) return newValue > 0 ? 100 : 0
    return ((newValue - oldValue) / oldValue) * 100
  }

  const clamp = (number: number, min: number, max: number): number => {
    return Math.min(Math.max(number, min), max)
  }

  return {
    round,
    percentage,
    percentageChange,
    clamp
  }
}

