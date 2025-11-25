import { apiClient } from './client'
import type { 
  Customer, 
  PaginatedResponse, 
  CustomerFilters,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerIdentifyRequest,
  CustomerIdentifyResponse,
  MenuResponse,
  Order,
  CustomerBalanceResponse,
  CustomerDebtsResponse,
  PayDebtRequest,
  PayDebtResponse
} from '@/types/api'

export class CustomersService {
  /**
   * List customers with filters (Admin/Staff only)
   */
  async list(filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const url = queryString ? `/customers?${queryString}` : '/customers'
    
    return await apiClient.get<PaginatedResponse<Customer>>(url)
  }

  /**
   * Get all customers (simplified list)
   */
  async getAll(): Promise<Customer[]> {
    const response = await this.list({ per_page: 1000 })
    return response.data
  }

  /**
   * Get active customers only
   */
  async getActive(): Promise<Customer[]> {
    const response = await this.list({ is_active: true, per_page: 1000 })
    return response.data
  }

  /**
   * Get customer by ID
   */
  async getById(id: number): Promise<Customer> {
    return await apiClient.get<Customer>(`/customers/${id}`)
  }

  /**
   * Create new customer
   */
  async create(data: CreateCustomerRequest): Promise<Customer> {
    return await apiClient.post<Customer>('/customers', data)
  }

  /**
   * Update customer
   */
  async update(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    return await apiClient.put<Customer>(`/customers/${id}`, data)
  }

  /**
   * Delete customer
   */
  async delete(id: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/customers/${id}`)
  }

  /**
   * Toggle customer active status
   */
  async toggleActive(id: number): Promise<Customer> {
    const customer = await this.getById(id)
    return await this.update(id, { is_active: !customer.is_active })
  }

  /**
   * Search customers
   */
  async search(term: string): Promise<Customer[]> {
    const response = await this.list({ search: term, per_page: 50 })
    return response.data
  }

  /**
   * Identify customer by phone number
   */
  async identify(data: CustomerIdentifyRequest): Promise<CustomerIdentifyResponse> {
    return await apiClient.post<CustomerIdentifyResponse>('/customers/identify', data)
  }

  /**
   * Get customer orders
   */
  async getOrders(customerId: number): Promise<Order[]> {
    const response = await apiClient.get<{ orders: Order[] }>(`/customers/${customerId}/orders`)
    return response.orders
  }

  /**
   * Create order for customer
   */
  async createOrder(customerId: number, orderData: any): Promise<{ order: Order; message: string }> {
    return await apiClient.post<{ order: Order; message: string }>('/customers/orders', {
      customer_id: customerId,
      ...orderData
    })
  }

  /**
   * Get digital menu for customers
   */
  async getMenu(): Promise<MenuResponse> {
    return await apiClient.get<MenuResponse>('/customers/menu')
  }

  /**
   * Get customer by phone
   */
  async getByPhone(phone: string): Promise<Customer | null> {
    try {
      const response = await this.identify({ phone })
      return response.customer
    } catch {
      return null
    }
  }

  /**
   * Get customer by email
   */
  async getByEmail(email: string): Promise<Customer | null> {
    const customers = await this.getAll()
    return customers.find(customer => customer.email === email) || null
  }

  /**
   * Get top customers by spending
   */
  async getTopCustomers(limit: number = 10): Promise<Customer[]> {
    const customers = await this.getActive()
    // This would typically be handled by the backend
    // For now, return active customers
    return customers.slice(0, limit)
  }

  /**
   * Get customer balance
   */
  async getBalance(customerId: number): Promise<CustomerBalanceResponse> {
    return await apiClient.get<CustomerBalanceResponse>(`/customers/${customerId}/balance`)
  }

  /**
   * List customer debts with pagination and filters
   */
  async getDebts(
    customerId: number,
    params?: {
      page?: number
      per_page?: number
      type?: 'debit' | 'payment'
    }
  ): Promise<CustomerDebtsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.type) queryParams.append('type', params.type)

    const queryString = queryParams.toString()
    const url = queryString 
      ? `/customers/${customerId}/debts?${queryString}`
      : `/customers/${customerId}/debts`
    
    return await apiClient.get<CustomerDebtsResponse>(url)
  }

  /**
   * Pay customer debt
   */
  async payDebt(customerId: number, data: PayDebtRequest): Promise<PayDebtResponse> {
    return await apiClient.post<PayDebtResponse>(`/customers/${customerId}/pay-debt`, data)
  }
}

// Export singleton instance
export const customersService = new CustomersService()
export default customersService
