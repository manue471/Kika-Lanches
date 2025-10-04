<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    :type="type"
    @click="$emit('click', $event)"
  >
    <slot name="icon" />
    <span v-if="$slots.default" class="button-content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
  block: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  return [
    'btn',
    `btn-${props.variant}`,
    `btn-${props.size}`,
    {
      'btn-block': props.block,
      'btn-disabled': props.disabled
    }
  ]
})
</script>

<style lang="scss" scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-normal);
  text-decoration: none;
  justify-content: center;

  &:focus {
    outline: 2px solid var(--primary-light);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

// Variants
.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: var(--white);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.btn-secondary {
  background: var(--white);
  color: var(--primary);
  border: 1px solid var(--primary);

  &:hover:not(:disabled) {
    background: var(--primary);
    color: var(--white);
  }
}

.btn-danger {
  background: var(--danger);
  color: var(--white);

  &:hover:not(:disabled) {
    background: #c82333;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.btn-success {
  background: var(--success);
  color: var(--white);

  &:hover:not(:disabled) {
    background: #1e7e34;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.btn-warning {
  background: var(--warning);
  color: var(--gray-900);

  &:hover:not(:disabled) {
    background: #e0a800;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.btn-info {
  background: var(--info);
  color: var(--white);

  &:hover:not(:disabled) {
    background: #138496;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

// Sizes
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: var(--font-size-sm);
}

.btn-md {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-base);
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-lg);
}

// Block variant
.btn-block {
  width: 100%;
}

// Disabled state
.btn-disabled {
  background: var(--gray-400) !important;
  color: var(--gray-600) !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}
</style>

