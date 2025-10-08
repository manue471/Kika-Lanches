<template>
  <BaseModal
    :show="show"
    title="Ticket do Relatório por Cliente"
    size="lg"
    @update:show="handleClose"
    class="customer-ticket-modal"
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
      <!-- Customer Info -->
      <div v-if="customerInfo" class="customer-info">
        <h3>{{ customerInfo.name }}</h3>
        <p v-if="customerInfo.phone">{{ customerInfo.phone }}</p>
        <p v-if="customerInfo.class">{{ customerInfo.class }}</p>
      </div>

      <!-- Filters and Summary -->
      <div v-if="ticketData" class="filters-summary">
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Total de Pedidos:</span>
            <span class="value">{{ ticketData.summary.total_orders }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Valor Total:</span>
            <span class="value">R$ {{ ticketData.summary.total_amount }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Valor Pendente:</span>
            <span class="value">R$ {{ formattedPendingAmount }}</span>
          </div>
        </div>
        
        <div v-if="hasActiveFilters" class="filters-info">
          <h4>Filtros Aplicados:</h4>
          <ul>
            <li v-if="ticketData.filters.period">Período: {{ ticketData.filters.period }}</li>
            <li v-if="ticketData.filters.status">Status: {{ ticketData.filters.status }}</li>
            <li v-if="ticketData.filters.payment_method">Pagamento: {{ ticketData.filters.payment_method }}</li>
            <li v-if="ticketData.filters.from_date">De: {{ ticketData.filters.from_date }}</li>
            <li v-if="ticketData.filters.to_date">Até: {{ ticketData.filters.to_date }}</li>
          </ul>
        </div>
      </div>

      <!-- Ticket Preview -->
      <div class="ticket-preview">
        <pre class="ticket-text">{{ ticketData?.ticket || '' }}</pre>
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
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/Base/Modal.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import { reportsService } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'

interface CustomerInfo {
  id: number
  name: string
  phone?: string
  class?: string
}

interface TicketOptions {
  limit?: number
  status?: string
  payment_method?: string
  from_date?: string
  to_date?: string
  period?: string
}

interface Props {
  show: boolean
  customerId: number | null
  customerInfo?: CustomerInfo | null
  options?: TicketOptions
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const { showNotification } = useNotifications()

// State
const ticketData = ref<{
  ticket: string
  customer_id: number
  filters: {
    period?: string | null
    status?: string | null
    payment_method?: string | null
    from_date?: string | null
    to_date?: string | null
  }
  summary: {
    total_orders: number
    total_amount: string
    pending_amount: string | number
  }
} | null>(null)
const isLoading = ref(false)
const isPrinting = ref(false)
const error = ref<string | null>(null)

// Computed
const hasActiveFilters = computed(() => {
  if (!ticketData.value) return false
  const filters = ticketData.value.filters
  return !!(filters.period || filters.status || filters.payment_method || filters.from_date || filters.to_date)
})

const formattedPendingAmount = computed(() => {
  if (!ticketData.value?.summary?.pending_amount) return '0,00'
  const amount = parseFloat(String(ticketData.value.summary.pending_amount))
  return isNaN(amount) ? '0,00' : amount.toFixed(2)
})

// Methods
const fetchTicket = async () => {
  if (!props.customerId) return

  isLoading.value = true
  error.value = null

  try {
    const response = await reportsService.getCustomerTicket(props.customerId, props.options)
    ticketData.value = response
  } catch (err) {
    error.value = 'Erro ao carregar ticket do relatório'
    showNotification('Erro ao carregar ticket', 'error')
    console.error('Error fetching customer ticket:', err)
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
          <title>Ticket do Relatório por Cliente</title>
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
          ${ticketData.value?.ticket || ''}
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

// Event handlers
const handleClose = () => {
  emit('update:show', false)
}

// Watch for customerId changes
watch(() => props.customerId, (newCustomerId) => {
  if (newCustomerId && props.show) {
    fetchTicket()
  }
})

// Watch for show changes
watch(() => props.show, (newShow) => {
  if (newShow && props.customerId) {
    fetchTicket()
  }
})

// Watch for options changes
watch(() => props.options, () => {
  if (props.show && props.customerId) {
    fetchTicket()
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.customer-ticket-modal {
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
  .customer-info {
    background: var(--gray-50);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    text-align: center;
    
    h3 {
      margin: 0 0 var(--spacing-2) 0;
      color: var(--primary-dark);
      font-size: var(--font-size-lg);
    }
    
    p {
      margin: var(--spacing-1) 0;
      color: var(--gray-600);
      font-size: var(--font-size-sm);
    }
  }

  .filters-summary {
    background: var(--gray-50);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--spacing-3);
      margin-bottom: var(--spacing-3);
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-2);
        background: var(--white);
        border-radius: var(--radius-sm);
        border: 1px solid var(--gray-200);
        
        .label {
          font-size: var(--font-size-sm);
          color: var(--gray-600);
        }
        
        .value {
          font-weight: 600;
          color: var(--primary-dark);
        }
      }
    }
    
    .filters-info {
      h4 {
        margin: 0 0 var(--spacing-2) 0;
        color: var(--gray-800);
        font-size: var(--font-size-sm);
      }
      
      ul {
        margin: 0;
        padding-left: var(--spacing-4);
        
        li {
          font-size: var(--font-size-sm);
          color: var(--gray-600);
          margin-bottom: var(--spacing-1);
        }
      }
    }
  }

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
    .filters-summary {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
    
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
