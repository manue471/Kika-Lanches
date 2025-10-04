<template>
  <div v-if="show" class="loading-container" :class="containerClass">
    <div class="loading-spinner" :class="spinnerClass">
      <div class="spinner"></div>
      <p v-if="message" class="loading-message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'overlay' | 'inline'
  color?: 'primary' | 'secondary' | 'white'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  color: 'primary'
})

const containerClass = computed(() => {
  return [
    `loading-${props.variant}`,
    `loading-${props.size}`
  ]
})

const spinnerClass = computed(() => {
  return [
    `spinner-${props.color}`,
    `spinner-${props.size}`
  ]
})
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 9999;
}

.loading-inline {
  padding: var(--spacing-4);
}

.loading-sm {
  min-height: 60px;
}

.loading-md {
  min-height: 120px;
}

.loading-lg {
  min-height: 200px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-300);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm .spinner {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.spinner-md .spinner {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner-lg .spinner {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

.spinner-primary .spinner {
  border-top-color: var(--primary);
}

.spinner-secondary .spinner {
  border-top-color: var(--gray-600);
}

.spinner-white .spinner {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: var(--white);
}

.loading-message {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  text-align: center;
  margin: 0;
}

.spinner-white .loading-message {
  color: var(--white);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Mobile optimizations
@media (max-width: 768px) {
  .loading-sm {
    min-height: 40px;
  }

  .loading-md {
    min-height: 80px;
  }

  .loading-lg {
    min-height: 120px;
  }

  .spinner-sm .spinner {
    width: 20px;
    height: 20px;
  }

  .spinner-md .spinner {
    width: 32px;
    height: 32px;
  }

  .spinner-lg .spinner {
    width: 48px;
    height: 48px;
  }

  .loading-message {
    font-size: var(--font-size-xs);
  }
}
</style>
