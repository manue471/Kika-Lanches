<template>
  <div class="products">
    <div class="products-header">
      <h2>Gerenciar Produtos</h2>
      <BaseButton variant="primary" @click="$emit('showModal', 'product')">
        Adicionar Produto
      </BaseButton>
    </div>

    <div class="products-filters">
      <BaseInput
        v-model="productSearch"
        placeholder="Buscar produtos..."
        @input="filterProducts"
      />
      <BaseSelect
        v-model="selectedCategory"
        :options="categoryOptions"
        placeholder="Todas as categorias"
        @change="filterProducts"
      />
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

    <BaseCard class="products-container">
      <div :class="['products-grid', { 'list-view': viewMode === 'list' }]">
        <div v-if="filteredProducts.length === 0" class="no-data">
          Nenhum produto cadastrado
        </div>
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-item"
        >
          <div class="product-item-header">
            <div>
              <div class="product-item-name">{{ product.name }}</div>
              <div class="product-item-category">{{ getCategoryName(product.category) }}</div>
            </div>
          </div>
          <div class="product-item-price">{{ formattedCurrency(product.price) }}</div>
          <div v-if="product.stock !== undefined" :class="stockClasses(product.stock)">
            Estoque: {{ product.stock }} unidades
          </div>
          <div class="product-item-actions">
            <BaseButton variant="info" size="sm" @click="editProduct(product)">
              Editar
            </BaseButton>
            <BaseButton variant="danger" size="sm" @click="deleteProduct(product)">
              Excluir
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppData } from '@/composables/useStorage'
import { useFormatter } from '@/composables/useUtils'
import { useNotifications } from '@/composables/useNotifications'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'

const emit = defineEmits<{
  showModal: [type: string]
}>()

const { currency } = useFormatter()
const { showNotification } = useNotifications()
const appData = useAppData()

// Reactive data
const productSearch = ref('')
const selectedCategory = ref('')
const viewMode = ref<'grid' | 'list'>('grid')

// Computed properties
const formattedCurrency = currency

const categoryOptions = computed(() => {
  const categories = [...new Set(appData.value.products.map(p => p.category))]
  return [
    { value: '', label: 'Todas as categorias' },
    ...categories.map(cat => ({
      value: cat,
      label: getCategoryName(cat)
    }))
  ]
})

const filteredProducts = computed(() => {
  let products = appData.value.products
  
  if (productSearch.value) {
    const search = productSearch.value.toLowerCase()
    products = products.filter(product => 
      product.name.toLowerCase().includes(search)
    )
  }
  
  if (selectedCategory.value) {
    products = products.filter(product => 
      product.category === selectedCategory.value
    )
  }
  
  return products
})

// Methods
const getCategoryName = (category: string) => {
  const categories = {
    bebida: 'Bebida',
    salgado: 'Salgado',
    doce: 'Doce',
    lanche: 'Lanche',
    fruta: 'Fruta',
    outros: 'Outros'
  }
  return categories[category as keyof typeof categories] || category
}

const stockClasses = (stock: number) => {
  if (stock === 0) return 'product-item-stock out-of-stock'
  if (stock <= 5) return 'product-item-stock low-stock'
  return 'product-item-stock'
}

const editProduct = (product: any) => {
  showNotification(`Editar produto ${product.name} será implementado em breve`, 'info')
}

const deleteProduct = (product: any) => {
  if (confirm(`Tem certeza que deseja excluir o produto ${product.name}?`)) {
    const index = appData.value.products.findIndex(p => p.id === product.id)
    if (index > -1) {
      appData.value.products.splice(index, 1)
      showNotification('Produto excluído com sucesso', 'success')
    }
  }
}

const filterProducts = () => {
  // Filtering is handled by computed property
}
</script>

<style lang="scss" scoped>
.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-4);

  h2 {
    font-size: var(--font-size-3xl);
    color: var(--primary-dark);
    margin: 0;
  }
}

.products-filters {
  background: var(--white);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-6);
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  gap: var(--spacing-1);
}

.view-btn {
  background: var(--gray-200);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);

  &.active {
    background: var(--primary-light);
    color: var(--white);
  }

  &:hover:not(.active) {
    background: var(--gray-300);
  }
}

.products-container {
  padding: var(--spacing-6);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-4);

  &.list-view {
    grid-template-columns: 1fr;
  }
}

.product-item {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  transition: all var(--transition-normal);
  background: var(--gray-50);

  &:hover {
    border-color: var(--primary-light);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.products-grid.list-view .product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
}

.product-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-3);
}

.product-item-name {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-1);
}

.product-item-category {
  background: var(--primary-light);
  color: var(--white);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.product-item-price {
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--primary-medium);
  margin-bottom: var(--spacing-3);
}

.product-item-stock {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-bottom: var(--spacing-3);

  &.low-stock {
    color: var(--warning);
    font-weight: 500;
  }

  &.out-of-stock {
    color: var(--danger);
    font-weight: 500;
  }
}

.product-item-actions {
  display: flex;
  gap: var(--spacing-2);
}

@media (max-width: 768px) {
  .products-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .products-filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
