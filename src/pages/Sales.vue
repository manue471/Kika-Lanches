<template>
  <div class="sales">
    <!-- Header -->
    <div class="sales-header">
      <h2>Gerenciar Vendas</h2>
      <BaseButton 
        variant="primary" 
        @click="createNewOrder"
        :loading="isCreating"
      >
        <span class="btn-icon">🛒</span>
        Nova Venda
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="filters-card">
      <div class="filters-grid">
        <BaseInput
          v-model="searchTerm"
          placeholder="Buscar vendas..."
          @input="handleSearch"
          class="search-input"
        />
        <BaseSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Todos os status"
          @change="handleStatusFilter"
        />
        <BaseSelect
          v-model="paymentMethodFilter"
          :options="paymentMethodOptions"
          placeholder="Todos os métodos de pagamento"
          @change="handlePaymentMethodFilter"
        />
        <BaseSelect
          v-model="timeRangeFilter"
          :options="timeRangeOptions"
          placeholder="Todos os horários"
          @change="handleTimeRangeFilter"
        />
        <div class="date-filters">
          <BaseInput
            v-model="startDate"
            type="date"
            label="Data Inicial"
            @change="handleDateFilter"
          />
          <BaseInput
            v-model="endDate"
            type="date"
            label="Data Final"
            @change="handleDateFilter"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Loading State -->
    <BaseLoading 
      v-if="isLoading" 
      message="Carregando vendas..."
      :show="isLoading"
      variant="overlay"
    />

    <!-- Error State -->
    <BaseCard v-if="error" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao carregar vendas</h3>
          <p>{{ error }}</p>
          <BaseButton @click="refresh" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Sales List -->
    <div v-else class="sales-list">
      <!-- Empty State -->
      <div v-if="!orders || orders.length === 0" class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Nenhuma venda encontrada</h3>
        <p>Comece criando sua primeira venda clicando no botão "Nova Venda"</p>
          <BaseButton 
            variant="primary" 
            @click="createNewOrder"
            :loading="isCreating"
          >
            <span class="btn-icon">🛒</span>
            Nova Venda
          </BaseButton>
      </div>

      <!-- Orders List -->
      <div v-else>
        <BaseCard
          v-for="order in orders"
          :key="order.id"
          class="order-card"
          :class="`status-${order.status}`"
        >
          <div class="order-header" v-if="order && order.id">
            <div class="order-info">
              <h3 class="order-number">{{ order.order_number }}</h3>
              <div class="customer-info" v-if="order.customer">
                <div class="customer-details">
                  <span class="customer-icon">👤</span>
                  <div class="customer-text">
                    <p class="customer-name">{{ order.customer.name }}</p>
                    <p class="customer-phone" v-if="order.customer.phone">{{ order.customer.phone }}</p>
                  </div>
                </div>
              </div>
              <p class="order-date">
                <span class="date-icon">📅</span>
                {{ formatDate(order.created_at) }}
              </p>
            </div>
            <div class="order-status">
              <StatusBadge :status="order.status" />
            </div>
          </div>

          <div class="order-items">
            <div 
              v-for="item in (order as any)?.order_products || []" 
              :key="item.id"
              class="order-item"
            >
              <div class="item-info">
                <span class="item-name">{{ item.product.name }}</span>
                <span class="item-quantity">x{{ item.quantity }}</span>
              </div>
              <span class="item-price">{{ formatCurrency(item.total_price) }}</span>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-summary">
              <div class="order-total">
                <span class="total-label">Total:</span>
                <span class="total-value">{{ formatCurrency(order.total_amount) }}</span>
              </div>
              <div class="payment-method">
                <span class="payment-icon">{{ getPaymentIcon(order.payment_method) }}</span>
                <span class="payment-label">{{ getPaymentLabel(order.payment_method) }}</span>
              </div>
            </div>
            <div class="order-actions">
              <BaseButton
                size="sm"
                variant="info"
                @click="viewOrder(order)"
              >
                Ver Detalhes
              </BaseButton>
              <BaseButton
                size="sm"
                variant="secondary"
                @click="editOrder(order)"
              >
                Editar
              </BaseButton>
              <BaseButton
                size="sm"
                variant="danger"
                @click="cancelOrderConfirm(order.id)"
                v-if="order.status === 'pending'"
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>


    <!-- Order Modal -->
    <OrderModal
      v-model:show="showOrderModal"
      :order-id="selectedOrderId"
      @success="handleOrderSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrders } from '@/composables/useOrders'
import { useFormatter } from '@/composables/useUtils'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import OrderModal from '../components/Modals/OrderModal.vue'
import StatusBadge from '@/components/Business/StatusBadge.vue'
import type { Order } from '@/types/api'

const {
  // State
  orders,
  searchTerm,
  statusFilter,
  paymentMethodFilter,
  startDate,
  endDate,
  timeRangeFilter,
  timePeriods,
  
  // Loading states
  isLoading,
  isCreating,
  
  // Errors
  error,
  
  // Methods
  searchOrders,
  filterByStatus,
  filterByPaymentMethod,
  filterByDateRange,
  filterByTimeRange,
  loadTimePeriods,
  cancelOrder,
  refresh
} = useOrders()

const { currency, date } = useFormatter()

// UI State
const showOrderModal = ref(false)
const selectedOrderId = ref<number | null>(null)

// Computed
const formatCurrency = currency
const formatDate = (dateString: string) => {
  return date(new Date(dateString))
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Processando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
]

const paymentMethodOptions = [
  { value: '', label: 'Todos os métodos de pagamento' },
  { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
  { value: 'pix', label: '🔑 PIX' },
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'a_prazo', label: '📋 À Prazo' }
]

// Time range options computed from API
const timeRangeOptions = computed(() => {
  const options = [{ value: '', label: 'Todos os horários' }]
  
  Object.entries(timePeriods.value).forEach(([, period]) => {
    options.push({
      value: period.time_range,
      label: `${period.label} (${period.time_range})`
    })
  })
  
  return options
})

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

const getPaymentLabel = (paymentMethod: string) => {
  const labels: Record<string, string> = {
    cartao_credito: 'Cartão de Crédito',
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    a_prazo: 'À Prazo'
  }
  return labels[paymentMethod] || paymentMethod
}

// Methods
const handleSearch = () => {
  searchOrders(searchTerm.value)
}

const handleStatusFilter = () => {
  filterByStatus(statusFilter.value)
}

const handleDateFilter = () => {
  if (startDate.value && endDate.value) {
    filterByDateRange(startDate.value, endDate.value)
  }
}

const handlePaymentMethodFilter = () => {
  filterByPaymentMethod(paymentMethodFilter.value)
}

const handleTimeRangeFilter = () => {
  filterByTimeRange(timeRangeFilter.value)
}


const createNewOrder = () => {
  selectedOrderId.value = null
  showOrderModal.value = true
}

const viewOrder = (order: Order) => {
  selectedOrderId.value = order.id
  showOrderModal.value = true
}

const editOrder = async (order: Order) => {
  console.log('Editing order:', order)
  selectedOrderId.value = order.id
  showOrderModal.value = true
  console.log('Modal should show:', showOrderModal.value)
}

const handleOrderSuccess = async () => {
  showOrderModal.value = false
  selectedOrderId.value = null
  await refresh()
}

const cancelOrderConfirm = async (id: number) => {
  if (confirm('Tem certeza que deseja cancelar este pedido?')) {
    await cancelOrder(id)
  }
}

// Initialize time periods on mount
onMounted(async () => {
  await loadTimePeriods()
})
</script>

<style lang="scss" scoped>
.sales {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.sales-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  
  h2 {
    margin: 0;
    color: var(--primary-dark);
  }
}

.filters-card {
  margin-bottom: var(--spacing-6);
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-4);
  align-items: end;
}

.search-input {
  min-width: 200px;
}

.date-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.error-card {
  margin-bottom: var(--spacing-6);
}

.error-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  
  .error-icon {
    font-size: var(--font-size-2xl);
  }
  
  h3 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--danger);
  }
  
  p {
    margin: 0 0 var(--spacing-3) 0;
    color: var(--gray-600);
  }
}

.sales-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.order-card {
  transition: all var(--transition-normal);

  margin: 8px 0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &.status-pending {
    border-left: 4px solid var(--warning);
  }
  
  &.status-confirmed {
    border-left: 4px solid var(--info);
  }
  
  &.status-processing {
    border-left: 4px solid var(--primary);
  }
  
  &.status-shipped {
    border-left: 4px solid var(--accent-light);
  }
  
  &.status-delivered {
    border-left: 4px solid var(--success);
  }
  
  &.status-cancelled {
    border-left: 4px solid var(--danger);
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
}

.order-info {
  flex: 1;
  
  .order-number {
    margin: 0 0 var(--spacing-3) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-dark);
  }
  
  .customer-info {
    margin-bottom: var(--spacing-2);
  }
  
  .customer-details {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2);
    background: var(--gray-50);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--primary);
  }
  
  .customer-icon {
    font-size: var(--font-size-xl);
    line-height: 1;
  }
  
  .customer-text {
    flex: 1;
  }
  
  .customer-name {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--gray-800);
    line-height: 1.4;
  }
  
  .customer-phone {
    margin: 2px 0 0 0;
    font-size: var(--font-size-sm);
    color: var(--gray-600);
    font-family: monospace;
  }
  
  .order-date {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--gray-600);
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
  }
  
  .date-icon {
    font-size: var(--font-size-base);
  }
}


.order-items {
  margin-bottom: var(--spacing-4);
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--gray-200);
  
  &:last-child {
    border-bottom: none;
  }
  
  .item-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    
    .item-name {
      font-weight: 500;
      color: var(--gray-800);
    }
    
    .item-quantity {
      font-size: var(--font-size-sm);
      color: var(--gray-600);
    }
  }
  
  .item-price {
    font-weight: 600;
    color: var(--primary-dark);
  }
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--gray-200);
  gap: var(--spacing-4);
  flex-wrap: wrap;
}

.order-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  flex: 1;
  min-width: 200px;
}

.order-total {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  
  .total-label {
    font-size: var(--font-size-sm);
    color: var(--gray-600);
  }
  
  .total-value {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--primary-dark);
  }
}

.payment-method {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  
  .payment-icon {
    font-size: var(--font-size-lg);
  }
  
  .payment-label {
    font-size: var(--font-size-sm);
    color: var(--gray-700);
    font-weight: 500;
  }
}

.order-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-12);
}

.empty-content {
  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-4);
  }
  
  h3 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--gray-700);
  }
  
  p {
    margin: 0 0 var(--spacing-6) 0;
    color: var(--gray-500);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .sales {
    padding: var(--spacing-4);
  }
  
  .sales-header {
    flex-direction: column;
    gap: var(--spacing-4);
    align-items: stretch;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
  }
  
  .date-filters {
    grid-template-columns: 1fr;
  }
  
  .order-header {
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .order-footer {
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: stretch;
  }
  
  .order-actions {
    justify-content: stretch;
    
    > * {
      flex: 1;
    }
  }
}

// Empty State Styles
.empty-state {
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-4);
  opacity: 0.6;
}

.empty-state h3 {
  color: var(--gray-700);
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-lg);
}

.empty-state p {
  color: var(--gray-500);
  margin-bottom: var(--spacing-6);
  font-size: var(--font-size-sm);
}

@media (max-width: 480px) {
  .sales {
    padding: var(--spacing-2);
  }
  
  .order-actions {
    flex-direction: column;
  }
}
</style>