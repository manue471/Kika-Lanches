import { apiClient } from './client'
import type { 
  Order, 
  CreateOrderRequest,
  OrderItem
} from '@/types/api'

export class OrdersService {
  /**
   * List orders
   */
  async list(): Promise<Order[]> {
    return await apiClient.get<Order[]>('/orders')
  }

  /**
   * Create new order
   */
  async create(data: CreateOrderRequest): Promise<{ order: Order; message: string }> {
    return await apiClient.post<{ order: Order; message: string }>('/orders', data)
  }

  /**
   * Get order by ID
   */
  async getById(id: number): Promise<Order> {
    return await apiClient.get<Order>(`/orders/${id}`)
  }

  /**
   * Update order
   */
  async update(id: number, data: Partial<Order>): Promise<Order> {
    return await apiClient.put<Order>(`/orders/${id}`, data)
  }

  /**
   * Delete order
   */
  async delete(id: number): Promise<void> {
    return await apiClient.delete<void>(`/orders/${id}`)
  }

  /**
   * Update order status
   */
  async updateStatus(id: number, status: Order['status']): Promise<Order> {
    return await apiClient.put<Order>(`/orders/${id}`, { status })
  }

  /**
   * Cancel order
   */
  async cancel(id: number): Promise<Order> {
    return await this.updateStatus(id, 'cancelled')
  }

  /**
   * Confirm order
   */
  async confirm(id: number): Promise<Order> {
    return await this.updateStatus(id, 'confirmed')
  }

  /**
   * Mark order as processing
   */
  async processing(id: number): Promise<Order> {
    return await this.updateStatus(id, 'processing')
  }

  /**
   * Mark order as shipped
   */
  async shipped(id: number): Promise<Order> {
    return await this.updateStatus(id, 'shipped')
  }

  /**
   * Mark order as delivered
   */
  async delivered(id: number): Promise<Order> {
    return await this.updateStatus(id, 'delivered')
  }

  /**
   * Add items to order
   */
  async addItems(id: number, items: OrderItem[]): Promise<Order> {
    const order = await this.getById(id)
    const updatedItems = [...order.products, ...items]
    
    return await apiClient.put<Order>(`/orders/${id}`, {
      products: updatedItems
    })
  }

  /**
   * Remove items from order
   */
  async removeItems(id: number, productIds: number[]): Promise<Order> {
    const order = await this.getById(id)
    const updatedItems = order.products.filter(
      item => !productIds.includes(item.product_id)
    )
    
    return await apiClient.put<Order>(`/orders/${id}`, {
      products: updatedItems
    })
  }

  /**
   * Update order notes
   */
  async updateNotes(id: number, notes: string): Promise<Order> {
    return await apiClient.put<Order>(`/orders/${id}`, { notes })
  }

  /**
   * Calculate order total
   */
  calculateTotal(items: OrderItem[], taxRate: number = 0, shippingCost: number = 0): number {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price || 0) * item.quantity
    }, 0)
    
    const tax = subtotal * taxRate
    return subtotal + tax + shippingCost
  }

  /**
   * Validate order items
   */
  validateItems(items: OrderItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!items || items.length === 0) {
      errors.push('Pedido deve conter pelo menos um item')
    }
    
    items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Item ${index + 1}: ID do produto é obrigatório`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantidade deve ser maior que zero`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get order status history
   */
  async getStatusHistory(id: number): Promise<Array<{ status: string; timestamp: string }>> {
    // This would typically be handled by the backend
    // For now, return current status
    const order = await this.getById(id)
    return [{
      status: order.status,
      timestamp: order.updated_at
    }]
  }

  /**
   * Get orders by status
   */
  async getByStatus(status: Order['status']): Promise<Order[]> {
    // This would typically be handled by the backend
    // For now, return empty array
    return []
  }

  /**
   * Get orders by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    // This would typically be handled by the backend
    // For now, return empty array
    return []
  }
}

// Export singleton instance
export const ordersService = new OrdersService()
export default ordersService
