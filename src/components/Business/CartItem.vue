<template>
  <div class="cart-item">
    <div class="cart-item-info">
      <div class="cart-item-name">{{ item.productName }}</div>
      <div class="cart-item-price">{{ formattedPrice }} cada</div>
    </div>
    <div class="cart-item-controls">
      <button 
        class="quantity-btn" 
        @click="$emit('updateQuantity', item.productId, -1)"
      >
        -
      </button>
      <span class="quantity-display">{{ item.quantity }}</span>
      <button 
        class="quantity-btn" 
        @click="$emit('updateQuantity', item.productId, 1)"
      >
        +
      </button>
      <button 
        class="btn-remove" 
        @click="$emit('remove', item.productId)"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatter } from '@/composables/useUtils'

interface CartItem {
  productId: number
  productName: string
  price: number
  quantity: number
}

interface Props {
  item: CartItem
}

const props = defineProps<Props>()

defineEmits<{
  updateQuantity: [productId: number, change: number]
  remove: [productId: number]
}>()

const { currency } = useFormatter()

const formattedPrice = computed(() => currency(props.item.price))
</script>

<style lang="scss" scoped>
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-2);
  background: var(--gray-50);
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-weight: 500;
  margin-bottom: var(--spacing-1);
  color: var(--gray-800);
}

.cart-item-price {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.quantity-btn {
  background: var(--primary);
  color: var(--white);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--primary-dark);
  }
}

.quantity-display {
  min-width: 30px;
  text-align: center;
  font-weight: 500;
  color: var(--gray-700);
}

.btn-remove {
  background: var(--danger);
  color: var(--white);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);

  &:hover {
    background: #c82333;
  }
}
</style>
