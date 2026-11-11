<template>
  <div class="app-container">
    <Header :current-route="currentRoute" @navigate="handleNavigation" />

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'

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
  padding-left: 240px; // sidebar width
}

.main-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: var(--spacing-8) var(--spacing-6);
  width: 100%;
}

@media (max-width: 900px) {
  .app-container {
    padding-left: 0;
  }

  .main-content {
    padding: var(--spacing-4);
    padding-bottom: calc(64px + var(--spacing-6) + env(safe-area-inset-bottom)); // tab bar clearance
  }
}
</style>
