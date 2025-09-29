<template>
  <BaseModal
    :show="show"
    :title="title"
    size="md"
    @update:show="$emit('update:show', $event)"
    class="confirm-modal"
  >
    <div class="confirm-content">
      <div class="confirm-icon">
        {{ icon }}
      </div>
      
      <div class="confirm-message">
        <h3 class="confirm-title">{{ title }}</h3>
        <p class="confirm-description">{{ description }}</p>
        
        <!-- Custom content slot -->
        <div v-if="$slots.content" class="confirm-details">
          <slot name="content" />
        </div>
      </div>
      
      <div class="confirm-actions">
        <BaseButton
          variant="secondary"
          @click="handleCancel"
          :disabled="isLoading"
        >
          {{ cancelText }}
        </BaseButton>
        <BaseButton
          :variant="confirmVariant"
          @click="handleConfirm"
          :loading="isLoading"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './Modal.vue'
import BaseButton from './Button.vue'

interface Props {
  show: boolean
  title: string
  description: string
  icon?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success'
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: '⚠️',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  confirmVariant: 'primary',
  isLoading: false
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
.confirm-content {
  text-align: center;
  padding: var(--spacing-2);
}

.confirm-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  display: flex;
  justify-content: center;
}

.confirm-message {
  margin-bottom: var(--spacing-6);
  
  .confirm-title {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--gray-800);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .confirm-description {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--gray-600);
    line-height: 1.5;
  }
}

.confirm-details {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  margin-top: var(--spacing-4);
  text-align: left;
}

.confirm-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
  
  > * {
    min-width: 120px;
  }
}

// Responsive
@media (max-width: 480px) {
  .confirm-actions {
    flex-direction: column;
    
    > * {
      min-width: auto;
    }
  }
}
</style>
