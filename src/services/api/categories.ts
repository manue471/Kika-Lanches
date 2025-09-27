import { apiClient } from './client'
import type { 
  Category, 
  PaginatedResponse, 
  CategoryFilters,
  CreateCategoryRequest,
  UpdateCategoryRequest 
} from '@/types/api'

export class CategoriesService {
  /**
   * List categories with filters
   */
  async list(filters: CategoryFilters = {}): Promise<PaginatedResponse<Category>> {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const url = queryString ? `/categories?${queryString}` : '/categories'
    
    return await apiClient.get<PaginatedResponse<Category>>(url)
  }

  /**
   * Get all categories (simplified list)
   */
  async getAll(): Promise<Category[]> {
    const response = await this.list({ per_page: 1000 })
    return response.data
  }

  /**
   * Get active categories only
   */
  async getActive(): Promise<Category[]> {
    const response = await this.list({ is_active: true, per_page: 1000 })
    return response.data
  }

  /**
   * Get category by ID
   */
  async getById(id: number): Promise<Category> {
    return await apiClient.get<Category>(`/categories/${id}`)
  }

  /**
   * Create new category
   */
  async create(data: CreateCategoryRequest): Promise<Category> {
    return await apiClient.post<Category>('/categories', data)
  }

  /**
   * Update category
   */
  async update(id: number, data: UpdateCategoryRequest): Promise<Category> {
    return await apiClient.put<Category>(`/categories/${id}`, data)
  }

  /**
   * Delete category
   */
  async delete(id: number): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/categories/${id}`)
  }

  /**
   * Toggle category active status
   */
  async toggleActive(id: number): Promise<Category> {
    const category = await this.getById(id)
    return await this.update(id, { is_active: !category.is_active })
  }

  /**
   * Update category sort order
   */
  async updateSortOrder(id: number, sortOrder: number): Promise<Category> {
    return await this.update(id, { sort_order: sortOrder })
  }

  /**
   * Search categories
   */
  async search(term: string): Promise<Category[]> {
    const response = await this.list({ search: term, per_page: 50 })
    return response.data
  }
}

// Export singleton instance
export const categoriesService = new CategoriesService()
export default categoriesService
