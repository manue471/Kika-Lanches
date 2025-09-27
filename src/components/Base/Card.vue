<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
      </slot>
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions" />
      </div>
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hover: false
})

const cardClasses = computed(() => {
  return [
    'card',
    `card-${props.variant}`,
    `card-padding-${props.padding}`,
    {
      'card-hover': props.hover
    }
  ]
})
</script>

<style lang="scss" scoped>
.card {
  background: var(--white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--transition-normal);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-default {
  box-shadow: var(--shadow-md);
  height: 100%;
}

.card-elevated {
  box-shadow: var(--shadow-lg);
}

.card-outlined {
  border: 1px solid var(--gray-300);
  box-shadow: none;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  border-bottom: 2px solid var(--gray-200);
  flex-shrink: 0;
}

.card-title {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--primary-dark);
  line-height: 1.3;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.card-body {
  padding: var(--spacing-6);
  flex: 1;
  overflow: hidden;
}

.card-footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
  flex-shrink: 0;
}

// Padding variants
.card-padding-none {
  .card-header,
  .card-body,
  .card-footer {
    padding: 0;
  }
}

.card-padding-sm {
  .card-header,
  .card-body,
  .card-footer {
    padding: var(--spacing-4);
  }
}

.card-padding-md {
  .card-header,
  .card-body,
  .card-footer {
    padding: var(--spacing-6);
  }
}

.card-padding-lg {
  .card-header,
  .card-body,
  .card-footer {
    padding: var(--spacing-8);
  }
}

// Mobile styles
@media (max-width: 768px) {
  .card-header {
    padding: var(--spacing-4);
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-2);
  }

  .card-title {
    font-size: var(--font-size-lg);
    text-align: center;
  }

  .card-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .card-body {
    padding: var(--spacing-4);
  }

  .card-footer {
    padding: var(--spacing-4);
  }

  .card-padding-sm {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--spacing-3);
    }
  }

  .card-padding-md {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--spacing-4);
    }
  }

  .card-padding-lg {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--spacing-5);
    }
  }
}

// Small mobile styles
@media (max-width: 480px) {
  .card-header {
    padding: var(--spacing-3);
  }

  .card-title {
    font-size: var(--font-size-base);
  }

  .card-body {
    padding: var(--spacing-3);
  }

  .card-footer {
    padding: var(--spacing-3);
  }

  .card-padding-sm {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--spacing-2);
    }
  }

  .card-padding-md {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--spacing-3);
    }
  }

  .card-padding-lg {
    .card-header,
    .card-body,
    .card-footer {
      padding: var(--spacing-4);
    }
  }
}

// Landscape mobile optimization
@media (max-width: 768px) and (orientation: landscape) {
  .card-header {
    flex-direction: row;
    align-items: center;
  }

  .card-title {
    text-align: left;
  }
}
</style>
