<template>
  <BaseModal
    :show="show"
    title="Relatório do Cliente"
    size="lg"
    @update:show="handleClose"
  >
    <div v-if="isLoading" class="loading-container">
      <BaseLoading :show="true" message="Gerando relatório..." />
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Erro ao gerar relatório</h3>
      <p>{{ error }}</p>
      <BaseButton variant="secondary" @click="handleClose">
        Fechar
      </BaseButton>
    </div>

    <div v-else class="report-content">
      <!-- PDF Actions -->
      <div class="pdf-actions">
        <div class="pdf-actions-header">
          <h3>📊 Relatório do Cliente</h3>
          <p>Escolha como deseja visualizar o relatório do cliente:</p>
        </div>
        
        <div class="pdf-actions-buttons">
          <BaseButton
            variant="info"
            size="lg"
            @click="viewPDF"
            :loading="isLoadingPDF"
            class="pdf-action-btn"
          >
            <span class="pdf-icon">📄</span>
            Ver PDF no Navegador
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="lg"
            @click="downloadPDF"
            :loading="isDownloading"
            class="pdf-action-btn"
          >
            <span class="download-icon">⬇️</span>
            Baixar PDF
          </BaseButton>
        </div>
        
        <div class="pdf-actions-footer">
          <BaseButton
            variant="secondary"
            @click="handleClose"
          >
            Fechar
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/Base/Modal.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import { reportsService } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'

interface Props {
  show: boolean
  customerId: number | null
  options?: {
    limit?: number
    status?: string
    payment_method?: string
    from_date?: string
    to_date?: string
    period?: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const { showNotification } = useNotifications()

// State
const isLoading = ref(false)
const isLoadingPDF = ref(false)
const isDownloading = ref(false)
const error = ref<string | null>(null)

// Methods
const viewPDF = async () => {
  if (!props.customerId) return

  isLoadingPDF.value = true
  error.value = null

  try {
    const pdfBlob = await reportsService.getCustomerReportPDF(props.customerId, props.options)
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    // Open PDF in new tab
    window.open(pdfUrl, '_blank')
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 1000)
    
    showNotification('PDF aberto em nova aba', 'success')
  } catch (err) {
    error.value = 'Erro ao carregar PDF do relatório'
    showNotification('Erro ao carregar PDF', 'error')
    console.error('Error fetching PDF:', err)
  } finally {
    isLoadingPDF.value = false
  }
}

const downloadPDF = async () => {
  if (!props.customerId) return

  isDownloading.value = true
  error.value = null

  try {
    const pdfBlob = await reportsService.downloadCustomerReportPDF(props.customerId, props.options)
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-cliente-${props.customerId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL
    URL.revokeObjectURL(url)
    
    showNotification('PDF baixado com sucesso', 'success')
  } catch (err) {
    error.value = 'Erro ao baixar PDF do relatório'
    showNotification('Erro ao baixar PDF', 'error')
    console.error('Error downloading PDF:', err)
  } finally {
    isDownloading.value = false
  }
}

// Event handlers
const handleClose = () => {
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
.report-content {
  .pdf-actions {
    text-align: center;
    padding: var(--spacing-6);
    
    .pdf-actions-header {
      margin-bottom: var(--spacing-6);
      
      h3 {
        margin: 0 0 var(--spacing-2) 0;
        color: var(--primary-dark);
        font-size: var(--font-size-xl);
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: var(--gray-600);
        font-size: var(--font-size-base);
      }
    }
    
    .pdf-actions-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
      margin-bottom: var(--spacing-6);
      
      .pdf-action-btn {
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
        padding: var(--spacing-4) var(--spacing-6);
        font-size: var(--font-size-lg);
        font-weight: 600;
        
        .pdf-icon,
        .download-icon {
          margin-right: var(--spacing-3);
          font-size: var(--font-size-xl);
        }
      }
    }
    
    .pdf-actions-footer {
      display: flex;
      justify-content: center;
    }
  }
}

.loading-container,
.error-container {
  text-align: center;
  padding: var(--spacing-8);
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-4);
  }
  
  h3 {
    margin: var(--spacing-2) 0;
    color: var(--gray-800);
  }
  
  p {
    color: var(--gray-600);
    margin-bottom: var(--spacing-4);
  }
}

// Responsive
@media (max-width: 768px) {
  .report-content {
    .pdf-actions {
      padding: var(--spacing-4);
      
      .pdf-actions-buttons {
        .pdf-action-btn {
          max-width: 100%;
          font-size: var(--font-size-base);
          padding: var(--spacing-3) var(--spacing-4);
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .report-content {
    .pdf-actions {
      padding: var(--spacing-3);
      
      .pdf-actions-header {
        margin-bottom: var(--spacing-4);
        
        h3 {
          font-size: var(--font-size-lg);
        }
        
        p {
          font-size: var(--font-size-sm);
        }
      }
      
      .pdf-actions-buttons {
        gap: var(--spacing-3);
        
        .pdf-action-btn {
          font-size: var(--font-size-sm);
          padding: var(--spacing-2) var(--spacing-3);
        }
      }
    }
  }
}
</style>
