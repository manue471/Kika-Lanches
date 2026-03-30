<template>
  <div class="sales">
    <!-- Header -->
    <div class="sales-header">
      <h2>Gerenciar Vendas</h2>
      <div class="sales-header-actions">
        <router-link class="link-reports" to="/reports?section=products">📊 Relatório de produtos</router-link>
        <BaseButton 
          variant="primary" 
          @click="createNewOrder"
          :loading="isCreating"
        >
          <span class="btn-icon">🛒</span>
          Nova Venda
        </BaseButton>
      </div>
    </div>

    <div class="tab-content">
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

        <!-- Orders List (cards compactos) + scroll infinito -->
        <template v-else>
          <div class="orders-compact-grid">
            <BaseCard
              v-for="order in orders"
              :key="order.id"
              padding="sm"
              class="order-card-compact"
              :class="`status-${order.status}`"
            >
              <div v-if="order && order.id" class="compact-card-inner">
                <div class="compact-top">
                  <span class="compact-name">{{ order.customer?.name || 'Cliente' }}</span>
                  <span class="compact-total">{{ formatCurrency(order.total_amount) }}</span>
                </div>
                <p class="compact-items" :title="itemsSummaryFull(order)">
                  {{ itemsSummary(order) }}
                </p>
                <div class="compact-meta">
                  <span class="compact-status" :class="`st-${order.status}`">{{ getStatusShort(order.status) }}</span>
                </div>
                <div class="compact-actions">
                  <BaseButton size="sm" variant="info" class="compact-btn" @click="viewOrder(order)">
                    Ver
                  </BaseButton>
                  <BaseButton size="sm" variant="secondary" class="compact-btn" @click="editOrder(order)">
                    Editar
                  </BaseButton>
                  <BaseButton
                    v-if="order.status !== 'cancelled'"
                    size="sm"
                    variant="danger"
                    class="compact-btn"
                    @click="cancelOrderConfirm(order.id)"
                  >
                    Cancelar
                  </BaseButton>
                </div>
              </div>
            </BaseCard>
          </div>
          <div ref="loadMoreSentinel" class="load-more-sentinel" aria-hidden="true" />
          <p v-if="isLoadingMoreOrders" class="load-more-hint">Carregando mais pedidos…</p>
        </template>
      </div>
    </div>

    <!-- Order Modal -->
    <OrderModal
      v-model:show="showOrderModal"
      :order-id="selectedOrderId"
      :readonly="orderModalReadonly"
      @success="handleOrderSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useOrders } from '@/composables/useOrders'
import { useFormatter } from '@/composables/useUtils'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import OrderModal from '../components/Modals/OrderModal.vue'
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
  hasMoreOrders,
  isLoadingMoreOrders,

  // Errors
  error,

  // Methods
  loadMoreOrders,
  searchOrders,
  filterByStatus,
  filterByPaymentMethod,
  filterByDateRange,
  filterByTimeRange,
  loadTimePeriods,
  cancelOrder,
  refresh
} = useOrders()

const { currency } = useFormatter()

// UI State
const showOrderModal = ref(false)
const selectedOrderId = ref<number | null>(null)
/** true = botão Ver (só leitura); false = novo pedido ou Editar */
const orderModalReadonly = ref(false)
const loadMoreSentinel = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

// Computed
const formatCurrency = currency

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
  orderModalReadonly.value = false
  selectedOrderId.value = null
  showOrderModal.value = true
}

const viewOrder = (order: Order) => {
  orderModalReadonly.value = true
  selectedOrderId.value = order.id
  showOrderModal.value = true
}

const editOrder = (order: Order) => {
  orderModalReadonly.value = false
  selectedOrderId.value = order.id
  showOrderModal.value = true
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

const itemsSummaryFull = (order: Order) => {
  const items = (order as any)?.order_products || []
  if (!items.length) return 'Sem itens'
  return items
    .map((item: { product?: { name?: string }; quantity: number }) => `${item.product?.name || '?'} ×${item.quantity}`)
    .join(', ')
}

/** Texto curto para o card; evita estourar altura */
const itemsSummary = (order: Order) => {
  const full = itemsSummaryFull(order)
  const max = 72
  if (full.length <= max) return full
  return `${full.slice(0, max - 1)}…`
}

const getStatusShort = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Pend.',
    confirmed: 'Conf.',
    processing: 'Proc.',
    shipped: 'Env.',
    delivered: 'Entr.',
    cancelled: 'Canc.',
    paid: 'Pago'
  }
  return map[status] || status
}

const setupOrdersInfiniteScroll = () => {
  loadMoreObserver?.disconnect()
  if (!loadMoreSentinel.value) return
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (e?.isIntersecting && hasMoreOrders.value && !isLoadingMoreOrders.value && !isLoading.value) {
        loadMoreOrders()
      }
    },
    { root: null, rootMargin: '120px', threshold: 0 }
  )
  loadMoreObserver.observe(loadMoreSentinel.value)
}

watch(
  () => orders.value.length,
  () => {
    nextTick(() => {
      if (orders.value.length > 0) setupOrdersInfiniteScroll()
    })
  }
)

onMounted(async () => {
  await loadTimePeriods()
  await nextTick()
  if (orders.value.length > 0) setupOrdersInfiniteScroll()
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null
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
  flex-wrap: wrap;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  
  h2 {
    margin: 0;
    color: var(--primary-dark);
  }
}

.sales-header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.link-reports {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary-dark);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.tab-content {
  overflow: hidden;
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

/* Grid: até 3 cards lado a lado em telas largas */
.orders-compact-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

@media (min-width: 640px) {
  .orders-compact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .orders-compact-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.order-card-compact {
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &.status-pending {
    border-left: 3px solid var(--warning);
  }
  &.status-confirmed {
    border-left: 3px solid var(--info);
  }
  &.status-processing {
    border-left: 3px solid var(--primary);
  }
  &.status-shipped {
    border-left: 3px solid var(--accent-light);
  }
  &.status-delivered {
    border-left: 3px solid var(--success);
  }
  &.status-cancelled {
    border-left: 3px solid var(--danger);
  }
  &.status-paid {
    border-left: 3px solid var(--success);
  }
}

.order-card-compact :deep(.card-body) {
  padding: var(--spacing-3);
}

.compact-card-inner {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  min-height: 0;
}

.compact-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-2);
}

.compact-name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.25;
  min-width: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-total {
  font-size: var(--font-size-base);
  font-weight: 800;
  color: var(--primary-dark);
  white-space: nowrap;
  flex-shrink: 0;
}

.compact-items {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--gray-600);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-meta {
  display: flex;
  align-items: center;
}

.compact-status {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--gray-100);
  color: var(--gray-600);

  &.st-pending {
    background: rgba(245, 158, 11, 0.15);
    color: var(--warning);
  }
  &.st-confirmed,
  &.st-processing {
    background: rgba(59, 130, 246, 0.12);
    color: var(--info);
  }
  &.st-delivered,
  &.st-paid {
    background: rgba(34, 197, 94, 0.12);
    color: var(--success);
  }
  &.st-cancelled {
    background: rgba(239, 68, 68, 0.12);
    color: var(--danger);
  }
}

.compact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  margin-top: var(--spacing-1);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--gray-100);
}

.compact-btn {
  padding: 4px 8px !important;
  font-size: 11px !important;
  min-height: auto !important;
}

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

.load-more-sentinel {
  height: 1px;
  margin-top: var(--spacing-2);
}

.load-more-hint {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  margin: var(--spacing-3) 0 0;
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
  
  .compact-actions {
    justify-content: stretch;
    .compact-btn {
      flex: 1;
      justify-content: center;
    }
  }
}

@media (max-width: 480px) {
  .sales {
    padding: var(--spacing-2);
  }

  .compact-actions {
    flex-direction: column;
    .compact-btn {
      width: 100%;
    }
  }
}
</style>
