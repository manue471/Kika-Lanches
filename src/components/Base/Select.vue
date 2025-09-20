<template>
  <div class="select-group">
    <label v-if="label" :for="id" class="select-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :class="selectClasses"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <small v-if="hint" class="select-hint">{{ hint }}</small>
    <small v-if="error" class="select-error">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const selectClasses = computed(() => {
  return [
    'select',
    {
      'select-error': props.error,
      'select-disabled': props.disabled
    }
  ]
})

const id = computed(() => props.id || `select-${Math.random().toString(36).substr(2, 9)}`)
</script>

<style lang="scss" scoped>
.select-group {
  margin-bottom: var(--spacing-4);
}

.select-label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
  color: var(--gray-700);
  font-size: var(--font-size-sm);

  .required {
    color: var(--danger);
    margin-left: 0.25rem;
  }
}

.select {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--white);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:focus {
    outline: none;
    border-color: var(--primary-light);
    box-shadow: 0 0 0 3px rgba(92, 219, 149, 0.1);
  }

  &:disabled {
    background: var(--gray-100);
    color: var(--gray-500);
    cursor: not-allowed;
  }
}

.select-error {
  border-color: var(--danger);

  &:focus {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
  }
}

.select-hint {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.select-error-text {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--danger);
}
</style>
