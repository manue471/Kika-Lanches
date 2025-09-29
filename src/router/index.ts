import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Auth routes
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { requiresGuest: true }
    },
    // Protected routes
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('@/pages/Sales.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('@/pages/Products.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/pages/Categories.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('@/pages/Customers.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/pages/Reports.vue'),
      meta: { requiresAuth: true }
    },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/pages/Users.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/customer-reports',
    name: 'customer-reports',
    component: () => import('@/pages/CustomerReports.vue'),
    meta: { requiresAuth: true }
  }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  // Simple token check without composables
  const getAuthTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'auth_token') {
        return value
      }
    }
    return null
  }
  
  // Get user role from localStorage (set during login)
  const getUserRole = (): string | null => {
    return localStorage.getItem('user_role')
  }
  
  const hasToken = !!getAuthTokenFromCookie()
  const userRole = getUserRole()
  
  if (requiresAuth && !hasToken) {
    // Redirect to login if not authenticated
    next('/login')
    return
  }
  
  if (requiresGuest && hasToken) {
    // Redirect to dashboard if already authenticated
    next('/')
    return
  }
  
  if (requiresAdmin && userRole !== 'admin') {
    // Redirect to dashboard if not admin
    next('/')
    return
  }
  
  next()
})

export default router
