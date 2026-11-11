<template>
  <header class="page-header">
    <div class="page-header-text">
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="description" class="page-description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.page-description {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.page-header-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-actions > * {
    flex: 1;
  }
}
</style>
