<template>
  <div class="customers">
    <!-- Header -->
    <div class="customers-header">
      <h2>Gerenciar Clientes</h2>
      <BaseButton 
        variant="primary" 
        @click="showCustomerModal = true"
        :loading="isCreating"
      >
        <span class="btn-icon">👤</span>
        Novo Cliente
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="filters-card">
      <div class="filters-grid">
        <BaseInput
          v-model="searchTerm"
          placeholder="Buscar clientes..."
          @input="handleSearch"
          class="search-input"
        />
        <div class="filter-actions">
          <BaseButton
            :variant="showOnlyActive ? 'primary' : 'secondary'"
            @click="toggleActiveFilter"
          >
            {{ showOnlyActive ? 'Ativos' : 'Todos' }}
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Loading State -->
    <BaseLoading 
      v-if="isLoading" 
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
          <BaseButton @click="refresh" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Customers Grid -->
    <div v-else class="customers-grid">
      <!-- Empty State -->
      <div v-if="!customers || customers.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Nenhum cliente encontrado</h3>
        <p>Comece adicionando seu primeiro cliente clicando no botão "Novo Cliente"</p>
        <BaseButton 
          variant="primary" 
          @click="showCustomerModal = true"
          :loading="isCreating"
        >
          <span class="btn-icon">👥</span>
          Novo Cliente
        </BaseButton>
      </div>

      <!-- Customers List -->
      <BaseCard
        v-else
        v-for="customer in customers"
        v-if="customer && customer.id"
        :key="customer.id"
        class="customer-card"
        :class="{ 'inactive': !customer.is_active }"
      >
        <div class="customer-header">
          <div class="customer-info">
            <h3 class="customer-name">{{ customer.name }}</h3>
            <p class="customer-email" v-if="customer.email">{{ customer.email }}</p>
            <p class="customer-phone" v-if="customer.phone">{{ customer.phone }}</p>
          </div>
          <div class="customer-actions">
            <BaseButton
              size="sm"
              :variant="customer.is_active ? 'success' : 'secondary'"
              @click="toggleCustomerActive(customer.id)"
              :loading="isToggling"
            >
              {{ customer.is_active ? 'Ativo' : 'Inativo' }}
            </BaseButton>
            <BaseButton
              size="sm"
              variant="secondary"
              @click="editCustomer(customer)"
            >
              Editar
            </BaseButton>
            <BaseButton
              size="sm"
              variant="danger"
              @click="deleteCustomerConfirm(customer.id)"
              :loading="isDeleting"
            >
              Excluir
            </BaseButton>
          </div>
        </div>

        <div class="customer-footer">
          <div class="customer-meta">
            <span class="created-date" v-if="customer.created_at">
              Cadastrado em {{ formatDate(customer.created_at) }}
            </span>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <BaseCard v-if="!isLoading && customers.length === 0" class="empty-state">
      <div class="empty-content">
        <span class="empty-icon">👥</span>
        <h3>Nenhum cliente encontrado</h3>
        <p>Comece cadastrando seu primeiro cliente!</p>
        <BaseButton variant="primary" @click="showCustomerModal = true">
          Cadastrar Cliente
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Customer Modal -->
    <CustomerModal
      v-model:show="showCustomerModal"
      :customer="selectedCustomer"
      @success="handleCustomerSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCustomers } from '@/composables/useCustomers'
import { useFormatter } from '@/composables/useUtils'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import CustomerModal from '@/components/Modals/CustomerModal.vue'
import type { Customer } from '@/types/api'

const {
  // State
  customers,
  searchTerm,
  showOnlyActive,
  
  // Loading states
  isLoading,
  isCreating,
  isUpdating,
  isDeleting,
  isToggling,
  
  // Errors
  error,
  
  // Methods
  searchCustomers,
  toggleActiveFilter,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleActive,
  refresh
} = useCustomers()

const { date } = useFormatter()

// UI State
const showCustomerModal = ref(false)
const selectedCustomer = ref<Customer | null>(null)

// Computed
const formatDate = (dateString: string) => {
  return date(new Date(dateString))
}

// Methods
const handleSearch = () => {
  searchCustomers(searchTerm.value)
}

const editCustomer = (customer: Customer) => {
  selectedCustomer.value = customer
  showCustomerModal.value = true
}

const handleCustomerSuccess = (customer: Customer) => {
  showCustomerModal.value = false
  selectedCustomer.value = null
}

const toggleCustomerActive = async (id: number) => {
  await toggleActive(id)
}

const deleteCustomerConfirm = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir este cliente?')) {
    await deleteCustomer(id)
  }
}
</script>

<style lang="scss" scoped>
.customers {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.customers-header {
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
  grid-template-columns: 1fr auto;
  gap: var(--spacing-4);
  align-items: center;
}

.search-input {
  min-width: 200px;
}

.filter-actions {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
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

.customers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-6);
}

.customer-card {
  transition: all var(--transition-normal);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &.inactive {
    opacity: 0.6;
    border-left: 4px solid var(--gray-400);
  }
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
}

.customer-info {
  flex: 1;
  
  .customer-name {
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-dark);
  }
  
  .customer-email,
  .customer-phone {
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-sm);
    color: var(--gray-600);
  }
}

.customer-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.customer-footer {
  border-top: 1px solid var(--gray-200);
  padding-top: var(--spacing-3);
  
  .customer-meta {
    font-size: var(--font-size-xs);
    color: var(--gray-500);
  }
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
  .customers {
    padding: var(--spacing-4);
  }
  
  .customers-header {
    flex-direction: column;
    gap: var(--spacing-4);
    align-items: stretch;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
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

@media (max-width: 480px) {
  .customers {
    padding: var(--spacing-2);
  }
  
  .customer-actions {
    flex-direction: column;
  }
}
</style>