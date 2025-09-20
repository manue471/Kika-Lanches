<template>
  <header class="header">
    <div class="header-content">
      <h1 class="logo">🍔 Kika Lanches</h1>
      <nav class="nav">
        <button
          v-for="item in navigationItems"
          :key="item.name"
          :class="['nav-btn', { active: currentRoute === item.route }]"
          @click="$emit('navigate', item.route)"
        >
          {{ item.name }}
        </button>
      </nav>
      <button class="theme-toggle" @click="toggleTheme">
        {{ theme === 'dark' ? '☀️' : '🌙' }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useStorage'

interface NavigationItem {
  name: string
  route: string
}

interface Props {
  currentRoute: string
}

defineProps<Props>()

const emit = defineEmits<{
  navigate: [route: string]
}>()

const { theme, toggleTheme, initTheme } = useTheme()

// Initialize theme on mount
initTheme()

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', route: 'dashboard' },
  { name: 'Vendas', route: 'sales' },
  { name: 'Produtos', route: 'products' },
  { name: 'Clientes', route: 'customers' },
  { name: 'Relatórios', route: 'reports' }
]
</script>

<style lang="scss" scoped>
.header {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-medium) 100%);
  color: var(--white);
  padding: var(--spacing-4) 0;
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-4);
}

.logo {
  font-size: var(--font-size-2xl);
  font-weight: bold;
  color: var(--white);
  margin: 0;
}

.nav {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--white);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: 500;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--primary-light);
    color: var(--primary-dark);
    border-color: var(--primary-light);
  }
}

.theme-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--white);
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-lg);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .nav {
    order: 1;
    width: 100%;
    justify-content: center;
  }
  
  .theme-toggle {
    order: 2;
  }
}

@media (max-width: 480px) {
  .nav {
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  .nav-btn {
    padding: var(--spacing-3) var(--spacing-4);
    width: 100%;
  }
}
</style>
