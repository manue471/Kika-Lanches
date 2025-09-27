// API Types based on Swagger specification

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'tenant_owner' | 'staff' | 'client'
  tenant_id: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: number
  tenant_id: number
  name: string
  description?: string
  image?: string
  is_active: boolean
  sort_order: number
  products_count?: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  tenant_id: number
  category_id?: number
  name: string
  description?: string
  price: number
  sku?: string
  is_active: boolean
  stock?: number
  image?: string
  created_at?: string
  updated_at?: string
  category?: Category
}

export interface Customer {
  id: number
  tenant_id: number
  name: string
  email?: string
  phone?: string
  preferences?: Record<string, any>
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  product_id: number
  quantity: number
  price?: number
  product?: Product
}

export interface Order {
  id: number
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  tax_amount?: number
  shipping_amount?: number
  total_amount: number
  customer_id?: number
  user_id: number
  tenant_id: number
  products: OrderItem[]
  shipping_address?: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface Report {
  id: number
  tenant_id: number
  user_id: number
  type: 'sales' | 'financial' | 'customers' | 'products' | 'inventory'
  name: string
  description?: string
  filters: Record<string, any>
  data: Record<string, any>
  generated_at: string
  is_public: boolean
  created_at: string
  updated_at: string
}

// Request/Response Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  tenant_id?: number
  role?: 'admin' | 'tenant_owner' | 'staff' | 'client'
}

export interface AuthResponse {
  user: User
  token: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// Filter Types
export interface ProductFilters {
  search?: string
  category_id?: number
  is_active?: boolean
  per_page?: number
  page?: number
}

export interface CustomerFilters {
  search?: string
  is_active?: boolean
  per_page?: number
  page?: number
}

export interface CategoryFilters {
  search?: string
  is_active?: boolean
  per_page?: number
  page?: number
}

export interface ReportFilters {
  from: string
  to: string
  format?: 'json' | 'csv'
}

export interface FinancialReportFilters {
  start_date?: string
  end_date?: string
  save_report?: boolean
}

// Create/Update Types
export interface CreateCategoryRequest {
  name: string
  description?: string
  image?: string
  is_active?: boolean
  sort_order?: number
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  image?: string
  is_active?: boolean
  sort_order?: number
}

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  sku?: string
  category_id?: number
  is_active?: boolean
  stock?: number
  image?: string
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  sku?: string
  category_id?: number
  is_active?: boolean
  stock?: number
  image?: string
}

export interface CreateCustomerRequest {
  name: string
  email?: string
  phone?: string
  preferences?: Record<string, any>
  is_active?: boolean
}

export interface UpdateCustomerRequest {
  name?: string
  email?: string
  phone?: string
  preferences?: Record<string, any>
  is_active?: boolean
}

export interface CreateOrderRequest {
  customer_id?: number
  products: OrderItem[]
  shipping_address?: Record<string, any>
  tax_amount?: number
  shipping_amount?: number
  notes?: string
}

export interface CustomerIdentifyRequest {
  phone: string
  name?: string
  email?: string
}

export interface CustomerIdentifyResponse {
  customer: Customer
  is_new: boolean
}

export interface MenuResponse {
  tenant: Record<string, any>
  products: Product[]
}

export interface SalesReportResponse {
  period: {
    from: string
    to: string
  }
  summary: {
    total_orders: number
    total_revenue: number
    average_order_value: number
  }
  orders_by_status: Record<string, number>
  top_products: Array<{
    product_id: number
    product_name: string
    quantity_sold: number
    revenue: number
  }>
  daily_sales: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export interface FinancialReportResponse {
  summary: {
    total_revenue: number
    total_costs: number
    profit: number
    profit_margin: number
  }
  revenue_by_month: Record<string, number>
  period: {
    start_date: string
    end_date: string
  }
}

export interface CustomersReportResponse {
  summary: {
    total_customers: number
    active_customers: number
    new_customers: number
  }
  top_customers: Array<{
    customer_id: number
    customer_name: string
    total_orders: number
    total_spent: number
  }>
  customers: Customer[]
}

export interface ProductsReportResponse {
  summary: {
    total_products: number
    active_products: number
    low_stock_products: number
  }
  products_by_category: Record<string, number>
  products: Product[]
}
