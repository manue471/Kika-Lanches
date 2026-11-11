<template>
  <div class="products">
    <!-- Header -->
    <PageHeader title="Produtos" description="Gerencie o catálogo, preços e estoque">
      <template #actions>
        <BaseButton variant="primary" @click="createNewProduct" :loading="isCreating">
          Adicionar Produto
        </BaseButton>
      </template>
    </PageHeader>

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
    <div v-else-if="products && products.length > 0" class="products-list-wrap">
      <div class="products-grid" :class="{ 'list-view': viewMode === 'list' }">
      <article
        v-for="product in products"
        :key="product.id"
        class="product-card"
        :class="{ inactive: !product.is_active }"
      >
        <header class="product-top">
          <Badge v-if="product.category" variant="neutral">{{ product.category.name }}</Badge>
          <span v-else />
          <Badge :variant="product.is_active ? 'success' : 'neutral'">
            {{ product.is_active ? 'Ativo' : 'Inativo' }}
          </Badge>
        </header>

        <div class="product-main">
          <h3 class="product-name">{{ product.name }}</h3>
          <p v-if="product.sku" class="product-sku">SKU {{ product.sku }}</p>
          <p v-if="product.description" class="product-description">{{ product.description }}</p>
        </div>

        <div class="product-metrics">
          <div class="metric">
            <span class="metric-label">Preço</span>
            <span class="metric-value">{{ formatCurrency(product.price) }}</span>
          </div>
          <div v-if="getStockQuantity(product) !== undefined" class="metric">
            <span class="metric-label">Estoque</span>
            <Badge :variant="stockBadge(product).variant">{{ stockBadge(product).label }}</Badge>
          </div>
        </div>

        <footer class="product-footer">
          <label class="switch" :title="product.is_active ? 'Desativar produto' : 'Ativar produto'">
            <input
              type="checkbox"
              role="switch"
              :checked="product.is_active"
              :disabled="isToggling"
              @change="toggleProductActive(product.id)"
            >
            <span class="switch-track" />
            <span class="switch-text">{{ product.is_active ? 'Ativo' : 'Inativo' }}</span>
          </label>

          <span v-if="product.created_at" class="created-date">
            {{ formatDate(product.created_at) }}
          </span>

          <div class="product-actions">
            <button class="icon-btn" aria-label="Ajustar estoque" title="Ajustar estoque" @click="openStock(product)">
              <Icon icon="mdi:package-variant-closed-plus" />
            </button>
            <button class="icon-btn" aria-label="Editar produto" title="Editar" @click="editProduct(product)">
              <Icon icon="mdi:pencil-outline" />
            </button>
            <button
              class="icon-btn danger"
              aria-label="Excluir produto"
              title="Excluir"
              :disabled="isDeleting"
              @click="deleteProductConfirm(product.id)"
            >
              <Icon icon="mdi:trash-can-outline" />
            </button>
          </div>
        </footer>
      </article>
      </div>
      <div ref="loadMoreSentinel" class="load-more-sentinel" aria-hidden="true" />
      <div v-if="isLoadingMore" class="load-more-hint">Carregando mais produtos...</div>
      <div v-else-if="hasMoreProducts" class="load-more-hint subtle">Role para carregar mais</div>
    </div>

    <!-- Empty State -->
    <BaseCard v-if="!isLoading && !error && (!products || products.length === 0)" class="empty-state">
      <div class="empty-content">
        <span class="empty-icon">📦</span>
        <h3>Nenhum produto encontrado</h3>
        <p>Comece criando seu primeiro produto!</p>
        <BaseButton variant="primary" @click="createNewProduct">
          Criar Produto
        </BaseButton>
      </div>
    </BaseCard>

    <StockAdjustModal
      v-model:show="showStockModal"
      :product="stockProduct"
      @success="refresh"
    />

    <!-- Product Modal -->
    <ProductModal
      v-model:show="showProductModal"
      :product-id="selectedProductId"
      @success="handleProductSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useProducts } from '@/composables/useProducts'
import { useFormatter } from '@/composables/useUtils'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import PageHeader from '@/components/Base/PageHeader.vue'
import Badge from '@/components/Base/Badge.vue'
import { Icon } from '@iconify/vue'
import StockAdjustModal from '@/components/Modals/StockAdjustModal.vue'
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
  hasMoreProducts,
  isLoadingMore,
  
  // Errors
  error,
  
  // Methods
  loadProducts,
  loadMoreProducts,
  loadCategories,
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
const showStockModal = ref(false)
const stockProduct = ref<Product | null>(null)
const loadMoreSentinel = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

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

// Helper functions for stock display
const getStockQuantity = (product: Product): number | undefined => {
  if (product.stock?.quantity !== undefined) {
    return product.stock.quantity
  }
  return product.stock_quantity
}

const stockBadge = (product: Product): { variant: 'neutral' | 'warning' | 'danger' | 'info'; label: string } => {
  const quantity = getStockQuantity(product) ?? 0
  if (product.stock?.allow_backorder && quantity <= 0) {
    return { variant: 'info', label: `Venda sem estoque (${quantity})` }
  }
  if (quantity === 0) return { variant: 'danger', label: 'Sem estoque' }
  if (quantity <= 5) return { variant: 'warning', label: `${quantity} un. · baixo` }
  return { variant: 'neutral', label: `${quantity} unidades` }
}

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

const openStock = (product: Product) => {
  stockProduct.value = product
  showStockModal.value = true
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

const setupInfiniteScroll = () => {
  loadMoreObserver?.disconnect()
  if (!loadMoreSentinel.value) return
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (e?.isIntersecting && hasMoreProducts.value && !isLoadingMore.value && !isLoading.value) {
        loadMoreProducts()
      }
    },
    { root: null, rootMargin: '120px', threshold: 0 }
  )
  loadMoreObserver.observe(loadMoreSentinel.value)
}

watch(
  () => products.value.length,
  () => {
    nextTick(() => {
      if (products.value.length > 0) setupInfiniteScroll()
    })
  }
)

onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadCategories()
  ])
  await nextTick()
  if (products.value.length > 0) setupInfiniteScroll()
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null
})
</script>

<style lang="scss" scoped>

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

.products-list-wrap {
  margin-bottom: var(--spacing-6);
}

.load-more-sentinel {
  height: 1px;
  width: 100%;
}

.load-more-hint {
  text-align: center;
  padding: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  &.subtle {
    color: var(--gray-400);
    font-size: var(--font-size-xs);
  }
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-4);

  &.list-view {
    grid-template-columns: 1fr;
  }
}

.product-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    border-color: var(--gray-400);
    box-shadow: var(--shadow-md);
  }

  &.inactive .product-name,
  &.inactive .metric-value {
    color: var(--text-muted);
  }
}

.product-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-2);
  min-height: 22px;
}

.product-main {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
  overflow-wrap: anywhere;
}

.product-sku {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.product-description {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-metrics {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-3) 0;
  border-top: 1px solid var(--border);
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-1);

  &:last-child:not(:first-child) {
    align-items: flex-end;
  }
}

.metric-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
}

.product-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--border);
}

.created-date {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--gray-500);
}

.product-actions {
  display: flex;
  gap: var(--spacing-1);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 1.125rem;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--surface-muted);
    color: var(--text);
  }

  &.danger:hover:not(:disabled) {
    background: var(--danger-soft);
    color: var(--danger-strong);
    border-color: var(--danger-soft);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  &:has(input:disabled) {
    opacity: 0.6;
    cursor: wait;
  }
}

.switch-track {
  position: relative;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: var(--gray-400);
  transition: background var(--transition-fast);

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: transform var(--transition-fast);
  }
}

.switch input:checked + .switch-track {
  background: var(--success);

  &::after {
    transform: translateX(14px);
  }
}

.switch input:focus-visible + .switch-track {
  outline: 2px solid var(--primary-light);
  outline-offset: 2px;
}

.switch-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-muted);
}

// List view: one compact row per product
.list-view .product-card {
  display: grid;
  grid-template-columns: minmax(0, 2fr) auto auto auto;
  grid-template-areas: 'main top metrics footer';
  align-items: center;
  gap: var(--spacing-5);

  .product-top { grid-area: top; flex-direction: column; align-items: flex-start; gap: var(--spacing-1); }
  .product-main { grid-area: main; }
  .product-metrics { grid-area: metrics; border: 0; padding: 0; gap: var(--spacing-5); }
  .product-footer { grid-area: footer; border: 0; padding: 0; }
  .product-description { -webkit-line-clamp: 1; }
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
  
  .list-view .product-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-3);

    .product-top { flex-direction: row; align-items: center; }
    .product-metrics { padding: var(--spacing-3) 0; border-top: 1px solid var(--border); }
    .product-footer { padding-top: var(--spacing-3); border-top: 1px solid var(--border); }
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

</style>
