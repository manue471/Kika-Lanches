import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('@/pages/Sales.vue')
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('@/pages/Products.vue')
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('@/pages/Customers.vue')
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/pages/Reports.vue')
    }
  ]
})

export default router
