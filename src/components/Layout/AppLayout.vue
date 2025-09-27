<template>
  <div class="app-container">
    <Header :current-route="currentRoute" @navigate="handleNavigation" />
    
    <main class="main-content">
      <slot />
    </main>
    
    <Footer />
    
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'
import Footer from './Footer.vue'

interface Props {
  currentRoute: string
}

defineProps<Props>()

const emit = defineEmits<{
  navigate: [route: string]
}>()

const handleNavigation = (route: string) => {
  emit('navigate', route)
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-6) var(--spacing-4);
  width: 100%;
}


</style>
