<template>
  <div class="customers">
    <div class="customers-header">
      <h2>Gerenciar Clientes</h2>
      <BaseButton variant="primary" @click="$emit('showModal', 'customer')">
        Adicionar Cliente
      </BaseButton>
    </div>

    <div class="customers-filters">
      <BaseInput
        v-model="customerSearch"
        placeholder="Buscar clientes..."
        @input="filterCustomers"
      />
      <BaseSelect
        v-model="selectedClass"
        :options="classOptions"
        placeholder="Todas as turmas"
        @change="filterCustomers"
      />
    </div>

    <BaseCard class="customers-container">
      <div class="customers-list">
        <div v-if="filteredCustomers.length === 0" class="no-data">
          Nenhum cliente cadastrado
        </div>
        <CustomerCard
          v-for="customer in filteredCustomers"
          :key="customer.id"
          :customer="customer"
          @edit="editCustomer"
          @delete="deleteCustomer"
          @history="viewCustomerHistory"
        />
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppData } from '@/composables/useStorage'
import { useNotifications } from '@/composables/useNotifications'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import CustomerCard from '@/components/Business/CustomerCard.vue'

const emit = defineEmits<{
  showModal: [type: string]
}>()

const { showNotification } = useNotifications()
const appData = useAppData()

// Reactive data
const customerSearch = ref('')
const selectedClass = ref('')

// Computed properties
const classOptions = computed(() => {
  const classes = [...new Set(appData.value.customers.map(c => c.class).filter(Boolean))]
  return [
    { value: '', label: 'Todas as turmas' },
    ...classes.map(cls => ({
      value: cls,
      label: cls
    }))
  ]
})

const filteredCustomers = computed(() => {
  let customers = appData.value.customers
  
  if (customerSearch.value) {
    const search = customerSearch.value.toLowerCase()
    customers = customers.filter(customer => 
      customer.name.toLowerCase().includes(search)
    )
  }
  
  if (selectedClass.value) {
    customers = customers.filter(customer => 
      customer.class === selectedClass.value
    )
  }
  
  return customers
})

// Methods
const editCustomer = (customer: any) => {
  showNotification(`Editar cliente ${customer.name} será implementado em breve`, 'info')
}

const deleteCustomer = (customer: any) => {
  if (confirm(`Tem certeza que deseja excluir o cliente ${customer.name}?`)) {
    const index = appData.value.customers.findIndex(c => c.id === customer.id)
    if (index > -1) {
      appData.value.customers.splice(index, 1)
      showNotification('Cliente excluído com sucesso', 'success')
    }
  }
}

const viewCustomerHistory = (customer: any) => {
  const customerSales = appData.value.sales.filter(sale => sale.customerId === customer.id)
  const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0)
  
  showNotification(
    `${customer.name}: ${customerSales.length} compras, total de R$ ${totalSpent.toFixed(2)}`,
    'info'
  )
}

const filterCustomers = () => {
  // Filtering is handled by computed property
}
</script>

<style lang="scss" scoped>
.customers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-4);

  h2 {
    font-size: var(--font-size-3xl);
    color: var(--primary-dark);
    margin: 0;
  }
}

.customers-filters {
  background: var(--white);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-6);
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
  flex-wrap: wrap;
}

.customers-container {
  padding: var(--spacing-6);
}

.customers-list {
  display: grid;
  gap: var(--spacing-4);
}

@media (max-width: 768px) {
  .customers-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .customers-filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
