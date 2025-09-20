<template>
  <div class="app-container">
    <Header :current-route="currentRoute" @navigate="handleNavigation" />
    
    <main class="main-content">
      <slot />
    </main>
    
    <Footer />
    
    <!-- Notification Container -->
    <div class="notification-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
        >
          <div class="notification-content">
            <span class="notification-message">{{ notification.message }}</span>
            <button
              class="notification-close"
              @click="removeNotification(notification.id)"
              aria-label="Fechar notificação"
            >
              &times;
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import Header from './Header.vue'
import Footer from './Footer.vue'

interface Props {
  currentRoute: string
}

defineProps<Props>()

const emit = defineEmits<{
  navigate: [route: string]
}>()

const { notifications, removeNotification } = useNotifications()

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

.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  margin-bottom: var(--spacing-2);
  pointer-events: auto;
  transform: translateX(100%);
  transition: transform var(--transition-normal);
}

.notification-enter-active,
.notification-leave-active {
  transition: all var(--transition-normal);
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-enter-to,
.notification-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.notification-content {
  background: var(--white);
  border-left: 4px solid var(--primary-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-3);
}

.notification-success .notification-content {
  border-left-color: var(--success);
}

.notification-warning .notification-content {
  border-left-color: var(--warning);
}

.notification-error .notification-content {
  border-left-color: var(--danger);
}

.notification-message {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--gray-800);
}

.notification-close {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  color: var(--gray-500);
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--gray-100);
    color: var(--gray-700);
  }
}

@media (max-width: 480px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .notification {
    transform: translateY(-100%);
  }

  .notification-enter-from {
    transform: translateY(-100%);
  }

  .notification-leave-to {
    transform: translateY(-100%);
  }
}
</style>
