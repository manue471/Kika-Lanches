<template>
  <span 
    class="status-badge"
    :class="[`status-${status}`, { 'status-large': large }]"
  >
    <span class="status-icon">{{ getStatusIcon(status) }}</span>
    <span class="status-text">{{ getStatusLabel(status) }}</span>
  </span>
</template>

<script setup lang="ts">
import type { Order } from '@/types/api'

interface Props {
  status: Order['status']
  large?: boolean
}

defineProps<Props>()

const getStatusIcon = (status: Order['status']): string => {
  const icons: Record<Order['status'], string> = {
    confirmed: '✅',
    paid: '💰'
  }
  return icons[status] || '❓'
}

const getStatusLabel = (status: Order['status']): string => {
  const labels: Record<Order['status'], string> = {
    confirmed: 'Confirmado',
    paid: 'Pago'
  }
  return labels[status] || status
}
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: 1px solid;
  
  &.status-large {
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
    gap: var(--spacing-2);
  }
}

.status-icon {
  font-size: 1em;
  line-height: 1;
}

.status-text {
  line-height: 1;
}

// Status: Confirmed (Confirmado) - Verde
.status-confirmed {
  background: #d1fae5;
  color: #065f46;
  border-color: #10b981;
}

// Status: Paid (Pago) - Dourado
.status-paid {
  background: #fef3c7;
  color: #92400e;
  border-color: #f59e0b;
}

// Responsive adjustments
@media (max-width: 480px) {
  .status-badge {
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-2);
    
    &.status-large {
      padding: var(--spacing-2) var(--spacing-3);
      font-size: var(--font-size-xs);
    }
  }
  
  .status-icon {
    font-size: 0.9em;
  }
}
</style>
