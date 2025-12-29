<template>
  <div 
    :class="['product-card', { 'product-card-out-of-stock': isOutOfStock }]"
    @click="handleClick"
  >
    <div class="product-card-category">{{ categoryName }}</div>
    <div class="product-card-name">{{ product.name }}</div>
    <div class="product-card-price">{{ formattedPrice }}</div>
    <div v-if="showStock && stockQuantity !== undefined" :class="stockClasses">
      <span v-if="product.stock?.allow_backorder && stockQuantity <= 0" class="backorder-badge">
        ⚠️ Venda sem estoque
      </span>
      <span v-else>
        Estoque: {{ stockQuantity }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatter } from '@/composables/useUtils'

interface Stock {
  quantity: number
  allow_backorder?: boolean
}

interface Product {
  id: number
  name: string
  price: number
  category: string
  stock_quantity?: number
  stock?: Stock
}

interface Props {
  product: Product
  showStock?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showStock: true,
  clickable: true
})

const emit = defineEmits<{
  click: [product: Product]
}>()

const { currency } = useFormatter()

const formattedPrice = computed(() => currency(props.product.price))

// Get stock quantity from stock.quantity or stock_quantity
const stockQuantity = computed(() => {
  if (props.product.stock?.quantity !== undefined) {
    return props.product.stock.quantity
  }
  return props.product.stock_quantity
})

const isOutOfStock = computed(() => {
  // Se allow_backorder é true, não considera como out of stock
  if (props.product.stock?.allow_backorder) {
    return false
  }
  return stockQuantity.value !== undefined && stockQuantity.value <= 0
})

const stockClasses = computed(() => {
  if (stockQuantity.value === undefined) return ''
  
  // Se allow_backorder é true e estoque é negativo/zero, mostra badge especial
  if (props.product.stock?.allow_backorder && stockQuantity.value <= 0) {
    return 'product-card-stock backorder'
  }
  
  if (stockQuantity.value === 0) return 'product-card-stock out-of-stock'
  if (stockQuantity.value <= 5) return 'product-card-stock low-stock'
  return 'product-card-stock'
})

const categoryName = computed(() => {
  const categories = {
    bebida: 'Bebida',
    salgado: 'Salgado',
    doce: 'Doce',
    lanche: 'Lanche',
    fruta: 'Fruta',
    outros: 'Outros'
  }
  return categories[props.product.category as keyof typeof categories] || props.product.category
})

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.product)
  }
}
</script>

<style lang="scss" scoped>
.product-card {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--white);

  &:hover {
    border-color: var(--primary-light);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.product-card-out-of-stock {
  opacity: 0.6;
  cursor: not-allowed;

  &:hover {
    transform: none;
    box-shadow: none;
  }
}

.product-card-category {
  font-size: var(--font-size-xs);
  color: var(--gray-600);
  text-transform: uppercase;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
}

.product-card-name {
  font-weight: 500;
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--gray-800);
}

.product-card-price {
  color: var(--primary);
  font-weight: bold;
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-2);
}

.product-card-stock {
  font-size: var(--font-size-xs);
  color: var(--gray-600);
  margin-top: var(--spacing-2);

  &.low-stock {
    color: var(--warning);
    font-weight: 500;
  }

  &.out-of-stock {
    color: var(--danger);
    font-weight: 500;
  }

  &.backorder {
    color: var(--info, #17a2b8);
    font-weight: 500;
  }

  .backorder-badge {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(23, 162, 184, 0.1);
    color: var(--info, #17a2b8);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-xs);
  }
}
</style>
