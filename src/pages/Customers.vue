<template>
  <div class="customers">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Clientes</h1>
        <p class="page-description">Gerencie seus clientes</p>
        <div class="customer-stats" v-if="totalCustomers > 0">
          <span class="stats-text">{{ totalCustomers }} cliente{{ totalCustomers !== 1 ? 's' : '' }} encontrado{{ totalCustomers !== 1 ? 's' : '' }}</span>
        </div>
      </div>
      <BaseButton 
        variant="primary" 
        @click="createNewCustomer"
        :loading="isCreating"
      >
        <span class="btn-icon">👥</span>
        Novo Cliente
      </BaseButton>
    </div>

    <!-- Search and Filters -->
    <BaseCard class="filters-card">
      <div class="filters-header">
        <h3>Filtros</h3>
        <BaseButton 
          variant="secondary" 
          size="sm" 
          @click="clearAllFilters"
        >
          Limpar Filtros
        </BaseButton>
      </div>
      
      <div class="filters-grid">
        <!-- Search -->
        <div class="filter-group">
          <label class="filter-label">Buscar Clientes</label>
          <BaseInput
            v-model="searchTerm"
            placeholder="Nome, email ou telefone..."
            @input="handleSearch"
            class="search-input"
          />
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <BaseSelect
            v-model="statusFilter"
            :options="statusOptions"
            placeholder="Todos os status"
            @change="handleStatusFilter"
          />
        </div>

        <!-- Per Page -->
        <div class="filter-group">
          <label class="filter-label">Itens por página</label>
          <BaseSelect
            v-model="perPage"
            :options="perPageOptions"
            @change="handlePerPageChange"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Loading State -->
    <BaseLoading 
      v-if="isLoading" 
      :show="isLoading"
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

    <!-- Customers Grid -->
    <div v-else class="customers-container">
      <!-- Empty State -->
      <div v-if="!customers || customers.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Nenhum cliente encontrado</h3>
        <p>Comece adicionando seu primeiro cliente clicando no botão "Novo Cliente"</p>
        <BaseButton 
          variant="primary" 
          @click="createNewCustomer"
          :loading="isCreating"
        >
          <span class="btn-icon">👥</span>
          Novo Cliente
        </BaseButton>
      </div>

      <!-- Customers List -->
      <div v-else class="customers-grid" ref="customersGrid">
        <BaseCard
          v-for="customer in customers"
          :key="customer.id"
          class="customer-card"
          :class="{ 'inactive': !customer.is_active }"
        >
        <div class="customer-header" v-if="customer && customer.id">
          <div class="customer-info">
            <h3 class="customer-name">{{ customer.name }}</h3>
            <p class="customer-email" v-if="customer.email">{{ customer.email }}</p>
            <p class="customer-phone" v-if="customer.phone">{{ customer.phone }}</p>
            <div class="customer-meta">
              <span class="customer-id">ID: {{ customer.id }}</span>
              <span class="customer-status" :class="customer.is_active ? 'active' : 'inactive'">
                {{ customer.is_active ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
            <div class="customer-balance" v-if="customer.balance !== undefined">
              <span class="balance-label">Débito:</span>
              <span class="balance-value" :class="{ 'has-debt': customer.balance > 0, 'no-debt': customer.balance === 0 }">
                {{ formatCurrency(customer.balance) }}
              </span>
            </div>
          </div>
          <div class="customer-actions">
            <BaseButton
              size="sm"
              :variant="customer.is_active ? 'success' : 'secondary'"
              @click="toggleCustomerActive(customer.id)"
              :loading="isUpdating"
            >
              {{ customer.is_active ? 'Ativo' : 'Inativo' }}
            </BaseButton>
            <BaseButton
              size="sm"
              variant="primary"
              @click="editCustomer(customer)"
            >
              Editar
            </BaseButton>
            <BaseButton
              v-if="customer.balance && customer.balance > 0"
              size="sm"
              variant="warning"
              @click="openPayDebtModal(customer)"
            >
              Quitar Débito
            </BaseButton>
            <BaseButton 
              v-if="isAdmin"
              size="sm"
              variant="danger"
              @click="confirmDeleteCustomer(customer)"
              :loading="isDeleting"
            >
              Excluir
            </BaseButton>
          </div>
        </div>
        </BaseCard>
      </div>

      <!-- Load More Indicator -->
      <div v-if="hasMorePages && customers.length > 0" class="load-more-container">
        <BaseButton
          v-if="!isLoadingMore"
          variant="secondary"
          @click="loadMoreCustomers"
          class="load-more-btn"
        >
          <span class="btn-icon">⬇️</span>
          Carregar Mais
        </BaseButton>
        <div v-else class="loading-more">
          <div class="loading-spinner"></div>
          <span>Carregando mais clientes...</span>
        </div>
      </div>

      <!-- End of Results -->
      <div v-if="!hasMorePages && customers.length > 0" class="end-of-results">
        <span>Você viu todos os {{ totalCustomers }} cliente{{ totalCustomers !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Customer Modal -->
    <CustomerModal
      :show="showCustomerModal"
      :customer="selectedCustomer"
      @update:show="showCustomerModal = $event"
      @success="handleCustomerSuccess"
    />

    <!-- Delete Confirmation Modal -->
    <BaseModal :show="showDeleteModal" title="Confirmar Exclusão" @close="showDeleteModal = false">
      <div class="delete-confirmation">
        <div class="delete-icon">⚠️</div>
        <h3>Excluir Cliente</h3>
        <p>Tem certeza que deseja excluir o cliente <strong>{{ customerToDelete?.name }}</strong>?</p>
        <p class="warning-text">Esta ação não pode ser desfeita.</p>
        
        <div class="modal-actions">
          <BaseButton variant="secondary" @click="showDeleteModal = false">
            Cancelar
          </BaseButton>
          <BaseButton variant="danger" @click="deleteCustomer" :loading="isDeleting">
            Excluir
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Pay Debt Modal -->
    <PayDebtModal
      :show="showPayDebtModal"
      :customer="customerToPayDebt"
      @update:show="showPayDebtModal = $event"
      @success="handlePayDebtSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import BaseModal from '@/components/Base/Modal.vue'
import CustomerModal from '../components/Modals/CustomerModal.vue'
import PayDebtModal from '../components/Modals/PayDebtModal.vue'
import { useCustomers } from '@/composables/useCustomers'
import { useFormatter } from '@/composables/useUtils'
import type { Customer } from '@/types/api'

// Get user role from localStorage
const getUserRole = (): string | null => {
  return localStorage.getItem('user_role')
}

const userRole = getUserRole()
// const isStaff = computed(() => userRole === 'staff')
const isAdmin = computed(() => userRole === 'admin' || userRole === 'tenant_owner')

// Composables
const {
  customers,
  searchTerm,
  showOnlyActive,
  error,
  perPage,
  totalCustomers,
  hasMorePages,
  isLoadingMore,
  isLoading,
  isCreating,
  isUpdating,
  isDeleting,
  loadCustomers,
  loadMoreCustomers,
  updateCustomer,
  deleteCustomer: deleteCustomerApi,
  searchCustomers,
  clearFilters,
  refreshCustomers
} = useCustomers()

// Composables
const { currency } = useFormatter()

// UI State
const showCustomerModal = ref(false)
const showDeleteModal = ref(false)
const showPayDebtModal = ref(false)
const selectedCustomer = ref<Customer | null>(null)
const customerToDelete = ref<Customer | null>(null)
const customerToPayDebt = ref<Customer | null>(null)

// Filter state
const statusFilter = ref<string>('')
const customersGrid = ref<HTMLElement | null>(null)

// Filter options
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' }
]

const perPageOptions = [
  { value: 10, label: '10 por página' },
  { value: 20, label: '20 por página' },
  { value: 50, label: '50 por página' },
  { value: 100, label: '100 por página' }
]

// Methods
const createNewCustomer = () => {
  selectedCustomer.value = null
  showCustomerModal.value = true
}

// Filter methods
const handleSearch = () => {
  searchCustomers(searchTerm.value)
}

const handleStatusFilter = () => {
  const statusValue = statusFilter.value === '' ? undefined : statusFilter.value === 'true'
  showOnlyActive.value = statusValue
  refreshCustomers()
}

const handlePerPageChange = () => {
  refreshCustomers()
}

const clearAllFilters = () => {
  searchTerm.value = ''
  statusFilter.value = ''
  clearFilters()
}

const editCustomer = (customer: Customer) => {
  selectedCustomer.value = customer
  showCustomerModal.value = true
}

const handleCustomerSuccess = () => {
  showCustomerModal.value = false
  selectedCustomer.value = null
  loadCustomers() // Refresh the list
}

const confirmDeleteCustomer = (customer: Customer) => {
  customerToDelete.value = customer
  showDeleteModal.value = true
}

const deleteCustomer = async () => {
  if (customerToDelete.value) {
    try {
      await deleteCustomerApi(customerToDelete.value.id)
      showDeleteModal.value = false
      customerToDelete.value = null
      loadCustomers() // Refresh the list
    } catch (error) {
      // Error is handled by the composable
    }
  }
}

const toggleCustomerActive = async (id: number) => {
  const customer = customers.value.find(cust => cust.id === id)
  if (customer) {
    try {
      await updateCustomer(id, { is_active: !customer.is_active })
    } catch (error) {
      // Error is handled by the composable
    }
  }
}

const formatCurrency = currency

const openPayDebtModal = (customer: Customer) => {
  customerToPayDebt.value = customer
  showPayDebtModal.value = true
}

const handlePayDebtSuccess = () => {
  showPayDebtModal.value = false
  customerToPayDebt.value = null
  loadCustomers() // Refresh the list to update balances
}

// Load customers on mount
onMounted(() => {
  loadCustomers()
})
</script>

<style lang="scss" scoped>
.customers {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-8);
  gap: var(--spacing-4);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color-dark);
  margin: 0 0 var(--spacing-2) 0;
}

.page-description {
  color: var(--gray-600);
  margin: 0;
  font-size: var(--font-size-sm);
}

.error-card {
  margin-bottom: var(--spacing-6);
}

.error-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4);

  .error-icon {
    font-size: var(--font-size-2xl);
    color: var(--danger);
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

.customers-container {
  .customers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--spacing-6);
  }
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin: var(--spacing-8) 0;
  
  .load-more-btn {
    min-width: 200px;
  }
  
  .loading-more {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    color: var(--gray-600);
    font-size: var(--font-size-sm);
    
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--gray-300);
      border-top: 2px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

.end-of-results {
  text-align: center;
  margin: var(--spacing-8) 0;
  padding: var(--spacing-4);
  color: var(--gray-500);
  font-size: var(--font-size-sm);
  background: var(--gray-50);
  border-radius: var(--radius-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Filters styles
.filters-card {
  margin-bottom: var(--spacing-6);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  
  h3 {
    margin: 0;
    color: var(--primary-dark);
    font-size: var(--font-size-lg);
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--spacing-1);
}

.search-input {
  min-width: 200px;
}

.customer-stats {
  .stats-text {
    font-size: var(--font-size-sm);
    color: var(--gray-500);
    background: var(--gray-100);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-md);
  }
}

.customer-card {
  transition: all var(--transition-normal);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &.inactive {
    opacity: 0.6;
    background: var(--gray-50);
  }
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-4);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-3);
  }
}

.customer-info {
  flex: 1;
}

.customer-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color-dark);
  margin: 0 0 var(--spacing-2) 0;
}

.customer-email {
  color: var(--gray-600);
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--font-size-sm);
}

.customer-phone {
  color: var(--gray-600);
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--font-size-sm);
}

.customer-meta {
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-2);

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }
}

.customer-id {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  background: var(--gray-100);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
}

.customer-status {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);

  &.active {
    background: var(--success-light);
    color: var(--success-dark);
  }

  &.inactive {
    background: var(--gray-200);
    color: var(--gray-600);
  }
}

.customer-balance {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--radius-sm);
  background: var(--gray-50);

  .balance-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--gray-600);
  }

  .balance-value {
    font-size: var(--font-size-base);
    font-weight: 700;

    &.has-debt {
      color: var(--warning, #f59e0b);
    }

    &.no-debt {
      color: var(--success, #10b981);
    }
  }
}

.customer-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 768px) {
    justify-content: stretch;
    width: 100%;
    
    > * {
      flex: 1;
      min-width: 0;
    }
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: var(--spacing-2);
    
    > * {
      flex: none;
      width: 100%;
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
  grid-column: 1 / -1;
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

// Delete Confirmation Modal
.delete-confirmation {
  text-align: center;
  padding: var(--spacing-4);
}

.delete-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  color: var(--danger);
}

.delete-confirmation h3 {
  color: var(--text-color-dark);
  margin-bottom: var(--spacing-3);
}

.delete-confirmation p {
  color: var(--gray-600);
  margin-bottom: var(--spacing-2);
}

.warning-text {
  color: var(--danger);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-6);
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-3);
}

@media (max-width: 768px) {
  .customers {
    padding: var(--spacing-4);
  }
  
  .customers-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
  
  .customer-header {
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .customer-actions {
    width: 100%;
    justify-content: stretch;
    
    > * {
      flex: 1;
      min-width: 0;
    }
  }
}

@media (max-width: 480px) {
  .customers {
    padding: var(--spacing-2);
  }
}
</style>