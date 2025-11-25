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
      <div v-else-if="customerReport && customerReport.customer" class="report-content">
        <!-- Overview Tab -->
        <template v-if="activeTab === 'overview'">
          <CustomerReportOverview 
            v-if="customerReport && customerReport.customer"
            :customer-report="customerReport" 
          />
        </template>

        <!-- Orders Management Tab - Debt Management -->
        <template v-else-if="activeTab === 'orders'">
          <CustomerReportDebts
            v-if="customerReport && customerReport.customer"
            :customer="customerReport.customer"
            :current-balance="currentBalance"
            :debts="debts"
            :is-loading="isLoadingDebts"
            :current-page="currentDebtPage"
            :total-pages="totalDebtPages"
            :debt-type-filter="debtTypeFilter"
            @open-pay-debt="openPayDebtModal"
            @filter-change="handleDebtFilterChange"
            @previous-page="loadPreviousPage"
            @next-page="loadNextPage"
          />
        </template>
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

  <!-- Pay Debt Modal -->
  <PayDebtModal
    v-if="customerReport?.customer"
    :show="showPayDebtModal"
    :customer="customerReport.customer"
    @update:show="showPayDebtModal = $event"
    @success="handlePayDebtSuccess"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useCustomerDebts } from '@/composables/useCustomerDebts'
import BaseModal from '@/components/Base/Modal.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import BaseButton from '@/components/Base/Button.vue'
import CustomerReportPDFModal from '@/components/Modals/CustomerReportPDFModal.vue'
import PayDebtModal from '@/components/Modals/PayDebtModal.vue'
import type { CustomerReportResponse } from '@/types/api'

// Async components to prevent initialization issues
const CustomerReportOverview = defineAsyncComponent(() => import('./CustomerReportOverview.vue'))
const CustomerReportDebts = defineAsyncComponent(() => import('./CustomerReportDebts.vue'))

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

// Tab state
const activeTab = ref<'overview' | 'orders'>('overview')

// Debt management state
const { 
  balance: currentBalance, 
  debts, 
  loadBalance, 
  loadDebts, 
  isLoading: isLoadingDebts,
  currentPage: currentDebtPage,
  totalPages: totalDebtPages,
  reset: resetDebts
} = useCustomerDebts()

const debtTypeFilter = ref<'debit' | 'payment' | undefined>(undefined)
const showPayDebtModal = ref(false)

// Handle debt filter change
const handleDebtFilterChange = (value: 'debit' | 'payment' | undefined) => {
  debtTypeFilter.value = value
  loadDebtHistory()
}

// PDF modal state
const showCustomerPDFModal = ref(false)

// Customer ID computed
const customerId = computed(() => props.customerReport?.customer?.id || null)

// Load debt balance and history
const loadDebtHistory = async () => {
  if (!customerId.value) return
  
  try {
    // Load balance first
    await loadBalance(customerId.value)
    
    // Then load debts history
    await loadDebts(customerId.value, {
      page: currentDebtPage.value,
      per_page: 10,
      type: debtTypeFilter.value
    })
  } catch (error) {
    console.error('Error loading debt history:', error)
  }
}

// Pagination handlers
const loadNextPage = async () => {
  if (currentDebtPage.value < totalDebtPages.value && customerId.value) {
    currentDebtPage.value++
    await loadDebtHistory()
  }
}

const loadPreviousPage = async () => {
  if (currentDebtPage.value > 1 && customerId.value) {
    currentDebtPage.value--
    await loadDebtHistory()
  }
}

// Watch for tab change to load debts when orders tab is activated
watch(() => activeTab.value, async (newTab) => {
  if (newTab === 'orders' && customerId.value) {
    await loadDebtHistory()
  }
})

// Watch for customer report changes
watch(() => props.customerReport?.customer?.id, async (newId) => {
  if (newId && activeTab.value === 'orders') {
    resetDebts()
    await loadDebtHistory()
  }
})

// Open pay debt modal
const openPayDebtModal = () => {
  if (customerId.value && currentBalance.value > 0) {
    showPayDebtModal.value = true
  }
}

// Handle pay debt success
const handlePayDebtSuccess = async () => {
  showPayDebtModal.value = false
  await loadDebtHistory()
  emit('refresh') // Refresh the report to update customer balance
}

// PDF modal computed properties
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

// Initialize debts when modal opens and orders tab is active
onMounted(async () => {
  if (activeTab.value === 'orders' && customerId.value) {
    await loadDebtHistory()
  }
})
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
