import { apiClient } from './client'
import type { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  PaginatedResponse 
} from '@/types/api'

export class UsersService {
  /**
   * List all users
   */
  async list(): Promise<PaginatedResponse<User>> {
    return await apiClient.get<PaginatedResponse<User>>('/users')
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User> {
    return await apiClient.get<User>(`/users/${id}`)
  }

  /**
   * Create new user
   */
  async create(userData: CreateUserRequest): Promise<User> {
    return await apiClient.post<User>('/users', userData)
  }

  /**
   * Update user
   */
  async update(id: number, userData: UpdateUserRequest): Promise<User> {
    return await apiClient.put<User>(`/users/${id}`, userData)
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<void> {
    return await apiClient.delete<void>(`/users/${id}`)
  }

  /**
   * Get active users
   */
  async getActive(): Promise<User[]> {
    const response = await this.list()
    return response.data.filter(user => user.is_active)
  }

  /**
   * Get users by role
   */
  async getByRole(role: User['role']): Promise<User[]> {
    const response = await this.list()
    return response.data.filter(user => user.role === role)
  }
}

export const usersService = new UsersService()
