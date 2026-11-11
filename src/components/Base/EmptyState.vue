<template>
  <div class="empty-state">
    <Icon v-if="icon" :icon="icon" class="empty-icon" />
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-10) var(--spacing-4);
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--gray-500);
  margin-bottom: var(--spacing-3);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text);
}

.empty-description {
  max-width: 28rem;
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.empty-actions {
  margin-top: var(--spacing-5);
}
</style>
