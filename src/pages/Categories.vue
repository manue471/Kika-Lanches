<template>
  <div class="categories">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Categorias</h1>
        <p class="page-description">Gerencie as categorias dos seus produtos</p>
      </div>
      <BaseButton 
        variant="primary" 
        @click="showCategoryModal = true"
        :loading="isCreating"
      >
        <span class="btn-icon">📁</span>
        Nova Categoria
      </BaseButton>
    </div>

    <!-- Loading State -->
    <BaseLoading 
      v-if="isLoading" 
      :show="isLoading"
      variant="overlay"
    />

    <!-- Error State -->
    <BaseCard v-if="error" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao carregar categorias</h3>
          <p>{{ error }}</p>
          <BaseButton @click="loadCategories" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Categories Grid -->
    <div v-else class="categories-grid">
      <!-- Empty State -->
      <div v-if="!categories || categories.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>Nenhuma categoria encontrada</h3>
        <p>Comece criando sua primeira categoria clicando no botão "Nova Categoria"</p>
        <BaseButton 
          variant="primary" 
          @click="showCategoryModal = true"
          :loading="isCreating"
        >
          <span class="btn-icon">📁</span>
          Nova Categoria
        </BaseButton>
      </div>

      <!-- Categories List -->
      <BaseCard
        v-else
        v-for="category in categories"
        :key="category.id"
        class="category-card"
        :class="{ 'inactive': !category.is_active }"
      >
        <div class="category-header" v-if="category && category.id">
          <div class="category-info">
            <h3 class="category-name">{{ category.name }}</h3>
            <p class="category-description" v-if="category.description">
              {{ category.description }}
            </p>
            <div class="category-meta">
              <span class="category-id">ID: {{ category.id }}</span>
              <span class="category-status" :class="category.is_active ? 'active' : 'inactive'">
                {{ category.is_active ? 'Ativa' : 'Inativa' }}
              </span>
            </div>
          </div>
          <div class="category-actions">
            <BaseButton
              size="sm"
              :variant="category.is_active ? 'success' : 'secondary'"
              @click="toggleCategoryActive(category.id)"
              :loading="isUpdating"
            >
              {{ category.is_active ? 'Ativa' : 'Inativa' }}
            </BaseButton>
            <BaseButton
              size="sm"
              variant="primary"
              @click="editCategory(category)"
            >
              Editar
            </BaseButton>
            <BaseButton 
              v-if="isAdmin"
              size="sm"
              variant="danger"
              @click="deleteCategory(category.id)"
              :loading="isDeleting"
            >
              Excluir
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Category Modal -->
    <CategoryModal
      :show="showCategoryModal"
      :category="selectedCategory"
      @update:show="showCategoryModal = $event"
      @success="handleCategorySuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import CategoryModal from '../components/Modals/CategoryModal.vue'
import { useCategories } from '@/composables/useCategories'
import type { Category } from '@/types/api'

// Get user role from localStorage
const getUserRole = (): string | null => {
  return localStorage.getItem('user_role')
}

const userRole = getUserRole()
// const isStaff = computed(() => userRole === 'staff')
const isAdmin = computed(() => userRole === 'admin' || userRole === 'tenant_owner')

// Composables
const {
  categories,
  error,
  isLoading,
  isCreating,
  isUpdating,
  isDeleting,
  loadCategories,
  // createCategory,
  updateCategory,
  deleteCategory
} = useCategories()

// UI State
const showCategoryModal = ref(false)
const selectedCategory = ref<Category | null>(null)

// Methods
const editCategory = (category: Category) => {
  selectedCategory.value = category
  showCategoryModal.value = true
}

const handleCategorySuccess = () => {
  showCategoryModal.value = false
  selectedCategory.value = null
  loadCategories() // Refresh the list
}

const toggleCategoryActive = async (id: number) => {
  const category = categories.value.find(cat => cat.id === id)
  if (category) {
    try {
      await updateCategory(id, { is_active: !category.is_active })
    } catch (error) {
      // Error is handled by the composable
    }
  }
}

// const deleteCategoryConfirm = async (id: number) => {
//   if (confirm('Tem certeza que deseja excluir esta categoria?')) {
//     try {
//       await deleteCategory(id)
//     } catch (error) {
//       // Error is handled by the composable
//     }
//   }
// }
</script>

<style lang="scss" scoped>
.categories {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-8);
  gap: var(--spacing-4);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color-dark);
  margin: 0 0 var(--spacing-2) 0;
}

.page-description {
  color: var(--gray-600);
  margin: 0;
  font-size: var(--font-size-sm);
}

.error-card {
  margin-bottom: var(--spacing-6);
}

.error-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4);

  .error-icon {
    font-size: var(--font-size-2xl);
    color: var(--danger);
  }

  h3 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--danger);
  }

  p {
    margin: 0 0 var(--spacing-3) 0;
    color: var(--gray-600);
  }
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-6);
}

.category-card {
  transition: all var(--transition-normal);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &.inactive {
    opacity: 0.6;
    background: var(--gray-50);
  }
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-4);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color-dark);
  margin: 0 0 var(--spacing-2) 0;
}

.category-description {
  color: var(--gray-600);
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.category-meta {
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
  flex-wrap: wrap;
}

.category-id {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  background: var(--gray-100);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
}

.category-status {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);

  &.active {
    background: var(--success-light);
    color: var(--success-dark);
  }

  &.inactive {
    background: var(--gray-200);
    color: var(--gray-600);
  }
}

.category-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: stretch;
    
    > * {
      flex: 1;
    }
  }
}

// Empty State Styles
.empty-state {
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-4);
  opacity: 0.6;
}

.empty-state h3 {
  color: var(--gray-700);
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-lg);
}

.empty-state p {
  color: var(--gray-500);
  margin-bottom: var(--spacing-6);
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  .categories {
    padding: var(--spacing-4);
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
  
  .category-header {
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .category-actions {
    width: 100%;
    justify-content: stretch;
    
    > * {
      flex: 1;
    }
  }
}

@media (max-width: 480px) {
  .categories {
    padding: var(--spacing-2);
  }
}
</style>
