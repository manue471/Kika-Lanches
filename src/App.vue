<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppLayout from '@/components/Layout/AppLayout.vue'
import AuthLayout from '@/components/Layout/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const { initAuth } = useAuth()

// Get current route name from router
const currentRoute = computed(() => {
  return route.name as string || 'dashboard'
})

// Check if current route is auth route (login/register)
const isAuthRoute = computed(() => {
  return route.name === 'login' || route.name === 'register'
})

// Initialize auth on mount
onMounted(async () => {
  try {
    await initAuth()
  } catch (error) {
    console.error('Error initializing app:', error)
  }
})

const handleNavigation = (route: string) => {
  router.push({ name: route })
}
</script>

<template>
  <!-- Auth routes (login/register) with minimal layout -->
  <AuthLayout v-if="isAuthRoute">
    <RouterView />
  </AuthLayout>
  
  <!-- Protected routes with full layout -->
  <AppLayout v-else :current-route="currentRoute" @navigate="handleNavigation">
    <RouterView />
  </AppLayout>
</template>

<style>
@import '@/styles/main.scss';
</style>
