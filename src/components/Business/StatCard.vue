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
  min-height: 100px;

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
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-title {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-bottom: var(--spacing-1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  line-height: 1.3;
  word-break: break-word;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: bold;
  color: var(--primary-dark);
  line-height: 1.2;
  word-break: break-word;
}

// Mobile styles
@media (max-width: 768px) {
  .stat-card {
    padding: var(--spacing-4);
    min-height: 80px;
    gap: var(--spacing-3);
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: var(--font-size-2xl);
  }

  .stat-title {
    font-size: var(--font-size-xs);
    margin-bottom: 2px;
  }

  .stat-value {
    font-size: var(--font-size-xl);
  }
}

// Small mobile styles
@media (max-width: 480px) {
  .stat-card {
    padding: var(--spacing-3);
    min-height: 70px;
    gap: var(--spacing-2);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: var(--font-size-xl);
  }

  .stat-title {
    font-size: 10px;
    letter-spacing: 0.3px;
  }

  .stat-value {
    font-size: var(--font-size-lg);
  }
}

// Landscape mobile optimization
@media (max-width: 768px) and (orientation: landscape) {
  .stat-card {
    min-height: 60px;
    padding: var(--spacing-3);
  }

  .stat-icon {
    width: 45px;
    height: 45px;
    font-size: var(--font-size-lg);
  }

  .stat-title {
    font-size: 10px;
  }

  .stat-value {
    font-size: var(--font-size-base);
  }
}
</style>
