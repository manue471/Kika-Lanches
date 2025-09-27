<template>
  <Teleport to="body">
    <div 
      v-if="show" 
      class="modal-overlay" 
      @click="handleOverlayClick"
    >
      <div 
        class="modal-container" 
        :class="modalClass"
        @click.stop
      >
        <!-- Header -->
        <div v-if="title || $slots.header" class="modal-header">
          <slot name="header">
            <h3 class="modal-title">{{ title }}</h3>
          </slot>
          <button 
            v-if="closable" 
            class="modal-close" 
            @click="close"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, onUnmounted } from 'vue'

interface Props {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  persistent: false
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'close': []
}>()

const modalClass = computed(() => [
  `modal-${props.size}`
])

const close = () => {
  if (!props.persistent) {
    emit('update:show', false)
    emit('close')
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape) {
    close()
  }
}

// Watch for show changes to handle body scroll
watch(() => props.show, async (newValue) => {
  await nextTick()
  
  if (newValue) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeydown)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
}

.modal-sm {
  width: 100%;
  max-width: 400px;
}

.modal-md {
  width: 100%;
  max-width: 600px;
}

.modal-lg {
  width: 100%;
  max-width: 800px;
}

.modal-xl {
  width: 100%;
  max-width: 1000px;
}

.modal-full {
  width: 100%;
  max-width: 95vw;
  max-height: 95vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--gray-200);
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--primary-dark);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--gray-500);
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background: var(--gray-100);
    color: var(--gray-700);
  }

  &:focus {
    outline: 2px solid var(--primary-light);
    outline-offset: 2px;
  }
}

.modal-body {
  padding: var(--spacing-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
  flex-shrink: 0;
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

// Mobile optimizations
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--spacing-2);
  }

  .modal-container {
    max-height: 95vh;
    border-radius: var(--radius-lg);
  }

  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    max-width: 100%;
  }

  .modal-header {
    padding: var(--spacing-4);
  }

  .modal-title {
    font-size: var(--font-size-lg);
  }

  .modal-body {
    padding: var(--spacing-4);
  }

  .modal-footer {
    padding: var(--spacing-4);
    flex-direction: column;
    
    > * {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: var(--spacing-1);
  }

  .modal-header {
    padding: var(--spacing-3);
  }

  .modal-title {
    font-size: var(--font-size-base);
  }

  .modal-body {
    padding: var(--spacing-3);
  }

  .modal-footer {
    padding: var(--spacing-3);
  }
}
</style>