<template>
  <div class="input-group">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="input-wrapper">
      <input
        :id="id"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :class="inputClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @keydown="$emit('keydown', $event)"
      />
      <slot name="suffix" />
    </div>
    <small v-if="hint" class="input-hint">{{ hint }}</small>
    <small v-if="error" class="input-error">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'search'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  id?: string
  min?: string | number
  max?: string | number
  step?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false
})

defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
}>()

const inputClasses = computed(() => {
  return [
    'input',
    {
      'input-error': props.error,
      'input-disabled': props.disabled,
      'input-readonly': props.readonly
    }
  ]
})

// Generate unique ID if not provided
const id = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`)
</script>

<style lang="scss" scoped>
.input-group {
  margin-bottom: var(--spacing-4);
}

.input-label {
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

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  background: var(--white);

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

  &:read-only {
    background: var(--gray-50);
    color: var(--gray-700);
  }

  &::placeholder {
    color: var(--gray-400);
  }
}

.input-error {
  border-color: var(--danger);

  &:focus {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
  }
}

.input-hint {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.input-error-text {
  display: block;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--danger);
}
</style>
