<template>
  <div class="auth-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Auth layout component - minimal layout for login/register pages
</script>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
}
</style>
