import { ref, computed } from 'vue'
import { reportsService } from '@/services/api'
import { useLoading } from '@/composables/useLoading'
import { useNotifications } from '@/composables/useNotifications'
import type { Report, ReportFilters } from '@/types/api'

export function useReports() {
  const notifications = useNotifications()
  const loading = useLoading()
  
  // State
  const reports = ref<Report[]>([])
  const salesReport = ref<any>(null)
  const financialReport = ref<any>(null)
  const customersReport = ref<any>(null)
  const productsReport = ref<any>(null)
  const error = ref<string | null>(null)
  
  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  
  // Methods
  const loadReports = async () => {
    try {
      loading.setLoading(true)
      error.value = null
      const response = await reportsService.list()
      reports.value = Array.isArray(response) ? response : response.data || []
    } catch (err) {
      error.value = 'Erro ao carregar relatórios'
      notifications.error('Erro ao carregar relatórios')
    } finally {
      loading.setLoading(false)
    }
  }
  
  const getSalesReport = async (filters?: ReportFilters) => {
    try {
      loading.setLoading(true)
      console.log('Fetching sales report with filters:', filters)
      const response = await reportsService.getSalesReport(filters || { from: new Date().toISOString(), to: new Date().toISOString() })
      salesReport.value = response
      console.log('Sales report response:', response)
      return response
    } catch (err) {
      console.error('Error fetching sales report:', err)
      notifications.error('Erro ao gerar relatório de vendas')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const getFinancialReport = async (filters?: ReportFilters) => {
    try {
      loading.setLoading(true)
      const response = await reportsService.getFinancialReport(filters)
      financialReport.value = response
      return response
    } catch (err) {
      notifications.error('Erro ao gerar relatório financeiro')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const getCustomersReport = async (filters?: ReportFilters) => {
    try {
      loading.setLoading(true)
      const response = await reportsService.getCustomersReport(filters)
      customersReport.value = response
      return response
    } catch (err) {
      notifications.error('Erro ao gerar relatório de clientes')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const getProductsReport = async (filters?: ReportFilters) => {
    try {
      loading.setLoading(true)
      const response = await reportsService.getProductsReport(filters)
      productsReport.value = response
      return response
    } catch (err) {
      notifications.error('Erro ao gerar relatório de produtos')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const saveReport = async () => {
    try {
      loading.setLoading(true)
      throw new Error('Save method not implemented')
    } catch (err) {
      notifications.error('Erro ao salvar relatório')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  const deleteReport = async (id: number) => {
    try {
      loading.setLoading(true)
      await reportsService.delete(id)
      reports.value = reports.value.filter(report => report.id !== id)
      notifications.success('Relatório excluído com sucesso!')
    } catch (err) {
      notifications.error('Erro ao excluir relatório')
      throw err
    } finally {
      loading.setLoading(false)
    }
  }
  
  // Initialize
  loadReports()
  
  return {
    // State
    reports,
    salesReport,
    financialReport,
    customersReport,
    productsReport,
    error,
    
    // Loading states
    isLoading,
    
    // Methods
    loadReports,
    getSalesReport,
    getFinancialReport,
    getCustomersReport,
    getProductsReport,
    saveReport,
    deleteReport
  }
}