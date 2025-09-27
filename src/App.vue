<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import { useTheme } from '@/composables/useStorage'
import { useAuth } from '@/composables/useAuth'
import AppLayout from '@/components/Layout/AppLayout.vue'
import AuthLayout from '@/components/Layout/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const { showNotification } = useNotifications()
const { initTheme } = useTheme()
const { initAuth } = useAuth()

const currentRoute = ref('dashboard')

// Check if current route is auth route (login/register)
const isAuthRoute = computed(() => {
  return route.name === 'login' || route.name === 'register'
})

// Initialize theme and auth on mount
onMounted(async () => {
  initTheme()
  // Initialize auth without await to avoid blocking
  initAuth().catch(console.error)
})

const handleNavigation = (route: string) => {
  currentRoute.value = route
  router.push({ name: route })
}

const handleShowModal = (type: string) => {
  showNotification(`Modal ${type} será implementado em breve`, 'info')
}
</script>

<template>
  <!-- Auth routes (login/register) with minimal layout -->
  <AuthLayout v-if="isAuthRoute">
    <RouterView />
  </AuthLayout>
  
  <!-- Protected routes with full layout -->
  <AppLayout v-else :current-route="currentRoute" @navigate="handleNavigation">
    <RouterView @navigate="handleNavigation" @show-modal="handleShowModal" />
  </AppLayout>
</template>

<style>
@import '@/styles/main.scss';
</style>
