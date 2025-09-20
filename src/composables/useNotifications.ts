import { ref } from 'vue'

export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

/**
 * Composable para gerenciamento de notificações
 */
export function useNotifications() {
  const notifications = ref<Notification[]>([])

  const showNotification = (
    message: string, 
    type: Notification['type'] = 'info', 
    duration: number = 5000
  ) => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      duration
    }

    notifications.value.push(notification)

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, duration)
    }

    return notification.id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    notifications.value = []
  }

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAll
  }
}

