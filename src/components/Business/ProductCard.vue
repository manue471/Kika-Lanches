<template>
  <div 
    :class="['product-card', { 'product-card-out-of-stock': isOutOfStock }]"
    @click="handleClick"
  >
    <div class="product-card-category">{{ categoryName }}</div>
    <div class="product-card-name">{{ product.name }}</div>
    <div class="product-card-price">{{ formattedPrice }}</div>
    <div v-if="showStock && product.stock_quantity !== undefined" :class="stockClasses">
      Estoque: {{ product.stock_quantity }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatter } from '@/composables/useUtils'

interface Product {
  id: number
  name: string
  price: number
  category: string
  stock_quantity?: number
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

const isOutOfStock = computed(() => {
  return props.product.stock_quantity !== undefined && props.product.stock_quantity <= 0
})

const stockClasses = computed(() => {
  if (!props.product.stock_quantity) return ''
  
  if (props.product.stock_quantity === 0) return 'product-card-stock out-of-stock'
  if (props.product.stock_quantity <= 5) return 'product-card-stock low-stock'
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
  color: var(--primary-medium);
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
}
</style>
