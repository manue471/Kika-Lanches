import { apiClient } from './client'
import type { 
  Product, 
  PaginatedResponse, 
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest 
} from '@/types/api'

export class ProductsService {
  /**
   * List products with filters
   */
  async list(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams()
    
    // Search
    if (filters.search) params.append('search', filters.search)
    
    // Category filters
    if (filters.category_id) params.append('category_id', filters.category_id.toString())
    if (filters.category_ids && filters.category_ids.length > 0) {
      params.append('category_ids', filters.category_ids.join(','))
    }
    
    // Price filters
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString())
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString())
    
    // Stock filters
    if (filters.in_stock !== undefined) params.append('in_stock', filters.in_stock.toString())
    
    // Sorting
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_order) params.append('sort_order', filters.sort_order)
    
    // Status
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    
    // Pagination
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const url = queryString ? `/products?${queryString}` : '/products'
    
    return await apiClient.get<PaginatedResponse<Product>>(url)
  }

  /**
   * Get all products (simplified list)
   */
  async getAll(): Promise<Product[]> {
    const response = await this.list({ per_page: 1000 })
    return response.data
  }

  /**
   * Get active products only
   */
  async getActive(): Promise<Product[]> {
    const response = await this.list({ is_active: true, per_page: 1000 })
    return response.data
  }

  /**
   * Get products by category
   */
  async getByCategory(categoryId: number): Promise<Product[]> {
    const response = await this.list({ category_id: categoryId, per_page: 1000 })
    return response.data
  }

  /**
   * Get product by ID
   */
  async getById(id: number): Promise<Product> {
    return await apiClient.get<Product>(`/products/${id}`)
  }

  /**
   * Create new product
   */
  async create(data: CreateProductRequest): Promise<Product> {
    return await apiClient.post<Product>('/products', data)
  }

  /**
   * Update product
   */
  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    return await apiClient.put<Product>(`/products/${id}`, data)
  }

  /**
   * Delete product
   */
  async delete(id: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/products/${id}`)
  }

  /**
   * Toggle product active status
   */
  async toggleActive(id: number): Promise<Product> {
    const product = await this.getById(id)
    return await this.update(id, { is_active: !product.is_active })
  }

  /**
   * Update product stock
   */
  async updateStock(id: number, stock_quantity: number): Promise<Product> {
    return await this.update(id, { stock_quantity })
  }

  /**
   * Search products
   */
  async search(term: string): Promise<Product[]> {
    const response = await this.list({ search: term, per_page: 50 })
    return response.data
  }

  /**
   * Get low stock products
   */
  async getLowStock(threshold: number = 5): Promise<Product[]> {
    const products = await this.getActive()
    return products.filter(product => 
      product.stock_quantity !== undefined && product.stock_quantity <= threshold
    )
  }

  /**
   * Get products by SKU
   */
  async getBySku(sku: string): Promise<Product | null> {
    const products = await this.getAll()
    return products.find(product => product.sku === sku) || null
  }
}

// Export singleton instance
export const productsService = new ProductsService()
export default productsService
