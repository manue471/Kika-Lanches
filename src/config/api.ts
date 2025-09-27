// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  tenantId: import.meta.env.VITE_TENANT_ID || '1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/login',
    register: '/register',
    logout: '/logout',
    me: '/me'
  },
  
  // Categories
  categories: {
    list: '/categories',
    create: '/categories',
    get: (id: number) => `/categories/${id}`,
    update: (id: number) => `/categories/${id}`,
    delete: (id: number) => `/categories/${id}`
  },
  
  // Products
  products: {
    list: '/products',
    create: '/products',
    get: (id: number) => `/products/${id}`,
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`
  },
  
  // Customers
  customers: {
    list: '/customers',
    create: '/customers',
    get: (id: number) => `/customers/${id}`,
    update: (id: number) => `/customers/${id}`,
    delete: (id: number) => `/customers/${id}`,
    identify: '/customers/identify',
    orders: (id: number) => `/customers/${id}/orders`,
    createOrder: '/customers/orders',
    menu: '/customers/menu'
  },
  
  // Orders
  orders: {
    create: '/orders',
    get: (id: number) => `/orders/${id}`,
    update: (id: number) => `/orders/${id}`,
    delete: (id: number) => `/orders/${id}`
  },
  
  // Reports
  reports: {
    list: '/reports',
    get: (id: number) => `/reports/${id}`,
    sales: '/reports/sales',
    financial: '/reports/financial',
    customers: '/reports/customers',
    products: '/reports/products'
  }
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  TIMEOUT: 'Tempo limite excedido. Tente novamente.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Acesso negado.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos.',
  SERVER_ERROR: 'Erro interno do servidor.',
  UNKNOWN_ERROR: 'Erro inesperado.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Criado com sucesso!',
  UPDATED: 'Atualizado com sucesso!',
  DELETED: 'Excluído com sucesso!',
  LOADED: 'Dados carregados com sucesso!',
  SAVED: 'Salvo com sucesso!',
  SENT: 'Enviado com sucesso!'
}
