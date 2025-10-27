import { ref, computed } from 'vue'
import { useNotifications } from '@/composables/useNotifications'

export function useWebShare() {
  const notifications = useNotifications()
  
  // State
  const isSharing = ref(false)
  
  // Computed
  const isSupported = computed(() => {
    return typeof navigator !== 'undefined' && 'share' in navigator
  })
  
  // Methods
  const shareFile = async (file: Blob, filename: string, title?: string, text?: string) => {
    if (!isSupported.value) {
      notifications.error('Compartilhamento não suportado neste dispositivo')
      return false
    }
    
    try {
      isSharing.value = true
      
      // Create a File object from the Blob
      const shareFile = new File([file], filename, { type: file.type })
      
      const shareData: ShareData = {
        title: title || filename,
        text: text || `Compartilhando ${filename}`,
        files: [shareFile]
      }
      
      await navigator.share(shareData)
      notifications.success('Arquivo compartilhado com sucesso!')
      return true
      
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing file:', error)
        notifications.error('Erro ao compartilhar arquivo')
      }
      return false
    } finally {
      isSharing.value = false
    }
  }
  
  const shareText = async (title: string, text: string, url?: string) => {
    if (!isSupported.value) {
      notifications.error('Compartilhamento não suportado neste dispositivo')
      return false
    }
    
    try {
      isSharing.value = true
      
      const shareData: ShareData = {
        title,
        text,
        url
      }
      
      await navigator.share(shareData)
      notifications.success('Conteúdo compartilhado com sucesso!')
      return true
      
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing text:', error)
        notifications.error('Erro ao compartilhar conteúdo')
      }
      return false
    } finally {
      isSharing.value = false
    }
  }
  
  const shareUrl = async (url: string, title?: string, text?: string) => {
    if (!isSupported.value) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        notifications.success('URL copiada para a área de transferência!')
        return true
      } catch (error) {
        notifications.error('Erro ao copiar URL')
        return false
      }
    }
    
    return await shareText(title || 'Compartilhar link', text || url, url)
  }
  
  return {
    // State
    isSharing,
    
    // Computed
    isSupported,
    
    // Methods
    shareFile,
    shareText,
    shareUrl
  }
}
