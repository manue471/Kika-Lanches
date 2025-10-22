<template>
  <BaseModal
    :show="show"
    title="Relatório do Cliente"
    size="lg"
    @update:show="$emit('update:show', $event)"
  >
    <div class="customer-report">
      <!-- Tabs Navigation -->
      <div class="tabs-navigation">
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          📊 Visão Geral
        </button>
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'orders' }"
          @click="activeTab = 'orders'"
        >
          🛒 Gerenciar Pedidos
        </button>
      </div>
      <!-- Loading State -->
      <BaseLoading 
        v-if="isLoading" 
        :show="isLoading"
        message="Carregando relatório..."
        variant="overlay"
      />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar relatório</h3>
        <p>{{ error }}</p>
        <BaseButton @click="$emit('refresh')" variant="secondary">
          Tentar novamente
        </BaseButton>
      </div>

      <!-- Report Content -->
      <div v-else-if="customerReport" class="report-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-content">
        <!-- Receipt Header -->
        <div class="receipt-header">
          <div class="company-info">
            <h2>🍔 Kika Lanches</h2>
            <p>Relatório de Cliente</p>
          </div>
          <div class="report-info">
            <p><strong>Período:</strong> {{ customerReport.period_info.period_label }}</p>
            <p><strong>Data:</strong> {{ formatDate(new Date()) }}</p>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="customer-info">
          <h3>📋 Dados do Cliente</h3>
          <div class="customer-details">
            <div class="detail-row">
              <span class="label">Nome:</span>
              <span class="value">{{ customerReport.customer.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">{{ customerReport.customer.email }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Telefone:</span>
              <span class="value">{{ customerReport.customer.phone }}</span>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary-section">
          <h3>📊 Resumo</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Total de Pedidos</span>
              <span class="summary-value">{{ customerReport.summary.total_orders }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Valor Total Gasto</span>
              <span class="summary-value">{{ formatCurrency(customerReport.summary.total_spent) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Ticket Médio</span>
              <span class="summary-value">{{ formatCurrency(customerReport.summary.average_order_value) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Último Pedido</span>
              <span class="summary-value">{{ formatDate(customerReport.summary.last_order_date) }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="orders-section">
          <h3>🛒 Pedidos Recentes</h3>
          <div v-if="customerReport.recent_orders.length === 0" class="no-orders">
            <p>Nenhum pedido encontrado no período selecionado.</p>
          </div>
          <div v-else class="orders-list">
            <div 
              v-for="order in customerReport.recent_orders" 
              :key="order.id"
              class="order-item"
            >
              <div class="order-header">
                <div class="order-info">
                  <span class="order-number">{{ order.order_number }}</span>
                  <span class="order-date">{{ formatDate(order.created_at) }}</span>
                </div>
                <div class="order-payment">
                  <span class="payment-icon">{{ getPaymentIcon(order.payment_method) }}</span>
                  <span class="payment-label">{{ getPaymentLabel(order.payment_method) }}</span>
                </div>
                <div class="order-status">
                  <StatusBadge :status="order.status" />
                </div>
                <div class="order-total">
                  {{ formatCurrency(order.total_amount) }}
                </div>
              </div>
              
              <!-- Order Products -->
              <div class="order-products">
                <div 
                  v-for="product in order.products" 
                  :key="product.id"
                  class="product-item"
                >
                  <span class="product-name">{{ product.name }} - Qtd: {{ product.quantity }} - {{ formatCurrency((product as any).unit_price) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Receipt Footer -->
        <div class="receipt-footer">
          <div class="footer-line"></div>
          <p class="footer-text">
            Relatório gerado em {{ formatDate(new Date()) }}<br>
            Período: {{ customerReport.period_info.date_range.from }} a {{ customerReport.period_info.date_range.to }}
          </p>
        </div>
        </div>

        <!-- Orders Management Tab -->
        <div v-else-if="activeTab === 'orders'" class="tab-content">
          <div class="orders-management">
            <!-- Header -->
            <div class="orders-header">
              <h3>Gerenciar Pedidos</h3>
              <p>Selecione os pedidos para atualizar o status em lote</p>
            </div>

            <!-- Bulk Actions -->
            <div class="bulk-actions" v-if="selectedOrders.length > 0">
              <div class="selected-info">
                <span>{{ selectedOrders.length }} pedido(s) selecionado(s)</span>
              </div>
              <div class="action-controls">
                <BaseInput
                  v-model="bulkNotes"
                  placeholder="Observações (opcional)"
                  class="notes-input"
                />
                <BaseButton
                  @click="markAsPaid"
                  variant="primary"
                  :loading="isUpdating"
                >
                  💰 Marcar como Pago
                </BaseButton>
              </div>
            </div>

            <!-- Orders List -->
            <div class="orders-list">
              <div v-if="customerReport.recent_orders.length === 0" class="no-orders">
                <p>Nenhum pedido encontrado no período selecionado.</p>
              </div>
              <div v-else class="orders-grid">
                <!-- Select All Option -->
                <div class="select-all-card">
                  <div class="select-all-checkbox">
                    <input
                      type="checkbox"
                      id="select-all"
                      :checked="isAllSelected"
                      :indeterminate="isIndeterminate"
                      @change="toggleSelectAll"
                      class="checkbox-input"
                    />
                    <label for="select-all" class="checkbox-label"></label>
                  </div>
                  <div class="select-all-content">
                    <span class="select-all-text">Selecionar todos os pedidos</span>
                    <span class="select-all-count">({{ customerReport.recent_orders.length }} pedidos)</span>
                  </div>
                </div>
                <div 
                  v-for="order in customerReport.recent_orders" 
                  :key="order.id"
                  class="order-card"
                  :class="{ selected: selectedOrders.includes(order.id) }"
                >
                  <div class="order-checkbox">
                    <input
                      type="checkbox"
                      :id="`order-${order.id}`"
                      :value="order.id"
                      v-model="selectedOrders"
                      class="checkbox-input"
                    />
                    <label :for="`order-${order.id}`" class="checkbox-label"></label>
                  </div>
                  
                  <div class="order-content">
                    <div class="order-header">
                      <div class="order-info">
                        <span class="order-number">{{ order.order_number }}</span>
                        <span class="order-date">{{ formatDate(order.created_at) }}</span>
                      </div>
                      <div class="order-payment">
                        <span class="payment-icon">{{ getPaymentIcon(order.payment_method) }}</span>
                        <span class="payment-label">{{ getPaymentLabel(order.payment_method) }}</span>
                      </div>
                      <div class="order-status">
                        <StatusBadge :status="order.status" />
                      </div>
                      <div class="order-total">
                        {{ formatCurrency(order.total_amount) }}
                      </div>
                    </div>
                    
                    <!-- Order Products -->
                      <div class="order-products">
                        <div 
                          v-for="product in order.products" 
                          :key="product.id"
                          class="product-item"
                        >
                          <span class="product-name">{{ product.name }} - Qtd: {{ product.quantity }} - {{ formatCurrency((product as any).unit_price) }}</span>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <div class="modal-actions-left">
          <BaseButton
            variant="info"
            @click="showPDFModal"
          >
            <span class="pdf-icon">📄</span>
            Gerar Relatório PDF
          </BaseButton>
        </div>
        <div class="modal-actions-right">
          <BaseButton
            variant="secondary"
            @click="$emit('update:show', false)"
          >
            Fechar
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- Customer PDF Modal -->
  <CustomerReportPDFModal
    :show="showCustomerPDFModal"
    :customer-id="customerId"
    :options="pdfOptions"
    @update:show="handlePDFClose"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useFormatter } from '@/composables/useUtils'
import { useNotifications } from '@/composables/useNotifications'
import { useLoading } from '@/composables/useLoading'
import { ordersService } from '@/services/api'
import BaseModal from '@/components/Base/Modal.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import StatusBadge from '@/components/Business/StatusBadge.vue'
import CustomerReportPDFModal from '@/components/Modals/CustomerReportPDFModal.vue'
import type { CustomerReportResponse, BulkUpdateRequest } from '@/types/api'

interface Props {
  show: boolean
  customerReport: CustomerReportResponse | null
  isLoading: boolean
  error: string | null
  // Filter options for ticket generation
  filters?: {
    period?: string
    status?: string
    payment_method?: string
    from_date?: string
    to_date?: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'refresh': []
}>()

const { currency, date } = useFormatter()
const { showNotification } = useNotifications()
const loading = useLoading()

// Tab state
const activeTab = ref<'overview' | 'orders'>('overview')

// Bulk update state
const selectedOrders = ref<number[]>([])
const bulkNotes = ref<string>('')
const isUpdating = computed(() => loading.isLoading.value)

// PDF modal state
const showCustomerPDFModal = ref(false)

// Select all logic
const isAllSelected = computed(() => {
  if (!props.customerReport?.recent_orders) return false
  return selectedOrders.value.length === props.customerReport.recent_orders.length && props.customerReport.recent_orders.length > 0
})

const isIndeterminate = computed(() => {
  if (!props.customerReport?.recent_orders) return false
  return selectedOrders.value.length > 0 && selectedOrders.value.length < props.customerReport.recent_orders.length
})

const toggleSelectAll = () => {
  if (!props.customerReport?.recent_orders) return
  
  if (isAllSelected.value) {
    // Deselect all
    selectedOrders.value = []
  } else {
    // Select all
    selectedOrders.value = props.customerReport.recent_orders.map((order: any) => order.id)
  }
}

// Watch for changes to update indeterminate state
watch([selectedOrders, () => props.customerReport?.recent_orders], async () => {
  await nextTick()
  const checkbox = document.getElementById('select-all') as HTMLInputElement
  if (checkbox) {
    checkbox.indeterminate = isIndeterminate.value
  }
}, { immediate: true })

const formatCurrency = (value: number) => currency(value)
const formatDate = (dateValue: string | Date) => date(dateValue)

// Payment method helpers
const getPaymentIcon = (paymentMethod: string) => {
  const icons: Record<string, string> = {
    cartao_credito: '💳',
    pix: '🔑',
    dinheiro: '💵',
    a_prazo: '📋'
  }
  return icons[paymentMethod] || '💰'
}

// PDF modal computed properties
const customerId = computed(() => props.customerReport?.customer?.id || null)

const pdfOptions = computed(() => {
  // Use the same filters that are used for the report
  return {
    limit: 10, // Default limit for PDF
    status: props.filters?.status,
    payment_method: props.filters?.payment_method,
    from_date: props.filters?.from_date,
    to_date: props.filters?.to_date,
    period: props.filters?.period
  }
})

const showPDFModal = () => {
  showCustomerPDFModal.value = true
}

const handlePDFClose = () => {
  showCustomerPDFModal.value = false
}


const getPaymentLabel = (paymentMethod: string) => {
  const labels: Record<string, string> = {
    cartao_credito: 'Cartão de Crédito',
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    a_prazo: 'À Prazo'
  }
  return labels[paymentMethod] || paymentMethod
}

// Mark as paid method
const markAsPaid = async () => {
  if (selectedOrders.value.length === 0) {
    showNotification('Selecione pelo menos um pedido', 'error')
    return
  }

  try {
    loading.setLoading(true)
    
    const updateData: BulkUpdateRequest = {
      order_ids: selectedOrders.value,
      status: 'paid',
      notes: bulkNotes.value || undefined
    }

    const response = await ordersService.bulkUpdateStatus(updateData)
    
    showNotification(response.message, 'success')
    
    // Clear selections
    selectedOrders.value = []
    bulkNotes.value = ''
    
    // Refresh the report
    emit('refresh')
  } catch (error) {
    console.error('Error updating orders:', error)
    showNotification('Erro ao marcar pedidos como pagos', 'error')
  } finally {
    loading.setLoading(false)
  }
}
</script>

<style lang="scss" scoped>
.customer-report {
  position: relative;
  min-height: 400px;
}

// Tabs Navigation
.tabs-navigation {
  display: flex;
  background: var(--gray-100);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  margin-bottom: 0;
  border-bottom: 1px solid var(--gray-200);
}

.tab-button {
  flex: 1;
  padding: var(--spacing-4) var(--spacing-6);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: var(--gray-600);
  transition: all var(--transition-fast);
  border-bottom: 3px solid transparent;

  &:hover {
    background: var(--gray-50);
    color: var(--gray-800);
  }

  &.active {
    color: var(--primary);
    background: white;
    border-bottom-color: var(--primary);
  }
}

.tab-content {
  background: var(--gray-50);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}

.error-state {
  text-align: center;
  padding: var(--spacing-8);
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-4);
  }
  
  h3 {
    color: var(--danger);
    margin-bottom: var(--spacing-2);
  }
  
  p {
    color: var(--gray-600);
    margin-bottom: var(--spacing-4);
  }
}

.report-content {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.receipt-header {
  background: var(--gray-50);
  color: black;
  padding: var(--spacing-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .company-info {
    h2 {
      margin: 0;
      font-size: var(--font-size-2xl);
      color: black;
      font-weight: 700;
    }
    
    p {
      margin: var(--spacing-1) 0 0 0;
      opacity: 0.9;
    }
  }
  
  .report-info {
    text-align: right;
    
    p {
      margin: var(--spacing-1) 0;
      font-size: var(--font-size-sm);
    }
  }
}

.customer-info {
  padding: var(--spacing-6);
  background: white;
  border-bottom: 1px solid var(--gray-200);
  
  h3 {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--gray-900);
    font-size: var(--font-size-lg);
    font-weight: 700;
  }
  
  .customer-details {
    display: grid;
    gap: var(--spacing-3);
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--gray-200);
    
    .label {
      font-weight: 600;
      color: var(--gray-800);
    }
    
    .value {
      color: var(--gray-900);
      font-weight: 500;
    }
  }
}

.summary-section {
  padding: var(--spacing-6);
  background: var(--gray-100);
  border-bottom: 1px solid var(--gray-200);
  
  h3 {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--gray-900);
    font-size: var(--font-size-lg);
    font-weight: 700;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }
  
  .summary-item {
    background: white;
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    text-align: center;
    border: 1px solid var(--gray-300);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    .summary-label {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--gray-700);
      margin-bottom: var(--spacing-2);
      font-weight: 500;
    }
    
    .summary-value {
      display: block;
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--primary);
    }
  }
}

.orders-section {
  padding: var(--spacing-6);
  background: white;
  
  h3 {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--gray-900);
    font-size: var(--font-size-lg);
    font-weight: 700;
  }
  
  .no-orders {
    text-align: center;
    padding: var(--spacing-8);
    color: var(--gray-600);
    font-weight: 500;
  }
  
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  
  .order-item {
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--gray-50);
    
    .order-header {
      background: var(--gray-100);
      padding: var(--spacing-4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-2);
      
      .order-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-1);
        
        .order-number {
          font-weight: 700;
          color: var(--gray-900);
          font-size: var(--font-size-base);
        }
        
        .order-date {
          font-size: var(--font-size-sm);
          color: var(--gray-700);
          font-weight: 500;
        }
      }
      
      .order-payment {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-2) var(--spacing-3);
        background: var(--gray-50);
        border-radius: var(--radius-md);
        border: 1px solid var(--gray-200);
        
        .payment-icon {
          font-size: var(--font-size-lg);
        }
        
        .payment-label {
          font-size: var(--font-size-sm);
          color: var(--gray-700);
          font-weight: 500;
        }
      }
      
      .order-total {
        font-weight: 700;
        font-size: var(--font-size-lg);
        color: var(--primary);
      }
    }
    
    .order-products {
      padding: var(--spacing-4);
      background: white;
      
      .product-item {
        padding: var(--spacing-2) 0;
        border-bottom: 1px solid var(--gray-200);
        
        &:last-child {
          border-bottom: none;
        }
        
        .product-name {
          font-weight: 600;
          color: var(--gray-900);
          font-size: var(--font-size-sm);
        }
      }
    }
  }
}

.receipt-footer {
  background: var(--gray-100);
  padding: var(--spacing-6);
  text-align: center;
  
  .footer-line {
    height: 1px;
    background: var(--gray-300);
    margin-bottom: var(--spacing-4);
  }
  
  .footer-text {
    font-size: var(--font-size-sm);
    color: var(--gray-700);
    margin: 0;
    line-height: 1.5;
    font-weight: 500;
  }
}

// Orders Management Tab Styles
.orders-management {
  padding: var(--spacing-6);
}

.orders-header {
  margin-bottom: var(--spacing-6);
  
  h3 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--gray-900);
    font-size: var(--font-size-xl);
    font-weight: 700;
  }
  
  p {
    margin: 0;
    color: var(--gray-600);
    font-size: var(--font-size-sm);
  }
}

.bulk-actions {
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  
  .selected-info {
    margin-bottom: var(--spacing-3);
    
    span {
      font-weight: 600;
      color: var(--primary-dark);
    }
  }
  
  .action-controls {
    display: flex;
    gap: var(--spacing-3);
    align-items: baseline;
    flex-wrap: wrap;
    
    .notes-input {
      flex: 1;
      min-width: 200px;
    }
  }
}

.orders-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.select-all-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  border: 2px solid var(--primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-2);
  
  .select-all-checkbox {
    display: flex;
    align-items: center;
    
    .checkbox-input {
      display: none;
    }
    
    .checkbox-label {
      width: 20px;
      height: 20px;
      border: 2px solid var(--gray-400);
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      background: white;
      
      &::after {
        content: '✓';
        color: white;
        font-weight: bold;
        font-size: 12px;
        opacity: 0;
        transition: opacity var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .checkbox-input:checked + .checkbox-label {
      background: var(--primary);
      border-color: var(--primary);
      
      &::after {
        color: white;
        opacity: 1;
      }
    }
    
    .checkbox-input:indeterminate + .checkbox-label {
      background: var(--primary);
      border-color: var(--primary);
      
      &::after {
        content: '−';
        color: white;
        opacity: 1;
      }
    }
  }
  
  .select-all-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    
    .select-all-text {
      font-weight: 600;
      color: var(--primary-dark);
      font-size: var(--font-size-base);
    }
    
    .select-all-count {
      font-size: var(--font-size-sm);
      color: var(--gray-600);
    }
  }
}

.order-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-4);
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  transition: all var(--transition-fast);
  
  &:hover {
    border-color: var(--gray-300);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &.selected {
    border-color: var(--primary);
  }
}

.order-checkbox {
  display: flex;
  align-items: center;
  margin-top: var(--spacing-1);
  
  .checkbox-input {
    display: none;
  }
  
  .checkbox-label {
    width: 20px;
    height: 20px;
    border: 2px solid var(--gray-400);
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    
            &::after {
              content: '✓';
              color: white;
              font-weight: bold;
              font-size: 12px;
              opacity: 0;
              transition: opacity var(--transition-fast);
              display: flex;
              align-items: center;
              justify-content: center;
            }
  }
  
          .checkbox-input:checked + .checkbox-label {
            background: var(--primary);
            border-color: var(--primary);
            
            &::after {
              color: white;
              opacity: 1;
            }
          }
}

.order-content {
  flex: 1;
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-3);
    flex-wrap: wrap;
    gap: var(--spacing-2);
    
    .order-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
      
      .order-number {
        font-weight: 700;
        color: var(--gray-900);
        font-size: var(--font-size-base);
      }
      
      .order-date {
        font-size: var(--font-size-sm);
        color: var(--gray-600);
        font-weight: 500;
      }
    }
    
    .order-payment {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-2) var(--spacing-3);
      background: var(--gray-50);
      border-radius: var(--radius-md);
      border: 1px solid var(--gray-200);
      
      .payment-icon {
        font-size: var(--font-size-lg);
      }
      
      .payment-label {
        font-size: var(--font-size-sm);
        color: var(--gray-700);
        font-weight: 500;
      }
    }
    
    .order-total {
      font-weight: 700;
      font-size: var(--font-size-lg);
      color: var(--primary);
    }
  }
  
          .order-products {
            .product-item {
              padding: var(--spacing-2) 0;
              border-bottom: 1px solid var(--gray-100);
              
              &:last-child {
                border-bottom: none;
              }
              
              .product-name {
                font-weight: 500;
                color: var(--gray-800);
                font-size: var(--font-size-sm);
              }
            }
          }
}

// Modal actions styles
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--gray-200);
  gap: var(--spacing-4);
}

.modal-actions-left {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.modal-actions-right {
  display: flex;
  gap: var(--spacing-3);
}

.pdf-icon {
  margin-right: var(--spacing-2);
}

// Mobile optimizations
@media (max-width: 768px) {
  .receipt-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-4);
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .order-header {
    flex-direction: column;
    align-items: stretch !important;
    gap: var(--spacing-3) !important;
  }
  
  .product-item {
    grid-template-columns: 1fr !important;
    text-align: left !important;
    
    .product-quantity,
    .product-price,
    .product-total {
      text-align: left !important;
    }
  }
  
  .tabs-navigation {
    flex-direction: column;
  }
  
  .tab-button {
    border-radius: 0;
    border-bottom: 1px solid var(--gray-200);
    
    &.active {
      border-bottom-color: var(--primary);
    }
  }
  
  .action-controls {
    flex-direction: column;
    align-items: stretch !important;
    
    .notes-input {
      min-width: auto !important;
    }
  }
  
  .order-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .order-checkbox {
    align-self: flex-start;
  }
  
  .select-all-card {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: var(--spacing-2) !important;
    
    .select-all-checkbox {
      align-self: center;
    }
  }
  
  .modal-actions {
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .modal-actions-left {
    flex-direction: column;
    width: 100%;
    
    > * {
      width: 100%;
    }
  }
  
  .modal-actions-right {
    width: 100%;
    
    > * {
      width: 100%;
    }
  }
}
</style>
