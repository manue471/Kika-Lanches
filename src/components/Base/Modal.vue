<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="close"
      >
        <div class="modal-container" :class="modalClasses">
          <div class="modal-header" v-if="$slots.header || title">
            <slot name="header">
              <h3 class="modal-title">{{ title }}</h3>
            </slot>
            <button
              v-if="closable"
              class="modal-close"
              @click="close"
              aria-label="Fechar modal"
            >
              &times;
            </button>
          </div>
          
          <div class="modal-body">
            <slot />
          </div>
          
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true
})

const emit = defineEmits<{
  close: []
  'update:isOpen': [value: boolean]
}>()

const modalClasses = computed(() => {
  return [
    `modal-${props.size}`
  ]
})

const close = () => {
  emit('close')
  emit('update:isOpen', false)
}

// Close on escape key
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    close()
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
  }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.modal-container {
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-in-out;
}

.modal-sm {
  width: 100%;
  max-width: 400px;
}

.modal-md {
  width: 100%;
  max-width: 500px;
}

.modal-lg {
  width: 100%;
  max-width: 700px;
}

.modal-xl {
  width: 100%;
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--gray-200);
}

.modal-title {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--primary-dark);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--gray-500);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--gray-100);
    color: var(--gray-700);
  }
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(-20px) scale(0.95);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
