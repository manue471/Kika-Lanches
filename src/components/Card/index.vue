<script setup lang="ts">
const props = defineProps<{
  title: string;
  icon?: string;
}>();
</script>

<template>
    <div class="card">
        <div class="icon">
        <img :src="icon" alt="Icon" />
        </div>
        <h1>{{ title }}</h1>
    </div>
</template>

<style scoped>
.card {
  height: 300px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  width: 500px;
  justify-content: center;
  gap: 3rem;
}

h1 {
  color: black;
  font-size: 16px;
}
</style>
