<template>
  <div class="customer-card">
    <div class="customer-card-header">
      <div>
        <div class="customer-card-name">{{ customer.name }}</div>
        <div v-if="customer.class" class="customer-card-class">{{ customer.class }}</div>
      </div>
    </div>
    <div class="customer-card-info">
      <div v-if="customer.guardian">
        <strong>Responsável:</strong> {{ customer.guardian }}
      </div>
      <div v-if="customer.phone">
        <strong>Telefone:</strong> {{ formattedPhone }}
      </div>
    </div>
    <div class="customer-card-actions">
      <BaseButton 
        variant="info" 
        size="sm" 
        @click="$emit('edit', customer)"
      >
        Editar
      </BaseButton>
      <BaseButton 
        variant="danger" 
        size="sm" 
        @click="$emit('delete', customer)"
      >
        Excluir
      </BaseButton>
      <BaseButton 
        variant="secondary" 
        size="sm" 
        @click="$emit('history', customer)"
      >
        Histórico
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatter } from '@/composables/useUtils'
import BaseButton from '@/components/Base/Button.vue'

interface Customer {
  id: number
  name: string
  class?: string
  guardian?: string
  phone?: string
}

interface Props {
  customer: Customer
}

const props = defineProps<Props>()

defineEmits<{
  edit: [customer: Customer]
  delete: [customer: Customer]
  history: [customer: Customer]
}>()

const { phone } = useFormatter()

const formattedPhone = computed(() => {
  return props.customer.phone ? phone(props.customer.phone) : ''
})
</script>

<style lang="scss" scoped>
.customer-card {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: all var(--transition-normal);
  background: var(--gray-50);

  &:hover {
    border-color: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.customer-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-3);
}

.customer-card-name {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-1);
}

.customer-card-class {
  background: var(--accent-light);
  color: var(--primary-dark);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  display: inline-block;
}

.customer-card-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.customer-card-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .customer-card-info {
    grid-template-columns: 1fr;
  }
}
</style>
