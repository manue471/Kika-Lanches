<template>
  <span :class="['badge', `badge-${variant}`]">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}>(), {
  variant: 'neutral'
})
</script>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--spacing-2);
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}

.badge-neutral { background: var(--gray-200); color: var(--gray-700); }
.badge-success { background: var(--success-soft); color: var(--success-strong); }
.badge-warning { background: var(--warning-soft); color: var(--warning-strong); }
.badge-danger  { background: var(--danger-soft);  color: var(--danger-strong); }
.badge-info    { background: var(--info-soft);    color: var(--info-strong); }
</style>
