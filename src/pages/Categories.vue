<template>
  <div class="categories">
    <PageHeader title="Categorias" description="Gerencie as categorias dos seus produtos">
      <template #actions>
        <BaseButton variant="primary" @click="createNewCategory" :loading="isCreating">
          Nova Categoria
        </BaseButton>
      </template>
    </PageHeader>

    <BaseLoading v-if="isLoading" :show="isLoading" variant="overlay" />

    <EmptyState
      v-if="error"
      icon="mdi:alert-circle-outline"
      title="Erro ao carregar categorias"
      :description="error"
    >
      <BaseButton @click="loadCategories" variant="secondary">Tentar novamente</BaseButton>
    </EmptyState>

    <template v-else>
      <EmptyState
        v-if="!categories || categories.length === 0"
        icon="mdi:shape-outline"
        title="Nenhuma categoria encontrada"
        description='Comece criando sua primeira categoria clicando em "Nova Categoria"'
      >
        <BaseButton variant="primary" @click="createNewCategory" :loading="isCreating">
          Nova Categoria
        </BaseButton>
      </EmptyState>

      <ul v-else class="category-list">
        <li
          v-for="category in categories"
          :key="category.id"
          class="category-row"
          :class="{ inactive: !category.is_active }"
        >
          <div class="category-info">
            <div class="category-title">
              <h3 class="category-name">{{ category.name }}</h3>
              <Badge :variant="category.is_active ? 'success' : 'neutral'">
                {{ category.is_active ? 'Ativa' : 'Inativa' }}
              </Badge>
            </div>
            <p v-if="category.description" class="category-description">
              {{ category.description }}
            </p>
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
            <BaseButton size="sm" variant="primary" @click="editCategory(category)">
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
        </li>
      </ul>
    </template>

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
import BaseButton from '@/components/Base/Button.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import PageHeader from '@/components/Base/PageHeader.vue'
import EmptyState from '@/components/Base/EmptyState.vue'
import Badge from '@/components/Base/Badge.vue'
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
const createNewCategory = () => {
  selectedCategory.value = null
  showCategoryModal.value = true
}

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
.category-list {
  list-style: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-5);

  & + & {
    border-top: 1px solid var(--border);
  }

  &.inactive .category-name {
    color: var(--text-muted);
  }
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.category-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text);
}

.category-description {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.category-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .category-row {
    flex-direction: column;
    align-items: stretch;
  }

  .category-actions > * {
    flex: 1;
  }
}
</style>
