<template>
  <BaseModal
    :show="show"
    title="Ticket do Pedido"
    size="lg"
    @update:show="handleClose"
    class="ticket-modal"
  >
    <div v-if="isLoading" class="loading-container">
      <BaseLoading :show="true" message="Gerando ticket..." />
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Erro ao gerar ticket</h3>
      <p>{{ error }}</p>
      <BaseButton variant="secondary" @click="handleClose">
        Fechar
      </BaseButton>
    </div>

    <div v-else class="ticket-content">
      <!-- Ticket Preview -->
      <div class="ticket-preview">
        <pre class="ticket-text">{{ ticketText }}</pre>
      </div>

      <!-- Actions -->
      <div class="ticket-actions">
        <BaseButton
          variant="secondary"
          @click="handleClose"
        >
          Fechar
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="printTicket"
          :loading="isPrinting"
        >
          <span class="print-icon">🖨️</span>
          Imprimir Ticket
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/Base/Modal.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import { ordersService } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'

interface Props {
  show: boolean
  orderId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const { showNotification } = useNotifications()

// State
const ticketText = ref('')
const isLoading = ref(false)
const isPrinting = ref(false)
const error = ref<string | null>(null)

// Methods
const fetchTicket = async () => {
  if (!props.orderId) return

  isLoading.value = true
  error.value = null

  try {
    const ticket = await ordersService.getTicket(props.orderId)
    ticketText.value = ticket
  } catch (err) {
    error.value = 'Erro ao carregar ticket do pedido'
    showNotification('Erro ao carregar ticket', 'error')
    console.error('Error fetching ticket:', err)
  } finally {
    isLoading.value = false
  }
}

const printTicket = () => {
  isPrinting.value = true

  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    
    if (!printWindow) {
      throw new Error('Não foi possível abrir a janela de impressão')
    }

    // Write the ticket content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket do Pedido</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 10px;
              white-space: pre-wrap;
              background: white;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${ticketText.value}
        </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
      isPrinting.value = false
      showNotification('Ticket enviado para impressão', 'success')
    }, 500)

  } catch (err) {
    isPrinting.value = false
    showNotification('Erro ao imprimir ticket', 'error')
    console.error('Print error:', err)
  }
}

// Watch for orderId changes
watch(() => props.orderId, (newOrderId) => {
  if (newOrderId && props.show) {
    fetchTicket()
  }
})

// Event handlers
const handleClose = () => {
  emit('update:show', false)
}

// Watch for show changes
watch(() => props.show, (newShow) => {
  if (newShow && props.orderId) {
    fetchTicket()
  }
})
</script>

<style lang="scss" scoped>
.ticket-modal {
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
}

.ticket-content {
  .ticket-preview {
    background: var(--white);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-6);
    max-height: 400px;
    overflow-y: auto;
    
    .ticket-text {
      font-family: 'Courier New', monospace;
      font-size: var(--font-size-sm);
      line-height: 1.2;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
      color: var(--gray-800);
      background: var(--gray-50);
      padding: var(--spacing-3);
      border-radius: var(--radius-sm);
      border: 1px solid var(--gray-200);
    }
  }
  
  .ticket-actions {
    display: flex;
    gap: var(--spacing-3);
    justify-content: flex-end;
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--gray-200);
    
    .print-icon {
      margin-right: var(--spacing-2);
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .ticket-content {
    .ticket-preview {
      max-height: 300px;
    }
    
    .ticket-actions {
      flex-direction: column;
      
      > * {
        width: 100%;
      }
    }
  }
}
</style>
