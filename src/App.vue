<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import { useTheme } from '@/composables/useStorage'
import AppLayout from '@/components/Layout/AppLayout.vue'
import Dashboard from '@/pages/Dashboard.vue'

const router = useRouter()
const { showNotification } = useNotifications()
const { initTheme } = useTheme()

const currentRoute = ref('dashboard')

// Initialize theme on mount
onMounted(() => {
  initTheme()
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
  <AppLayout :current-route="currentRoute" @navigate="handleNavigation">
    <RouterView @navigate="handleNavigation" @show-modal="handleShowModal" />
  </AppLayout>
</template>

<style>
@import '@/styles/main.scss';
</style>
