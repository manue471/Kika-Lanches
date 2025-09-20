<template>
  <div class="stat-card">
    <div class="stat-icon">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <div class="stat-content">
      <h3 class="stat-title">{{ title }}</h3>
      <span class="stat-value">{{ formattedValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatter } from '@/composables/useUtils'

interface Props {
  title: string
  value: string | number
  icon?: string
  format?: 'currency' | 'number' | 'text'
}

const props = withDefaults(defineProps<Props>(), {
  format: 'text'
})

const { currency, number } = useFormatter()

const formattedValue = computed(() => {
  switch (props.format) {
    case 'currency':
      return currency(Number(props.value))
    case 'number':
      return number(Number(props.value))
    default:
      return String(props.value)
  }
})
</script>

<style lang="scss" scoped>
.stat-card {
  background: var(--white);
  padding: var(--spacing-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  transition: all var(--transition-normal);
  border-left: 4px solid var(--primary-light);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

.stat-icon {
  font-size: var(--font-size-3xl);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--accent-light) 100%);
  border-radius: var(--radius-xl);
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-bottom: var(--spacing-1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: bold;
  color: var(--primary-dark);
}
</style>
