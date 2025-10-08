<template>
  <header class="header">
    <div class="header-content">
      <h1 class="logo">
        <img src="/icons/login-logo.png" alt="Kika Lanches" class="logo-img">
        Kika Lanches</h1>
      
      <!-- Desktop Navigation -->
      <nav class="nav desktop-nav">
        <button
          v-for="item in navigationItems"
          :key="item.name"
          :class="['nav-btn', { active: currentRoute === item.route }]"
          @click="$emit('navigate', item.route)"
        >
          {{ item.name }}
        </button>
      </nav>
      
      <!-- Mobile Menu Button -->
      <button 
        class="mobile-menu-btn" 
        @click="toggleMobileMenu"
        :class="{ active: isMobileMenuOpen }"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
  
    </div>
    
    <!-- Mobile Navigation Menu -->
    <div 
      v-if="isMobileMenuOpen"
      class="mobile-menu" 
      :class="{ open: isMobileMenuOpen }"
      @click="closeMobileMenu"
    >
      <div class="mobile-menu-content" @click.stop>
        <div class="mobile-menu-header">
          <h2>Menu</h2>
          <button class="close-btn" @click="closeMobileMenu">
            ✕
          </button>
        </div>
        
        <nav class="mobile-nav">
          <button
            v-for="item in navigationItems"
            :key="item.name"
            :class="['mobile-nav-btn', { active: currentRoute === item.route }]"
            @click="navigateAndClose(item.route)"
          >
            <span class="nav-icon">{{ getNavIcon(item.route) }}</span>
            <span class="nav-text">{{ item.name }}</span>
          </button>
        </nav>
        
        <div class="mobile-menu-footer">
          <button class="mobile-theme-toggle" @click="toggleTheme">
            <span class="theme-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
            <span>{{ theme === 'dark' ? 'Modo Claro' : 'Modo Escuro' }}</span>
          </button>
          <button class="mobile-logout-btn" @click="handleLogout">
            <span class="logout-icon">🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useStorage'
import { useAuth } from '@/composables/useAuth'

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
const { logout } = useAuth()

// Initialize theme on mount
initTheme()

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Get user role
const getUserRole = (): string | null => {
  return localStorage.getItem('user_role')
}

const userRole = getUserRole()
const isAdmin = userRole === 'admin' || userRole === 'tenant_owner'

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', route: 'dashboard' },
  { name: 'Vendas', route: 'sales' },
  { name: 'Clientes', route: 'customers' },
  // Admin only items
  ...(isAdmin ? [
    { name: 'Produtos', route: 'products' },
    { name: 'Categorias', route: 'categories' },
    { name: 'Relatórios de Clientes', route: 'customer-reports' },
    { name: 'Usuários', route: 'users' }
  ] : [])
]

// Mobile menu methods
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const navigateAndClose = (route: string) => {
  try {
    emit('navigate', route)
    closeMobileMenu()
  } catch (error) {
    console.error('Error navigating:', error)
  }
}

const getNavIcon = (route: string) => {
  const icons: Record<string, string> = {
    dashboard: '📊',
    sales: '🛒',
    products: '📦',
    categories: '📁',
    customers: '👥',
    reports: '📈',
    users: '👤'
  }
  return icons[route] || '📄'
}

// Keyboard and click outside handling
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

const handleLogout = async () => {
  try {
    await logout()
    closeMobileMenu()
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

onMounted(() => {
  try {
    document.addEventListener('keydown', handleKeydown)
  } catch (error) {
    console.error('Error adding event listener:', error)
  }
})

onUnmounted(() => {
  try {
    document.removeEventListener('keydown', handleKeydown)
  } catch (error) {
    // Ignore errors during cleanup
    console.warn('Error removing event listener:', error)
  }
})
</script>

<style lang="scss" scoped>
.header {
  background: #141d85;
  color: var(--white);
  padding: var(--spacing-4) 0;
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.logo {
  font-size: var(--font-size-2xl);
  font-weight: bold;
  color: var(--white);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin: 0;
  flex-shrink: 0;
}

// Desktop Navigation
.desktop-nav {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
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
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.logout-btn {
  background: rgba(255, 87, 87, 0.1);
  border: 1px solid rgba(255, 87, 87, 0.3);
  color: var(--white);
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-lg);
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 87, 87, 0.2);
    border-color: rgba(255, 87, 87, 0.5);
  }
}

// Mobile Menu Button
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
  gap: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: var(--primary-light);
    
    .hamburger-line {
      &:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      
      &:nth-child(2) {
        opacity: 0;
      }
      
      &:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
    }
  }
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background: var(--white);
  transition: all var(--transition-fast);
  border-radius: 1px;
}

// Mobile Menu
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);

  &.open {
    opacity: 1;
    visibility: visible;
  }
}

.mobile-menu-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: var(--white);
  color: var(--gray-800);
  box-shadow: var(--shadow-xl);
  transform: translateY(-100%);
  transition: transform var(--transition-normal);
  max-height: 100vh;
  overflow-y: auto;
}

.mobile-menu.open .mobile-menu-content {
  transform: translateY(0);
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--gray-200);
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
  color: var(--white);

  h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: bold;
  }
}

.logo-img {
  width: 40px;
  height: 40px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--white);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
}

.mobile-nav {
  padding: var(--spacing-4);
}

.mobile-nav-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-4);
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  margin-bottom: var(--spacing-2);

  &:hover {
    background: var(--gray-100);
    transform: translateX(4px);
  }

  &.active {
    background: var(--primary-light);
    color: var(--primary-dark);
    font-weight: 600;
  }
}

.nav-icon {
  font-size: var(--font-size-xl);
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: var(--font-size-base);
  font-weight: 500;
}

.mobile-menu-footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
}

.mobile-theme-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3);
  background: var(--white);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: 500;

  &:hover {
    background: var(--gray-100);
    border-color: var(--primary-light);
  }
}

.theme-icon {
  font-size: var(--font-size-lg);
}

.mobile-logout-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3);
  background: var(--white);
  border: 1px solid rgba(255, 87, 87, 0.3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  color: #dc2626;
  margin-top: var(--spacing-2);

  &:hover {
    background: rgba(255, 87, 87, 0.05);
    border-color: rgba(255, 87, 87, 0.5);
  }

  .logout-icon {
    font-size: var(--font-size-lg);
  }
}

// Responsive Design
@media (max-width: 768px) {
  .header-content {
    padding: 0 var(--spacing-3);
  }

  .logo {
    font-size: var(--font-size-xl);
  }

  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .theme-toggle {
    display: none;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 var(--spacing-2);
  }

  .logo {
    font-size: var(--font-size-lg);
  }

  .mobile-menu-btn {
    width: 36px;
    height: 36px;
  }

  .hamburger-line {
    width: 18px;
  }

  .mobile-menu-header {
    padding: var(--spacing-4);
  }

  .mobile-nav {
    padding: var(--spacing-3);
  }

  .mobile-nav-btn {
    padding: var(--spacing-3);
  }

  .mobile-menu-footer {
    padding: var(--spacing-3);
  }
}

// Landscape mobile optimization
@media (max-width: 768px) and (orientation: landscape) {
  .mobile-menu-content {
    max-height: 80vh;
  }
}
</style>
