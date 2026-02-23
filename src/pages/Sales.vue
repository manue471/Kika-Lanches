<template>
  <div class="sales">
    <!-- Header -->
    <div class="sales-header">
      <h2>Gerenciar Vendas</h2>
      <BaseButton 
        v-if="activeTab === 'sales'"
        variant="primary" 
        @click="createNewOrder"
        :loading="isCreating"
      >
        <span class="btn-icon">🛒</span>
        Nova Venda
      </BaseButton>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs-navigation">
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'sales' }"
        @click="activeTab = 'sales'"
      >
        🛒 Vendas
      </button>
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'products' }"
        @click="activeTab = 'products'"
      >
        📦 Produtos Vendidos
      </button>
    </div>

    <!-- Sales Tab Content -->
    <div v-if="activeTab === 'sales'" class="tab-content">
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
                  v-if="order.status !== 'cancelled'"
                >
                  Cancelar
                </BaseButton>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- Products Sold Tab Content -->
    <div v-else-if="activeTab === 'products'" class="tab-content">
      <!-- Filters -->
      <BaseCard class="filters-card">
        <div class="products-filters-grid">
          <BaseInput
            v-model="productsDateFilter"
            type="date"
            label="Data"
            @change="loadDailyProducts"
          />
          <BaseSelect
            v-model="productsPeriodFilter"
            :options="periodOptions"
            placeholder="Período"
            @change="loadDailyProducts"
          />
          <div class="products-filters-actions">
            <BaseButton
              variant="secondary"
              :disabled="isExportingPdf"
              @click="exportDailyProductsPdf(false)"
            >
              {{ isExportingPdf ? 'Gerando...' : 'Ver PDF' }}
            </BaseButton>
            <BaseButton
              variant="primary"
              :disabled="isExportingPdf"
              @click="exportDailyProductsPdf(true)"
            >
              {{ isExportingPdf ? 'Gerando...' : 'Baixar PDF' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Loading State -->
      <BaseLoading 
        v-if="isLoadingProducts" 
        message="Carregando produtos vendidos..."
        :show="isLoadingProducts"
        variant="overlay"
      />

      <!-- Error State -->
      <BaseCard v-if="productsError" class="error-card">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <div>
            <h3>Erro ao carregar produtos vendidos</h3>
            <p>{{ productsError }}</p>
            <BaseButton @click="loadDailyProducts" variant="secondary">
              Tentar novamente
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Products Sold Content -->
      <div v-else-if="dailyProducts" class="products-sold-content">
        <!-- Summary Card -->
        <BaseCard class="summary-card">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Data</div>
              <div class="summary-value">{{ formatDate(dailyProducts.date) }}</div>
            </div>
            <div class="summary-item" v-if="dailyProducts.period_label">
              <div class="summary-label">Período</div>
              <div class="summary-value">{{ dailyProducts.period_label }}</div>
            </div>
            <div class="summary-item" v-if="dailyProducts.time_range">
              <div class="summary-label">Horário</div>
              <div class="summary-value">{{ dailyProducts.time_range.start }} - {{ dailyProducts.time_range.end }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total de Pedidos</div>
              <div class="summary-value highlight">{{ dailyProducts.total_orders }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total de Produtos Vendidos</div>
              <div class="summary-value highlight">{{ dailyProducts.total_products_sold }}</div>
            </div>
          </div>
        </BaseCard>

        <!-- Products List -->
        <BaseCard class="products-list-card">
          <h3 class="products-list-title">Produtos Vendidos</h3>
          
          <div v-if="dailyProducts.products.length === 0" class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>Nenhum produto vendido</h3>
            <p>Não há produtos vendidos no período selecionado</p>
          </div>

          <div v-else class="products-table">
            <div class="products-table-header">
              <div class="table-col col-product">Produto</div>
              <div class="table-col col-sku">SKU</div>
              <div class="table-col col-quantity">Quantidade</div>
              <div class="table-col col-price">Preço Unitário</div>
              <div class="table-col col-total">Total</div>
            </div>
            <div 
              v-for="product in dailyProducts.products" 
              :key="product.product_id"
              class="products-table-row"
            >
              <div class="table-col col-product">
                <strong>{{ product.name }}</strong>
              </div>
              <div class="table-col col-sku">
                {{ product.sku || '-' }}
              </div>
              <div class="table-col col-quantity">
                <span class="quantity-badge">{{ product.quantity_sold }}</span>
              </div>
              <div class="table-col col-price">
                {{ formatCurrency(product.unit_price) }}
              </div>
              <div class="table-col col-total">
                <strong>{{ formatCurrency(product.total_revenue) }}</strong>
              </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useOrders } from '@/composables/useOrders'
import { useFormatter } from '@/composables/useUtils'
import { reportsService } from '@/services/api/reports'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import OrderModal from '../components/Modals/OrderModal.vue'
import StatusBadge from '@/components/Business/StatusBadge.vue'
import type { Order, DailyProductsResponse } from '@/types/api'

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
const activeTab = ref<'sales' | 'products'>('sales')
const showOrderModal = ref(false)
const selectedOrderId = ref<number | null>(null)

// Products Sold State
const dailyProducts = ref<DailyProductsResponse | null>(null)
const isLoadingProducts = ref(false)
const isExportingPdf = ref(false)
const productsError = ref<string | null>(null)
const productsDateFilter = ref<string>(new Date().toISOString().split('T')[0])
const productsPeriodFilter = ref<'manha' | 'tarde' | ''>('')

const toast = useToast()

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

const periodOptions = [
  { value: '', label: 'Dia Inteiro' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' }
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

// Products Sold Methods
const loadDailyProducts = async () => {
  isLoadingProducts.value = true
  productsError.value = null
  
  try {
    const options: { date?: string; period?: 'manha' | 'tarde' } = {}
    
    if (productsDateFilter.value) {
      options.date = productsDateFilter.value
    }
    
    if (productsPeriodFilter.value) {
      options.period = productsPeriodFilter.value as 'manha' | 'tarde'
    }
    
    dailyProducts.value = await reportsService.getDailyProducts(options)
  } catch (err: any) {
    productsError.value = err?.message || 'Erro ao carregar produtos vendidos'
    console.error('Error loading daily products:', err)
  } finally {
    isLoadingProducts.value = false
  }
}

const exportDailyProductsPdf = async (download: boolean) => {
  isExportingPdf.value = true
  try {
    const options: { date?: string; period?: 'manha' | 'tarde'; download?: boolean } = {}
    if (productsDateFilter.value) options.date = productsDateFilter.value
    if (productsPeriodFilter.value) options.period = productsPeriodFilter.value as 'manha' | 'tarde'
    if (download) options.download = true

    const blob = await reportsService.getDailyProductsPdf(options)
    const url = URL.createObjectURL(blob)

    if (download) {
      const link = document.createElement('a')
      link.href = url
      link.download = `produtos-vendidos-${productsDateFilter.value || 'hoje'}${options.period ? `-${options.period}` : ''}.pdf`
      link.click()
      toast.success('PDF baixado com sucesso')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    URL.revokeObjectURL(url)
  } catch (err: any) {
    toast.error(err?.message || 'Erro ao gerar PDF')
    console.error('Error exporting daily products PDF:', err)
  } finally {
    isExportingPdf.value = false
  }
}

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'products' && !dailyProducts.value) {
    loadDailyProducts()
  }
})

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
  margin-bottom: var(--spacing-4);
  
  h2 {
    margin: 0;
    color: var(--primary-dark);
  }
}

// Tabs Navigation
.tabs-navigation {
  display: flex;
  background: var(--gray-100);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  margin-bottom: 0;
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: var(--spacing-6);
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

.filters-card {
  margin-bottom: var(--spacing-6);
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-4);
  align-items: end;
}

.products-filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-4);
  align-items: end;
}

.products-filters-actions {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
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

// Products Sold Styles
.products-sold-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.summary-card {
  margin-bottom: var(--spacing-6);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  
  .summary-label {
    font-size: var(--font-size-sm);
    color: var(--gray-600);
    font-weight: 500;
  }
  
  .summary-value {
    font-size: var(--font-size-lg);
    color: var(--gray-800);
    font-weight: 600;
    
    &.highlight {
      color: var(--primary);
      font-size: var(--font-size-xl);
    }
  }
}

.products-list-card {
  margin-bottom: var(--spacing-6);
}

.products-list-title {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--primary-dark);
  font-size: var(--font-size-lg);
}

.products-table {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.products-table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--gray-100);
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--gray-700);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.products-table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--gray-200);
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: var(--gray-50);
  }
}

.table-col {
  &.col-product {
    font-weight: 500;
  }
  
  &.col-quantity {
    text-align: center;
  }
  
  &.col-price,
  &.col-total {
    text-align: right;
  }
}

.quantity-badge {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--primary);
  color: white;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--font-size-sm);
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
  
  .filters-grid,
  .products-filters-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
  }

  .products-filters-actions {
    grid-column: 1;
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
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .products-table-header,
  .products-table-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-2);
  }
  
  .table-col {
    &.col-quantity,
    &.col-price,
    &.col-total {
      text-align: left;
    }
  }
  
  .products-table-header {
    display: none;
  }
  
  .products-table-row {
    padding: var(--spacing-3);
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-2);
    
    &::before {
      content: attr(data-label);
      font-weight: 600;
      font-size: var(--font-size-xs);
      color: var(--gray-600);
      text-transform: uppercase;
      margin-bottom: var(--spacing-1);
    }
  }
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
