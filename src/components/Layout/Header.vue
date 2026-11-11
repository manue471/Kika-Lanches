<template>
  <!-- Desktop sidebar -->
  <aside class="sidebar" aria-label="Navegação principal">
    <div class="sidebar-brand">
      <img src="/icons/login-logo.png" alt="" class="brand-img">
      <span class="brand-name">Kika Lanches</span>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in navigationItems"
        :key="item.route"
        :class="['sidebar-link', { active: currentRoute === item.route }]"
        :aria-current="currentRoute === item.route ? 'page' : undefined"
        @click="$emit('navigate', item.route)"
      >
        <Icon :icon="item.icon" class="link-icon" />
        <span>{{ item.name }}</span>
      </button>
    </nav>

    <button class="sidebar-link logout" @click="handleLogout">
      <Icon icon="mdi:logout" class="link-icon" />
      <span>Sair</span>
    </button>
  </aside>

  <!-- Mobile top bar -->
  <header class="topbar">
    <img src="/icons/login-logo.png" alt="" class="brand-img">
    <span class="brand-name">Kika Lanches</span>
  </header>

  <!-- Mobile bottom tab bar -->
  <nav class="tabbar" aria-label="Navegação principal">
    <button
      v-for="item in primaryItems"
      :key="item.route"
      :class="['tab', { active: currentRoute === item.route }]"
      :aria-current="currentRoute === item.route ? 'page' : undefined"
      @click="navigateAndClose(item.route)"
    >
      <Icon :icon="item.icon" class="tab-icon" />
      <span>{{ item.short || item.name }}</span>
    </button>
    <button
      v-if="overflowItems.length"
      :class="['tab', { active: isMoreOpen || overflowActive }]"
      aria-haspopup="menu"
      :aria-expanded="isMoreOpen"
      @click="isMoreOpen = !isMoreOpen"
    >
      <Icon icon="mdi:dots-horizontal" class="tab-icon" />
      <span>Mais</span>
    </button>
    <button v-else class="tab" @click="handleLogout">
      <Icon icon="mdi:logout" class="tab-icon" />
      <span>Sair</span>
    </button>
  </nav>

  <!-- Mobile "Mais" sheet -->
  <div v-if="isMoreOpen" class="more-backdrop" @click="isMoreOpen = false">
    <div class="more-sheet" role="menu" @click.stop>
      <button
        v-for="item in overflowItems"
        :key="item.route"
        role="menuitem"
        :class="['more-item', { active: currentRoute === item.route }]"
        @click="navigateAndClose(item.route)"
      >
        <Icon :icon="item.icon" class="link-icon" />
        <span>{{ item.name }}</span>
      </button>
      <button class="more-item logout" role="menuitem" @click="handleLogout">
        <Icon icon="mdi:logout" class="link-icon" />
        <span>Sair</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuth } from '@/composables/useAuth'

interface NavigationItem {
  name: string
  short?: string
  route: string
  icon: string
}

interface Props {
  currentRoute: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  navigate: [route: string]
}>()

const { logout } = useAuth()

const isMoreOpen = ref(false)

const userRole = localStorage.getItem('user_role')
const isAdmin = userRole === 'admin' || userRole === 'tenant_owner'

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', short: 'Início', route: 'dashboard', icon: 'mdi:view-dashboard-outline' },
  { name: 'Vendas', route: 'sales', icon: 'mdi:cart-outline' },
  { name: 'Clientes', route: 'customers', icon: 'mdi:account-group-outline' },
  { name: 'Relatórios', route: 'reports', icon: 'mdi:chart-box-outline' },
  // Admin only items
  ...(isAdmin ? [
    { name: 'Produtos', route: 'products', icon: 'mdi:package-variant-closed' },
    { name: 'Categorias', route: 'categories', icon: 'mdi:shape-outline' },
    { name: 'Relatórios de Clientes', route: 'customer-reports', icon: 'mdi:file-chart-outline' },
    { name: 'Usuários', route: 'users', icon: 'mdi:account-cog-outline' }
  ] : [])
]

// Bottom bar fits 4 destinations; the rest go under "Mais"
const primaryItems = computed(() =>
  navigationItems.length > 5 ? navigationItems.slice(0, 4) : navigationItems
)
const overflowItems = computed(() =>
  navigationItems.length > 5 ? navigationItems.slice(4) : []
)
const overflowActive = computed(() =>
  overflowItems.value.some(item => item.route === props.currentRoute)
)

const navigateAndClose = (route: string) => {
  emit('navigate', route)
  isMoreOpen.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') isMoreOpen.value = false
}

const handleLogout = async () => {
  try {
    await logout()
    isMoreOpen.value = false
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<style lang="scss" scoped>
$sidebar-width: 240px;
$tabbar-height: 64px;

.brand-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.brand-name {
  font-weight: 600;
  font-size: var(--font-size-lg);
  color: var(--text);
}

// ---------- Desktop sidebar ----------
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: $sidebar-width;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4) var(--spacing-3);
  background: var(--surface);
  border-right: 1px solid var(--border);
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-4);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
  overflow-y: auto;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);

  &:hover {
    background: var(--surface-muted);
    color: var(--text);
  }

  &.active {
    background: var(--primary);
    color: #fff;
  }

  &.logout:hover {
    background: var(--danger-soft);
    color: var(--danger-strong);
  }
}

.link-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

// ---------- Mobile chrome (hidden on desktop) ----------
.topbar,
.tabbar,
.more-backdrop {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    display: none;
  }

  .topbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    position: sticky;
    top: 0;
    height: 52px;
    padding: 0 var(--spacing-4);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    z-index: 100;
  }

  .tabbar {
    display: flex;
    position: fixed;
    inset: auto 0 0 0;
    height: $tabbar-height;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--surface);
    border-top: 1px solid var(--border);
    z-index: 100;
  }

  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.6875rem;
    font-weight: 500;
    cursor: pointer;

    &.active {
      color: var(--primary);
    }
  }

  .tab-icon {
    font-size: 1.5rem;
  }

  .more-backdrop {
    display: flex;
    align-items: flex-end;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: 200;
  }

  .more-sheet {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-3) calc(#{$tabbar-height} + var(--spacing-3));
    background: var(--surface);
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .more-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    min-height: 48px;
    padding: 0 var(--spacing-3);
    border: 0;
    border-radius: var(--radius-lg);
    background: transparent;
    color: var(--text);
    font: inherit;
    cursor: pointer;

    &.active {
      background: var(--surface-muted);
      color: var(--primary);
    }

    &.logout {
      color: var(--danger-strong);
    }
  }
}
</style>
