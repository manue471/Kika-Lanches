// API Types based on Swagger specification

// Pagination types
export interface PaginationLink {
  url: string | null
  label: string
  page: number | null
  active: boolean
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: PaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'tenant_owner' | 'staff' | 'client'
  tenant_id: number
  is_active: boolean
  phone?: string
  created_at?: string
  updated_at?: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: 'admin' | 'tenant_owner' | 'staff' | 'client'
  phone?: string
  is_active?: boolean
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
  role?: 'admin' | 'tenant_owner' | 'staff' | 'client'
  phone?: string
  is_active?: boolean
}

// Customer Report Types
export interface CustomerReportResponse {
  customer: {
    id: number
    name: string
    email: string
    phone: string
  }
  summary: {
    total_orders: number
    total_spent: number
    average_order_value: number
    last_order_date: string
  }
  recent_orders: Array<{
    id: number
    order_number: string
    status: Order['status']
    total_amount: number
    created_at: string
    products: Array<{
      id: number
      name: string
      quantity: number
      price: number
      total_price: number
    }>
  }>
  filters: {
    limit: number
    status: string | null
    from_date: string
    to_date: string
    period: string
  }
  period_info: {
    applied_period: string
    date_range: {
      from: string
      to: string
    }
    period_label: string
  }
}

export type CustomerReportPeriod = 'last_week' | 'last_15_days' | 'last_month' | 'last_quarter'

// Bulk Update Types
export interface BulkUpdateRequest {
  order_ids: number[]
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'paid' | 'cancelled'
  notes?: string
}

export interface BulkUpdateResponse {
  message: string
  updated_count: number
  failed_count: number
  updated_orders: Array<{
    id: number
    order_number: string
    status: string
  }>
  failed_orders: Array<{
    id: number
    error: string
  }>
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

export interface Stock {
  id: number
  product_id: number
  quantity: number
  reserved_quantity: number
  min_stock_level: number
  allow_backorder: boolean
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
  stock_quantity?: number
  image?: string
  images?: string[]
  attributes?: Record<string, any>
  created_at?: string
  updated_at?: string
  category?: Category
  stock?: Stock
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
  tenant_id: number
  user_id?: number
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'paid' | 'cancelled'
  subtotal: number
  tax_amount?: number
  shipping_amount?: number
  total_amount: number
  customer_id: number
  shipping_address?: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  billing_address?: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  } | null
  notes?: string
  confirmed_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  user?: User | null
  order_products: OrderProduct[]
}

export interface OrderProduct {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  product_snapshot?: any
  created_at: string
  updated_at: string
  product: Product
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
  status?: Order['status']
  save_report?: boolean
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
  stock_quantity?: number
  image?: string
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  sku?: string
  category_id?: number
  is_active?: boolean
  stock_quantity?: number
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
    start_date: string
    end_date: string
  }
  summary: {
    total_sales: number
    total_orders: number
    average_order_value: number
  }
  orders_by_status: Record<Order['status'], {
    count: number
    total: number
  }>
  top_products: Array<{
    id: number
    name: string
    total_quantity: number
    total_revenue: number
  }>
}

export interface DashboardResponse {
  summary: {
    total_sales: number
    total_orders: number
    average_order_value: number
  }
  today: {
    revenue: number
    sales_count: number
    customers_served: number
  }
  this_month: {
    revenue: number
    sales_count: number
    customers_served: number
  }
  top_products: Array<{
    product_id: number
    name: string
    sku: string
    total_quantity: number
    total_revenue: number
  }>
  orders_by_status: Record<Order['status'], {
    count: number
    total: number
  }>
  daily_sales: Array<{
    date: string
    revenue: number
  }>
  period: {
    today: string
    month_start: string
    month_name: string
    week_start: string
  }
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
