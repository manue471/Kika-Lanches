import { useToast, TYPE } from 'vue-toastification'

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default'

export function useNotifications() {
  const toast = useToast()

  const showNotification = (message: string, type: NotificationType = 'default') => {
    let toastType: TYPE

    switch (type) {
      case 'success':
        toastType = TYPE.SUCCESS
        break
      case 'error':
        toastType = TYPE.ERROR
        break
      case 'warning':
        toastType = TYPE.WARNING
        break
      case 'info':
        toastType = TYPE.INFO
        break
      default:
        toastType = TYPE.DEFAULT
    }

    toast(message, { type: toastType })
  }

  const success = (message: string) => {
    showNotification(message, 'success')
  }

  const error = (message: string) => {
    showNotification(message, 'error')
  }

  const warning = (message: string) => {
    showNotification(message, 'warning')
  }

  const info = (message: string) => {
    showNotification(message, 'info')
  }

  const clear = () => {
    toast.clear()
  }

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId)
  }

  return {
    showNotification,
    success,
    error,
    warning,
    info,
    clear,
    dismiss
  }
}