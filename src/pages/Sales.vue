<template>
  <div class="sales">
    <div class="sales-header">
      <h2>Nova Venda</h2>
      <div class="sales-actions">
        <BaseButton variant="secondary" @click="clearCart">Limpar Carrinho</BaseButton>
        <BaseButton 
          variant="primary" 
          :disabled="!canFinalize"
          @click="finalizeSale"
        >
          {{ canFinalize ? 'Finalizar Venda' : 'Selecione cliente e produtos' }}
        </BaseButton>
      </div>
    </div>

    <div class="sales-grid">
      <!-- Customer Selection -->
      <BaseCard title="Selecionar Cliente" class="customer-selection">
        <div class="customer-search">
          <BaseInput
            v-model="customerSearch"
            placeholder="Buscar cliente..."
            @input="filterCustomers"
          />
          <BaseButton variant="info" size="sm" @click="$emit('showModal', 'customer')">
            ➕
          </BaseButton>
        </div>
        
        <div class="customer-list">
          <div v-if="filteredCustomers.length === 0" class="no-data">
            Nenhum cliente cadastrado
          </div>
          <div
            v-for="customer in filteredCustomers"
            :key="customer.id"
            :class="['customer-item', { selected: selectedCustomer?.id === customer.id }]"
            @click="selectCustomer(customer)"
          >
            <div class="customer-item-name">{{ customer.name }}</div>
            <div class="customer-item-class">{{ customer.class || 'Sem turma' }}</div>
          </div>
        </div>

        <div v-if="selectedCustomer" class="selected-customer">
          <span class="customer-name">{{ selectedCustomer.name }}</span>
          <button class="btn-remove" @click="clearSelectedCustomer">✕</button>
        </div>
      </BaseCard>

      <!-- Product Selection -->
      <BaseCard title="Produtos Disponíveis" class="product-selection">
        <div class="product-filters">
          <BaseSelect
            v-model="selectedCategory"
            :options="categoryOptions"
            placeholder="Todas as categorias"
            @change="filterProducts"
          />
          <BaseInput
            v-model="productSearch"
            placeholder="Buscar produto..."
            @input="filterProducts"
          />
        </div>
        
        <div class="product-grid">
          <div v-if="filteredProducts.length === 0" class="no-data">
            Nenhum produto cadastrado
          </div>
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            @click="addToCart"
          />
        </div>
      </BaseCard>

      <!-- Cart Section -->
      <BaseCard title="Carrinho de Compras" class="cart-section">
        <div class="cart-items">
          <div v-if="cart.length === 0" class="empty-cart">
            Carrinho vazio
          </div>
          <CartItem
            v-for="item in cart"
            :key="item.productId"
            :item="item"
            @update-quantity="updateCartQuantity"
            @remove="removeFromCart"
          />
        </div>
        
        <div class="cart-total">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>{{ formattedCurrency(cartSubtotal) }}</span>
          </div>
          <div class="total-line total-final">
            <span>Total:</span>
            <span>{{ formattedCurrency(cartTotal) }}</span>
          </div>
        </div>
      </BaseCard>
    </div>
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
import ProductCard from '@/components/Business/ProductCard.vue'
import CartItem from '@/components/Business/CartItem.vue'

const emit = defineEmits<{
  showModal: [type: string]
}>()

const { currency } = useFormatter()
const { showNotification } = useNotifications()
const appData = useAppData()

// Reactive data
const customerSearch = ref('')
const productSearch = ref('')
const selectedCategory = ref('')
const selectedCustomer = ref<any>(null)
const cart = ref<any[]>([])

// Computed properties
const formattedCurrency = currency

const canFinalize = computed(() => {
  return selectedCustomer.value && cart.value.length > 0
})

const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const cartTotal = computed(() => {
  return cartSubtotal.value
})

const filteredCustomers = computed(() => {
  let customers = appData.value.customers
  
  if (customerSearch.value) {
    const search = customerSearch.value.toLowerCase()
    customers = customers.filter(customer => 
      customer.name.toLowerCase().includes(search)
    )
  }
  
  return customers
})

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

const selectCustomer = (customer: any) => {
  selectedCustomer.value = customer
}

const clearSelectedCustomer = () => {
  selectedCustomer.value = null
}

const addToCart = (product: any) => {
  // Check stock
  if (product.stock !== undefined && product.stock <= 0) {
    showNotification('Produto fora de estoque', 'warning')
    return
  }

  const existingItem = cart.value.find(item => item.productId === product.id)
  
  if (existingItem) {
    // Check stock limit
    if (product.stock !== undefined && existingItem.quantity >= product.stock) {
      showNotification('Quantidade máxima em estoque atingida', 'warning')
      return
    }
    existingItem.quantity++
  } else {
    cart.value.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1
    })
  }

  showNotification(`${product.name} adicionado ao carrinho`, 'success')
}

const updateCartQuantity = (productId: number, change: number) => {
  const item = cart.value.find(item => item.productId === productId)
  if (!item) return

  const product = appData.value.products.find(p => p.id === productId)
  const newQuantity = item.quantity + change

  if (newQuantity <= 0) {
    removeFromCart(productId)
    return
  }

  // Check stock
  if (product && product.stock !== undefined && newQuantity > product.stock) {
    showNotification('Quantidade máxima em estoque atingida', 'warning')
    return
  }

  item.quantity = newQuantity
}

const removeFromCart = (productId: number) => {
  cart.value = cart.value.filter(item => item.productId !== productId)
}

const clearCart = () => {
  cart.value = []
  showNotification('Carrinho limpo', 'success')
}

const finalizeSale = () => {
  if (!selectedCustomer.value || cart.value.length === 0) {
    showNotification('Selecione um cliente e adicione produtos', 'warning')
    return
  }

  // Check stock availability
  for (const item of cart.value) {
    const product = appData.value.products.find(p => p.id === item.productId)
    if (product && product.stock !== undefined && product.stock < item.quantity) {
      showNotification(`Estoque insuficiente para ${product.name}`, 'error')
      return
    }
  }

  // Create sale
  const sale = {
    id: Date.now(),
    customerId: selectedCustomer.value.id,
    customerName: selectedCustomer.value.name,
    items: [...cart.value],
    total: cartTotal.value,
    date: new Date().toLocaleDateString('pt-BR'),
    timestamp: Date.now()
  }

  // Update stock
  cart.value.forEach(item => {
    const product = appData.value.products.find(p => p.id === item.productId)
    if (product && product.stock !== undefined) {
      product.stock -= item.quantity
    }
  })

  // Save sale
  appData.value.sales.push(sale)

  // Clear cart and selection
  cart.value = []
  selectedCustomer.value = null
  customerSearch.value = ''
  productSearch.value = ''
  selectedCategory.value = ''

  showNotification(`Venda finalizada! Total: ${formattedCurrency(sale.total)}`, 'success')
}
</script>

<style lang="scss" scoped>
.sales-header {
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

.sales-actions {
  display: flex;
  gap: var(--spacing-3);
}

.sales-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-6);
}

.customer-selection,
.product-selection,
.cart-section {
  height: fit-content;
}

.customer-search {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.customer-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: var(--spacing-4);
}

.customer-item {
  padding: var(--spacing-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-2);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--gray-100);
    border-color: var(--primary-light);
  }

  &.selected {
    background: var(--primary-light);
    color: var(--white);
    border-color: var(--primary-light);
  }
}

.customer-item-name {
  font-weight: 500;
  margin-bottom: var(--spacing-1);
}

.customer-item-class {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.customer-item.selected .customer-item-class {
  color: rgba(255, 255, 255, 0.8);
}

.selected-customer {
  background: var(--primary-light);
  color: var(--white);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.product-filters {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  flex-wrap: wrap;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-3);
  max-height: 400px;
  overflow-y: auto;
}

.cart-items {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: var(--spacing-4);
}

.cart-total {
  border-top: 2px solid var(--gray-200);
  padding-top: var(--spacing-4);
}

.total-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.total-final {
  font-size: var(--font-size-lg);
  font-weight: bold;
  color: var(--primary-dark);
  border-top: 1px solid var(--gray-300);
  padding-top: var(--spacing-2);
}

.empty-cart {
  text-align: center;
  color: var(--gray-500);
  font-style: italic;
  padding: var(--spacing-4);
}

@media (max-width: 1024px) {
  .sales-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
}

@media (max-width: 768px) {
  .sales-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .sales-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .product-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
