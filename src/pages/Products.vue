<template>
  <div class="products">
    <!-- Header -->
    <div class="products-header">
      <h2>Gerenciar Produtos</h2>
      <BaseButton 
        variant="primary" 
        @click="createNewProduct"
        :loading="isCreating"
      >
        <span class="btn-icon">➕</span>
        Adicionar Produto
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="filters-card">
      <div class="filters-header">
        <h3>Filtros</h3>
        <BaseButton 
          variant="secondary" 
          size="sm" 
          @click="clearAllFilters"
        >
          Limpar Filtros
        </BaseButton>
      </div>
      
      <div class="filters-grid">
        <!-- Search -->
        <div class="filter-group">
          <label class="filter-label">Buscar</label>
          <BaseInput
            v-model="searchTerm"
            placeholder="Nome, descrição ou SKU..."
            @input="handleSearch"
            class="search-input"
          />
        </div>

        <!-- Category Filter -->
        <div class="filter-group">
          <label class="filter-label">Categoria</label>
          <BaseSelect
            v-model="selectedCategory"
            :options="categoryOptions"
            placeholder="Todas as categorias"
            @change="handleCategoryFilter"
          />
        </div>

        <!-- Price Range -->
        <div class="filter-group">
          <label class="filter-label">Faixa de Preço</label>
          <div class="price-range">
            <BaseInput
              v-model="minPriceInput"
              type="number"
              placeholder="Mín."
              @input="handlePriceFilter"
              class="price-input"
            />
            <span class="price-separator">até</span>
            <BaseInput
              v-model="maxPriceInput"
              type="number"
              placeholder="Máx."
              @input="handlePriceFilter"
              class="price-input"
            />
          </div>
        </div>

        <!-- Stock Filter -->
        <div class="filter-group">
          <label class="filter-label">Estoque</label>
          <BaseSelect
            v-model="stockFilter"
            :options="stockOptions"
            placeholder="Todos"
            @change="handleStockFilter"
          />
        </div>

        <!-- Sort -->
        <div class="filter-group">
          <label class="filter-label">Ordenar por</label>
          <div class="sort-controls">
            <BaseSelect
              v-model="sortBy"
              :options="sortOptions"
              @change="handleSort"
            />
            <BaseButton
              :variant="sortOrder === 'asc' ? 'primary' : 'secondary'"
              size="sm"
              @click="toggleSortOrder"
              class="sort-order-btn"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </BaseButton>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <BaseSelect
            v-model="statusFilter"
            :options="statusOptions"
            placeholder="Todos"
            @change="handleStatusFilter"
          />
        </div>

        <!-- View Toggle -->
        <div class="filter-group">
          <label class="filter-label">Visualização</label>
          <div class="view-toggle">
            <button
              :class="['view-btn', { active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
            >
              Grid
            </button>
            <button
              :class="['view-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
            >
              Lista
            </button>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Loading State -->
    <BaseLoading 
      v-if="isLoading" 
      message="Carregando produtos..."
      :show="isLoading"
      variant="overlay"
    />

    <!-- Error State -->
    <BaseCard v-if="error" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao carregar produtos</h3>
          <p>{{ error }}</p>
          <BaseButton @click="refresh" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Products Grid -->
    <div v-else class="products-grid" :class="{ 'list-view': viewMode === 'list' }">
      <!-- Products List -->
      <BaseCard
        v-for="product in products"
        :key="product.id"
        class="product-card"
        :class="{ 'inactive': !product.is_active }"
      >
        <div class="product-header" v-if="product && product.id">
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-sku" v-if="product.sku">SKU: {{ product.sku }}</p>
            <p class="product-category" v-if="product.category">
              {{ product.category.name }}
            </p>
          </div>
          <div class="product-actions">
            <BaseButton
              size="sm"
              :variant="product.is_active ? 'success' : 'secondary'"
              @click="toggleProductActive(product.id)"
              :loading="isToggling"
            >
              {{ product.is_active ? 'Ativo' : 'Inativo' }}
            </BaseButton>
            <BaseButton
              size="sm"
              variant="secondary"
              @click="editProduct(product)"
            >
              Editar
            </BaseButton>
            <BaseButton
              size="sm"
              variant="danger"
              @click="deleteProductConfirm(product.id)"
              :loading="isDeleting"
            >
              Excluir
            </BaseButton>
          </div>
        </div>

        <div class="product-details">
          <div class="product-price">
            <span class="price-label">Preço:</span>
            <span class="price-value">{{ formatCurrency(product.price) }}</span>
          </div>
          
          <div class="product-stock" v-if="product.stock_quantity !== undefined">
            <span class="stock-label">Estoque:</span>
            <span 
              class="stock-value"
              :class="{ 'low-stock': product.stock_quantity <= 5 }"
            >
              {{ product.stock_quantity }} unidades
            </span>
          </div>
        </div>

        <div v-if="product.description" class="product-description">
          {{ product.description }}
        </div>

        <div class="product-footer">
          <div class="product-meta">
            <span class="created-date" v-if="product.created_at">
              Criado em {{ formatDate(product.created_at) }}
            </span>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <BaseCard v-if="!isLoading && (!products || products.length === 0)" class="empty-state">
      <div class="empty-content">
        <span class="empty-icon">📦</span>
        <h3>Nenhum produto encontrado</h3>
        <p>Comece criando seu primeiro produto!</p>
        <BaseButton variant="primary" @click="createNewProduct">
          Criar Produto
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Product Modal -->
    <ProductModal
      v-model:show="showProductModal"
      :product-id="selectedProductId"
      @success="handleProductSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useFormatter } from '@/composables/useUtils'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import ProductModal from '@/components/Modals/ProductModal.vue'
import type { Product } from '@/types/api'

const {
  // State
  products,
  categoryOptions,
  searchTerm,
  selectedCategory,
  sortBy,
  sortOrder,
  showOnlyActive,
  
  // Loading states
  isLoading,
  isCreating,
  // isUpdating,
  isDeleting,
  isToggling,
  
  // Errors
  error,
  
  // Methods
  searchProducts,
  filterByCategory,
  filterByPriceRange,
  filterByStock,
  sortProducts,
  // createProduct,
  // updateProduct,
  deleteProduct,
  toggleActive,
  refresh,
  clearFilters
} = useProducts()

const { currency, date } = useFormatter()

// UI State
const viewMode = ref<'grid' | 'list'>('grid')
const showProductModal = ref(false)
const selectedProductId = ref<number | null>(null)

// Filter inputs
const minPriceInput = ref<string>('')
const maxPriceInput = ref<string>('')
const stockFilter = ref<string>('')
const statusFilter = ref<string>('')

// Filter options
const stockOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Em estoque' },
  { value: 'false', label: 'Sem estoque' }
]

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' }
]

const sortOptions = [
  { value: 'name', label: 'Nome' },
  { value: 'price', label: 'Preço' },
  { value: 'created_at', label: 'Data de criação' },
  { value: 'updated_at', label: 'Última atualização' }
]

// Computed
const formatCurrency = currency
const formatDate = (dateString: string) => {
  return date(new Date(dateString))
}

// Methods
const handleSearch = () => {
  searchProducts(searchTerm.value)
}

const handleCategoryFilter = () => {
  filterByCategory(selectedCategory.value)
}

const handlePriceFilter = () => {
  const min = minPriceInput.value ? parseFloat(minPriceInput.value) : undefined
  const max = maxPriceInput.value ? parseFloat(maxPriceInput.value) : undefined
  filterByPriceRange(min, max)
}

const handleStockFilter = () => {
  const stockValue = stockFilter.value === '' ? undefined : stockFilter.value === 'true'
  filterByStock(stockValue)
}

const handleStatusFilter = () => {
  const statusValue = statusFilter.value === '' ? undefined : statusFilter.value === 'true'
  showOnlyActive.value = statusValue
  refresh()
}

const handleSort = () => {
  sortProducts(sortBy.value, sortOrder.value)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  sortProducts(sortBy.value, sortOrder.value)
}

const clearAllFilters = () => {
  minPriceInput.value = ''
  maxPriceInput.value = ''
  stockFilter.value = ''
  statusFilter.value = ''
  clearFilters()
}

const createNewProduct = () => {
  selectedProductId.value = null
  showProductModal.value = true
}

const editProduct = (product: Product) => {
  selectedProductId.value = product.id
  showProductModal.value = true
}

const handleProductSuccess = () => {
  showProductModal.value = false
  selectedProductId.value = null
  refresh() // Refresh the products list
}

const toggleProductActive = async (id: number) => {
  await toggleActive(id)
}

const deleteProductConfirm = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    await deleteProduct(id)
  }
}
</script>

<style lang="scss" scoped>
.products {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  
  h2 {
    margin: 0;
    color: var(--primary-dark);
  }
}

.filters-card {
  margin-bottom: var(--spacing-6);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  
  h3 {
    margin: 0;
    color: var(--primary-dark);
    font-size: var(--font-size-lg);
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--spacing-1);
}

.search-input {
  min-width: 200px;
}

.price-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  
  .price-input {
    flex: 1;
    min-width: 80px;
  }
  
  .price-separator {
    font-size: var(--font-size-sm);
    color: var(--gray-500);
    white-space: nowrap;
  }
}

.sort-controls {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
  
  .sort-order-btn {
    min-width: 40px;
    padding: var(--spacing-2);
  }
}

.filter-actions {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: var(--spacing-1);
  margin-left: var(--spacing-4);
}

.view-btn {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--gray-300);
  background: var(--white);
  color: var(--gray-600);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);

  &.active {
    background: var(--primary-light);
    color: var(--white);
    border-color: var(--primary-light);
  }

  &:hover:not(.active) {
    background: var(--gray-100);
  }
}

.error-card {
  margin-bottom: var(--spacing-6);
}

.error-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  
  .error-icon {
    font-size: var(--font-size-2xl);
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-6);

  &.list-view {
    grid-template-columns: 1fr;
  }
}

.product-card {
  transition: all var(--transition-normal);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &.inactive {
    opacity: 0.6;
    border-left: 4px solid var(--gray-400);
  }
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
}

.product-info {
  flex: 1;
  
  .product-name {
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-dark);
  }
  
  .product-sku {
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-sm);
    color: var(--gray-500);
  }

  .product-category {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--gray-600);
  }
}

.product-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.product-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.product-price,
.product-stock {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  
  .price-label,
  .stock-label {
    font-size: var(--font-size-xs);
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .price-value {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-dark);
  }
  
  .stock-value {
    font-size: var(--font-size-base);
    font-weight: 500;
    
    &.low-stock {
      color: var(--warning);
    }
  }
}

.product-description {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  line-height: 1.5;
  margin-bottom: var(--spacing-4);
}

.product-footer {
  border-top: 1px solid var(--gray-200);
  padding-top: var(--spacing-3);
  
  .product-meta {
    font-size: var(--font-size-xs);
    color: var(--gray-500);
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-12);
}

.empty-content {
  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-4);
  }
  
  h3 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--gray-700);
  }
  
  p {
    margin: 0 0 var(--spacing-6) 0;
    color: var(--gray-500);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .products {
    padding: var(--spacing-4);
  }
  
  .products-header {
    flex-direction: column;
    gap: var(--spacing-4);
    align-items: stretch;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
  }
  
  .filter-group {
    width: 100%;
  }
  
  .price-range {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-2);
    
    .price-separator {
      text-align: center;
    }
  }
  
  .sort-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-2);
  }
  
  .view-toggle {
    margin-left: 0;
    justify-content: center;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
  
  .product-header {
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .product-actions {
    width: 100%;
    justify-content: stretch;
    
    > * {
      flex: 1;
    }
  }
  
  .product-details {
    grid-template-columns: 1fr;
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

@media (max-width: 480px) {
  .products {
    padding: var(--spacing-2);
  }
  
  .product-actions {
    flex-direction: column;
  }
}
</style>
