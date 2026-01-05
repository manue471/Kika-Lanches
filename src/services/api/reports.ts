import { apiClient } from './client'
import type { 
  Report, 
  PaginatedResponse,
  ReportFilters,
  FinancialReportFilters,
  SalesReportResponse,
  FinancialReportResponse,
  CustomersReportResponse,
  ProductsReportResponse,
  DashboardResponse,
  CustomerReportResponse,
  CustomerReportPeriod,
  DailyProductsResponse
} from '@/types/api'

export class ReportsService {
  /**
   * Get dashboard data
   */
  async getDashboard(): Promise<DashboardResponse> {
    return await apiClient.get<DashboardResponse>('/reports/dashboard')
  }

  /**
   * Get customer report
   */
  async getCustomerReport(
    customerId: number, 
    period?: CustomerReportPeriod,
    status?: string,
    limit?: number,
    payment_method?: string
  ): Promise<CustomerReportResponse> {
    const params = new URLSearchParams()
    if (period) params.append('period', period)
    if (status) params.append('status', status)
    if (limit) params.append('limit', limit.toString())
    if (payment_method) params.append('payment_method', payment_method)
    
    const queryString = params.toString()
    const url = `/reports/customer/${customerId}${queryString ? `?${queryString}` : ''}`
    
    return await apiClient.get<CustomerReportResponse>(url)
  }

  /**
   * Get sales report
   */
  async getSalesReport(filters: ReportFilters): Promise<SalesReportResponse> {
    const params = new URLSearchParams()
    
    // Required parameters
    if (filters.from) params.append('from', filters.from)
    if (filters.to) params.append('to', filters.to)
    
    // Optional parameters
    if (filters.status) params.append('status', filters.status)
    if (filters.save_report !== undefined) params.append('save_report', filters.save_report.toString())

    return await apiClient.get<SalesReportResponse>(`/reports/sales?${params.toString()}`)
  }

  /**
   * Get financial report
   */
  async getFinancialReport(filters: FinancialReportFilters = {}): Promise<FinancialReportResponse> {
    const params = new URLSearchParams()
    
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.save_report !== undefined) params.append('save_report', filters.save_report.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports/financial?${queryString}` : '/reports/financial'
    
    return await apiClient.get<FinancialReportResponse>(url)
  }

  /**
   * Get customers report
   */
  async getCustomersReport(filters: { is_active?: boolean; save_report?: boolean } = {}): Promise<CustomersReportResponse> {
    const params = new URLSearchParams()
    
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    if (filters.save_report !== undefined) params.append('save_report', filters.save_report.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports/customers?${queryString}` : '/reports/customers'
    
    return await apiClient.get<CustomersReportResponse>(url)
  }

  /**
   * Get products report
   */
  async getProductsReport(filters: { 
    category_id?: number; 
    is_active?: boolean; 
    save_report?: boolean 
  } = {}): Promise<ProductsReportResponse> {
    const params = new URLSearchParams()
    
    if (filters.category_id) params.append('category_id', filters.category_id.toString())
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    if (filters.save_report !== undefined) params.append('save_report', filters.save_report.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports/products?${queryString}` : '/reports/products'
    
    return await apiClient.get<ProductsReportResponse>(url)
  }

  /**
   * List saved reports
   */
  async list(filters: {
    type?: string;
    user_id?: number;
    per_page?: number;
    page?: number;
  } = {}): Promise<PaginatedResponse<Report>> {
    const params = new URLSearchParams()
    
    if (filters.type) params.append('type', filters.type)
    if (filters.user_id) params.append('user_id', filters.user_id.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const url = queryString ? `/reports?${queryString}` : '/reports'
    
    return await apiClient.get<PaginatedResponse<Report>>(url)
  }

  /**
   * Get report by ID
   */
  async getById(id: number): Promise<Report> {
    return await apiClient.get<Report>(`/reports/${id}`)
  }

  /**
   * Generate and save sales report
   */
  async generateSalesReport(filters: ReportFilters, save: boolean = true): Promise<Report> {
    const reportData = await this.getSalesReport(filters)
    
    if (save) {
      // This would typically be handled by the backend
      // For now, return a mock report
      return {
        id: Date.now(),
        tenant_id: 1,
        user_id: 1,
        type: 'sales',
        name: `Relatório de Vendas - ${filters.from} a ${filters.to}`,
        description: `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`,
        filters,
        data: reportData,
        generated_at: new Date().toISOString(),
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    throw new Error('Report not saved')
  }

  /**
   * Generate and save financial report
   */
  async generateFinancialReport(filters: FinancialReportFilters, save: boolean = true): Promise<Report> {
    const reportData = await this.getFinancialReport(filters)
    
    if (save) {
      // This would typically be handled by the backend
      // For now, return a mock report
      return {
        id: Date.now(),
        tenant_id: 1,
        user_id: 1,
        type: 'financial',
        name: `Relatório Financeiro - ${filters.start_date || 'Início'} a ${filters.end_date || 'Fim'}`,
        description: `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`,
        filters,
        data: reportData,
        generated_at: new Date().toISOString(),
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    throw new Error('Report not saved')
  }

  /**
   * Export report to CSV
   */
  async exportToCSV(reportId: number): Promise<Blob> {
    const report = await this.getById(reportId)
    
    // Convert report data to CSV format
    const csvData = this.convertToCSV(report.data)
    return new Blob([csvData], { type: 'text/csv' })
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return ''
      
      const headers = Object.keys(data[0])
      const csvHeaders = headers.join(',')
      const csvRows = data.map(row => 
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
      )
      
      return [csvHeaders, ...csvRows].join('\n')
    }
    
    return JSON.stringify(data)
  }

  /**
   * Get report types
   */
  getReportTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'sales', label: 'Vendas' },
      { value: 'financial', label: 'Financeiro' },
      { value: 'customers', label: 'Clientes' },
      { value: 'products', label: 'Produtos' },
      { value: 'inventory', label: 'Estoque' }
    ]
  }

  /**
   * Get report by type
   */
  async getByType(type: string): Promise<Report[]> {
    const response = await this.list({ type, per_page: 1000 })
    return response.data
  }

  /**
   * Delete report
   */
  async delete(id: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/reports/${id}`)
  }

  /**
   * Get customer report ticket
   */
  async getCustomerTicket(
    customerId: number,
    options?: {
      limit?: number
      status?: string
      payment_method?: string
      from_date?: string
      to_date?: string
      period?: string
    }
  ): Promise<{
    ticket: string
    customer_id: number
    filters: {
      period?: string | null
      status?: string | null
      payment_method?: string | null
      from_date?: string | null
      to_date?: string | null
    }
    summary: {
      total_orders: number
      total_amount: string
      pending_amount: string | number
    }
  }> {
    const params = new URLSearchParams()
    
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.status) params.append('status', options.status)
    if (options?.payment_method) params.append('payment_method', options.payment_method)
    if (options?.from_date) params.append('from_date', options.from_date)
    if (options?.to_date) params.append('to_date', options.to_date)
    if (options?.period) params.append('period', options.period)
    
    const queryString = params.toString()
    const url = `/reports/customer/${customerId}/ticket${queryString ? `?${queryString}` : ''}`
    
    return await apiClient.get(url)
  }

  /**
   * Get customer report PDF (view in browser)
   */
  async getCustomerReportPDF(
    customerId: number,
    options?: {
      limit?: number
      status?: string
      payment_method?: string
      from_date?: string
      to_date?: string
      period?: string
    }
  ): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.status) params.append('status', options.status)
    if (options?.payment_method) params.append('payment_method', options.payment_method)
    if (options?.from_date) params.append('from_date', options.from_date)
    if (options?.to_date) params.append('to_date', options.to_date)
    if (options?.period) params.append('period', options.period)
    
    const queryString = params.toString()
    const url = `/reports/customer/${customerId}/pdf${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.getRaw(url, {
      responseType: 'blob'
    })
    return response.data
  }

  /**
   * Download customer report PDF
   */
  async downloadCustomerReportPDF(
    customerId: number,
    options?: {
      limit?: number
      status?: string
      payment_method?: string
      from_date?: string
      to_date?: string
      period?: string
    }
  ): Promise<Blob> {
    const params = new URLSearchParams()
    
    // Add download parameter
    params.append('download', 'true')
    
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.status) params.append('status', options.status)
    if (options?.payment_method) params.append('payment_method', options.payment_method)
    if (options?.from_date) params.append('from_date', options.from_date)
    if (options?.to_date) params.append('to_date', options.to_date)
    if (options?.period) params.append('period', options.period)
    
    const queryString = params.toString()
    const url = `/reports/customer/${customerId}/pdf?${queryString}`
    
    const response = await apiClient.getRaw(url, {
      responseType: 'blob'
    })
    return response.data
  }

  /**
   * Get daily products sold
   */
  async getDailyProducts(options?: {
    date?: string
    period?: 'manha' | 'tarde'
  }): Promise<DailyProductsResponse> {
    const params = new URLSearchParams()
    
    if (options?.date) params.append('date', options.date)
    if (options?.period) params.append('period', options.period)
    
    const queryString = params.toString()
    const url = `/reports/daily-products${queryString ? `?${queryString}` : ''}`
    
    return await apiClient.get<DailyProductsResponse>(url)
  }
}

// Export singleton instance
export const reportsService = new ReportsService()
export default reportsService
