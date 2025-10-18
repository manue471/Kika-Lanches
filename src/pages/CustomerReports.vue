<template>
  <div class="customer-reports">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Relatórios de Clientes</h1>
        <p class="page-description">Visualize relatórios detalhados por cliente</p>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard class="filters-card">
      <div class="filters-content">
        <div class="filter-group">
          <label class="filter-label">Período</label>
          <BaseSelect
            v-model="selectedPeriod"
            :options="periodOptions"
            placeholder="Selecione o período"
          />
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <BaseSelect
            v-model="selectedStatus"
            :options="statusOptions"
            placeholder="Todos os status"
          />
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Limite</label>
          <BaseInput
            v-model="selectedLimit"
            type="number"
            placeholder="10"
            min="1"
            max="100"
          />
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Método de Pagamento</label>
          <BaseSelect
            v-model="selectedPaymentMethod"
            :options="paymentMethodOptions"
            placeholder="Todos os métodos"
          />
        </div>
        
        <BaseButton 
          @click="applyFilters"
          variant="primary"
          :loading="isLoading"
        >
          Aplicar Filtros
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Loading State -->
    <BaseLoading 
      v-if="isLoading" 
      :show="isLoading"
      message="Carregando clientes..."
      variant="overlay"
    />

    <!-- Error State -->
    <BaseCard v-if="error" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao carregar clientes</h3>
          <p>{{ error }}</p>
          <BaseButton @click="() => loadCustomers(true)" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Customers List -->
    <div v-else class="customers-list">
      <!-- Empty State -->
      <div v-if="!customers || customers.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Nenhum cliente encontrado</h3>
        <p>Não há clientes cadastrados no sistema.</p>
      </div>

      <!-- Customers Grid -->
      <div v-else class="customers-grid">
        <BaseCard
          v-for="customer in customers"
          :key="customer.id"
          class="customer-card"
          @click="openCustomerReport(customer)"
        >
          <div class="customer-info">
            <div class="customer-avatar">
              {{ customer.name.charAt(0).toUpperCase() }}
            </div>
            <div class="customer-details">
              <h3 class="customer-name">{{ customer.name }}</h3>
              <p class="customer-email">{{ customer.email }}</p>
              <p v-if="customer.phone" class="customer-phone">{{ customer.phone }}</p>
            </div>
          </div>
          
          <div class="customer-actions">
            <BaseButton 
              variant="primary" 
              size="sm"
              @click.stop="openCustomerReport(customer)"
            >
              📊 Ver Relatório
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Customer Report Modal -->
    <CustomerReportModal
      :show="showReportModal"
      :customer-report="customerReport"
      :is-loading="isLoadingReport"
      :error="reportError"
      :filters="currentFilters"
      @update:show="showReportModal = $event"
      @refresh="loadCustomerReport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCustomers } from '@/composables/useCustomers'
import { useCustomerReports } from '@/composables/useCustomerReports'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import CustomerReportModal from '@/components/Reports/CustomerReportModal.vue'
import type { Customer } from '@/types/api'

// Composables
const { customers, error, isLoading, loadCustomers } = useCustomers()
const { 
  customerReport, 
  selectedPeriod, 
  selectedStatus, 
  selectedLimit,
  selectedPaymentMethod,
  periodOptions,
  statusOptions,
  paymentMethodOptions,
  getCustomerReport,
  isLoading: isLoadingReport,
  error: reportError
} = useCustomerReports()

// State
const showReportModal = ref(false)
const selectedCustomer = ref<Customer | null>(null)

// Computed
const currentFilters = computed(() => ({
  period: selectedPeriod.value,
  status: selectedStatus.value || undefined,
  payment_method: selectedPaymentMethod.value || undefined,
  from_date: undefined, // Add date filters if needed
  to_date: undefined
}))

// Methods
const openCustomerReport = async (customer: Customer) => {
  selectedCustomer.value = customer
  showReportModal.value = true
  await loadCustomerReport(customer.id)
}

const loadCustomerReport = async (customerId?: number) => {
  if (customerId || selectedCustomer.value) {
    await getCustomerReport(customerId || selectedCustomer.value!.id)
  }
}

const applyFilters = () => {
  if (selectedCustomer.value) {
    loadCustomerReport()
  }
}

// Lifecycle
onMounted(() => {
  loadCustomers()
})
</script>

<style lang="scss" scoped>
.customer-reports {
  padding: var(--spacing-4);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-6);
  
  .header-content {
    text-align: center;
    
    .page-title {
      font-size: var(--font-size-3xl);
      color: var(--primary-dark);
      margin: 0 0 var(--spacing-2) 0;
      font-weight: 700;
    }
    
    .page-description {
      color: var(--gray-600);
      margin: 0;
      font-size: var(--font-size-lg);
    }
  }
}

.filters-card {
  margin-bottom: var(--spacing-6);
  
  .filters-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
    align-items: end;
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
      
      .filter-label {
        font-weight: 600;
        color: var(--gray-700);
        font-size: var(--font-size-sm);
      }
    }
  }
}

.error-card {
  margin-bottom: var(--spacing-6);
  
  .error-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    
    .error-icon {
      font-size: 2rem;
    }
    
    h3 {
      color: var(--danger);
      margin-bottom: var(--spacing-1);
    }
    
    p {
      color: var(--gray-600);
      margin-bottom: var(--spacing-3);
    }
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-8);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--gray-300);
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-4);
  }
  
  h3 {
    font-size: var(--font-size-xl);
    color: var(--gray-700);
    margin-bottom: var(--spacing-2);
  }
  
  p {
    color: var(--gray-600);
  }
}

.customers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-4);
}

.customer-card {
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid var(--gray-200);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--primary);
  }
  
  .customer-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    
    .customer-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--font-size-lg);
    }
    
    .customer-details {
      flex: 1;
      
      .customer-name {
        margin: 0 0 var(--spacing-1) 0;
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--gray-800);
      }
      
      .customer-email {
        margin: 0 0 var(--spacing-1) 0;
        color: var(--gray-600);
        font-size: var(--font-size-sm);
      }
      
      .customer-phone {
        margin: 0;
        color: var(--gray-500);
        font-size: var(--font-size-sm);
      }
    }
  }
  
  .customer-actions {
    display: flex;
    justify-content: center;
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .customer-reports {
    padding: var(--spacing-2);
  }
  
  .filters-content {
    grid-template-columns: 1fr !important;
  }
  
  .customers-grid {
    grid-template-columns: 1fr;
  }
  
  .customer-info {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-2) !important;
  }
}
</style>
