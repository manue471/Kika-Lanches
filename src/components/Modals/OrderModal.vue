<template>
  <BaseModal
    :show="show"
    :title="isEditing ? 'Editar Pedido' : 'Novo Pedido'"
    size="lg"
    @update:show="$emit('update:show', $event)"
  >
    <form @submit.prevent="handleSubmit" class="order-form">
      <!-- Customer Selection -->
      <div class="form-section">
        <h3 class="section-title">Cliente</h3>
        <div class="form-group">
          <label for="customer" class="form-label">Selecionar Cliente *</label>
          <BaseSelect
            id="customer"
            v-model="form.customer_id"
            :options="customerOptions"
            placeholder="Selecione um cliente"
            :error="errors.customer_id"
            required
          />
        </div>
      </div>

      <!-- Products Selection -->
      <div class="form-section">
        <h3 class="section-title">Produtos</h3>
        <div class="products-list">
          <div 
            v-for="(item, index) in form.products" 
            :key="index"
            class="product-item"
          >
            <div class="product-select">
              <BaseSelect
                v-model="item.product_id"
                :options="productOptions"
                placeholder="Selecione um produto"
                @update:modelValue="updateProductPrice(index)"
              />
            </div>
            <div class="quantity-input">
              <BaseInput
                v-model.number="item.quantity"
                type="number"
                :min="1"
                :max="getMaxQuantity(item.product_id)"
                placeholder="Qtd"
                @input="calculateItemTotal()"
                :error="getStockError(item.product_id, item.quantity)"
              />
              <div v-if="getStockInfo(item.product_id)" class="stock-info">
                <span class="stock-label">Estoque:</span>
                <span 
                  class="stock-quantity"
                  :class="getStockClass(item.product_id)"
                >
                  {{ getStockInfo(item.product_id)?.quantity || 0 }}
                </span>
              </div>
            </div>
            <div class="price-display">
              <div class="unit-price">{{ formatCurrency(getProductPrice(item.product_id)) }} cada</div>
              <div class="total-price">{{ formatCurrency(getProductPrice(item.product_id) * item.quantity) }}</div>
            </div>
            <BaseButton
              type="button"
              variant="danger"
              size="sm"
              @click="removeProduct(index)"
              v-if="form.products.length > 1"
            >
              ✕
            </BaseButton>
          </div>
          
          <BaseButton
            type="button"
            variant="secondary"
            @click="addProduct"
            class="add-product-btn"
          >
            + Adicionar Produto
          </BaseButton>
        </div>
      </div>

      <!-- Order Details -->
      <div class="form-section">
        <h3 class="section-title">Detalhes do Pedido</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="status" class="form-label">Status</label>
            <BaseSelect
              id="status"
              v-model="form.status"
              :options="statusOptions"
            />
          </div>
          
          <div class="form-group">
            <label for="payment_method" class="form-label">Método de Pagamento</label>
            <BaseSelect
              id="payment_method"
              v-model="form.payment_method"
              :options="paymentMethodOptions"
              placeholder="Selecione o método de pagamento"
              :error="errors.payment_method"
              required
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="notes" class="form-label">Observações</label>
          <textarea
            id="notes"
            v-model="form.notes"
            class="form-textarea"
            placeholder="Ex: Sem cebola, entrega rápida, etc."
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-summary">
        <div class="summary-item">
          <span class="summary-label">Subtotal:</span>
          <span class="summary-value">{{ formatCurrency(subtotal) }}</span>
        </div>
        <div class="summary-item" v-if="form.shipping_amount > 0">
          <span class="summary-label">Taxa de Entrega:</span>
          <span class="summary-value">{{ formatCurrency(form.shipping_amount) }}</span>
        </div>
        <div class="summary-item" v-if="form.tax_amount > 0">
          <span class="summary-label">Taxa de Serviço:</span>
          <span class="summary-value">{{ formatCurrency(form.tax_amount) }}</span>
        </div>
        <div class="summary-item total">
          <span class="summary-label">Total:</span>
          <span class="summary-value">{{ formatCurrency(total) }}</span>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="modal-actions">
        <BaseButton
          type="button"
          variant="secondary"
          @click="$emit('update:show', false)"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Atualizar' : 'Criar' }} Pedido
        </BaseButton>
      </div>
    </template>
  </BaseModal>

  <!-- Stock Confirmation Modal -->
  <ConfirmModal
    v-if="stockConfirmData"
    v-model:show="showStockConfirm"
    title="⚠️ Produto sem estoque"
    :description="`O produto ${stockConfirmData?.productName} não possui estoque suficiente para a quantidade solicitada.`"
    icon="⚠️"
    confirm-text="Confirmar mesmo assim"
    cancel-text="Cancelar"
    confirm-variant="warning"
    @confirm="handleStockConfirm"
    @cancel="handleStockCancel"
  >
    <template #content>
      <div class="stock-confirm-details">
        <div class="stock-item">
          <strong>Produto:</strong> {{ stockConfirmData?.productName }}
        </div>
        <div class="stock-item">
          <strong>Quantidade solicitada:</strong> {{ stockConfirmData?.requestedQuantity }} unidades
        </div>
        <div class="stock-item">
          <strong>Estoque disponível:</strong> {{ stockConfirmData?.availableStock }} unidades
        </div>
        <div class="stock-item">
          <strong>Diferença:</strong> {{ (stockConfirmData?.requestedQuantity || 0) - (stockConfirmData?.availableStock || 0) }} unidades em falta
        </div>
      </div>
    </template>
  </ConfirmModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOrders } from '@/composables/useOrders'
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'
import { useFormatter } from '@/composables/useUtils'
import { useNotifications } from '@/composables/useNotifications'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseButton from '@/components/Base/Button.vue'
import ConfirmModal from '@/components/Base/ConfirmModal.vue'
import type { Order } from '@/types/api'

interface Props {
  show: boolean
  orderId?: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': [order: Order]
}>()

const { createOrder, updateOrder, getOrderById, isCreating, isUpdating, refresh } = useOrders()
const { products, loadProducts } = useProducts()
const { customers, loadCustomers } = useCustomers()
const { currency } = useFormatter()
const { showNotification } = useNotifications()

// Form state
const form = ref({
  customer_id: 0,
  products: [
    { product_id: 0, quantity: 1 }
  ],
  status: 'pending' as Order['status'],
  payment_method: 'pix' as 'cartao_credito' | 'pix' | 'dinheiro' | 'a_prazo',
  shipping_amount: 0,
  tax_amount: 0,
  notes: ''
})

const errors = ref<Record<string, string>>({})
const isSubmitting = computed(() => isCreating.value || isUpdating.value)
const isEditing = computed(() => !!props.orderId)

// Store original order data to detect changes
const originalOrder = ref<Order | null>(null)

// Stock confirmation modal
const showStockConfirm = ref(false)
const stockConfirmData = ref<{
  productName: string
  requestedQuantity: number
  availableStock: number
  allowBackorder: boolean
} | null>(null)

// Ensure modal starts closed
console.log('Initial stock confirm state:', showStockConfirm.value)

// Computed
const formatCurrency = currency

const customerOptions = computed(() => 
  customers.value.map(customer => ({
    value: customer.id,
    label: customer.name
  }))
)

const productOptions = computed(() => 
  products.value.map(product => ({
    value: product.id,
    label: `${product.name} - ${formatCurrency(product.price)}`
  }))
)

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Processando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
]

const paymentMethodOptions = [
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'a_prazo', label: 'À Prazo' }
]

// Stock validation methods
const getStockInfo = (productId: number) => {
  const product = products.value.find(p => p.id === productId)
  return product?.stock
}

const getMaxQuantity = (productId: number): number => {
  const stock = getStockInfo(productId)
  if (!stock) return 999
  
  // If backorder is allowed, no max limit
  if (stock.allow_backorder) return 999
  
  // Otherwise, limit to available stock
  return stock.quantity
}

const getStockError = (productId: number, quantity: number): string => {
  const stock = getStockInfo(productId)
  if (!stock) return ''
  
  // If backorder is allowed, no error
  if (stock.allow_backorder) return ''
  
  // Check if quantity exceeds available stock
  if (quantity > stock.quantity) {
    return `Estoque insuficiente. Disponível: ${stock.quantity} unidades`
  }
  
  return ''
}

const getStockClass = (productId: number): string => {
  const stock = getStockInfo(productId)
  if (!stock) return ''
  
  if (stock.quantity === 0) return 'stock-empty'
  if (stock.quantity <= stock.min_stock_level) return 'stock-low'
  return 'stock-ok'
}

const subtotal = computed(() => {
  const subtotalValue = form.value.products.reduce((total, item) => {
    const product = products.value.find(p => p.id === Number(item.product_id))
    const price = product ? Number(product.price) : 0
    const quantity = Number(item.quantity) || 0
    const itemTotal = price * quantity
    
    console.log('Subtotal item calculation:', {
      productId: item.product_id,
      product: product?.name,
      price: price,
      quantity: quantity,
      itemTotal: itemTotal
    })
    
    return total + itemTotal
  }, 0)
  
  console.log('Subtotal calculation result:', subtotalValue)
  return subtotalValue
})

const total = computed(() => {
  const subtotalValue = subtotal.value
  const shippingValue = Number(form.value.shipping_amount) || 0
  const taxValue = Number(form.value.tax_amount) || 0
  const totalValue = subtotalValue + shippingValue + taxValue
  
  console.log('Total calculation:', {
    subtotal: subtotalValue,
    shipping: shippingValue,
    tax: taxValue,
    total: totalValue
  })
  
  return totalValue
})

// Watch for products loading to recalculate totals
watch(() => products.value, () => {
  console.log('Products updated, recalculating totals')
  console.log('Current subtotal:', subtotal.value)
  console.log('Current total:', total.value)
}, { deep: true })

// Helper function to get product price
const getProductPrice = (productId: number | string) => {
  const product = products.value.find(p => p.id === Number(productId))
  return product ? product.price : 0
}

const resetForm = () => {
  form.value = {
    customer_id: 0,
    products: [
      { product_id: 0, quantity: 1 }
    ],
    status: 'pending' as Order['status'],
    payment_method: 'pix' as 'cartao_credito' | 'pix' | 'dinheiro' | 'a_prazo',
    shipping_amount: 0,
    tax_amount: 0,
    notes: ''
  }
  errors.value = {}
}

// Watch for order ID changes
watch(() => props.orderId, async (orderId) => {
  console.log('OrderModal received orderId:', orderId)
  if (orderId) {
    try {
      console.log('Fetching order by ID:', orderId)
      const order = await getOrderById(orderId)
      console.log('Order fetched:', order)
      console.log('Order products:', (order as any).order_products)
      
      // Store original order for comparison
      originalOrder.value = order
      
      form.value = {
        customer_id: order.customer_id,
        products: (order as any).order_products?.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity
        })) || [{ product_id: 0, quantity: 1 }],
        status: order.status,
        payment_method: order.payment_method,
        shipping_amount: order.shipping_amount || 0,
        tax_amount: order.tax_amount || 0,
        notes: order.notes || ''
      }
      console.log('Form updated for editing:', form.value)
    } catch (error) {
      console.error('Error fetching order:', error)
      resetForm()
    }
  } else {
    resetForm()
    originalOrder.value = null
  }
}, { immediate: true })

// Watch for modal show/hide
watch(() => props.show, async (show) => {
  if (show) {
    // Load customers and products when modal opens
    await Promise.all([
      loadCustomers(),
      loadProducts()
    ])
    console.log('Products loaded for modal:', products.value.length)
  } else {
    resetForm()
  }
})

const addProduct = () => {
  form.value.products.push({
    product_id: 0,
    quantity: 1
  })
}

const removeProduct = (index: number) => {
  if (form.value.products.length > 1) {
    form.value.products.splice(index, 1)
  }
}

const updateProductPrice = (index: number) => {
  const productId = form.value.products[index].product_id
  const productIdNum = Number(productId)
  const product = products.value.find(p => p.id === productIdNum)
  
  if (product) {
    console.log('Product selected:', { productId, productIdNum, product, index })
    
    // Check stock availability
    const stock = product.stock
    if (stock) {
      // const requestedQuantity = form.value.products[index].quantity || 1
      
      // If no stock and backorder not allowed, show warning
      if (stock.quantity === 0 && !stock.allow_backorder) {
        showNotification(
          `⚠️ ${product.name} está sem estoque e não permite pedidos sem estoque`,
          'warning'
        )
        // Reset quantity to 0
        form.value.products[index].quantity = 0
      }
      // If low stock, show info
      else if (stock.quantity > 0 && stock.quantity <= stock.min_stock_level) {
        showNotification(
          `⚠️ ${product.name} tem estoque baixo (${stock.quantity} unidades)`,
          'info'
        )
      }
    }
  }
}

const calculateItemTotal = () => {
  // No need to force reactivity - Vue will handle it automatically
  // The computed properties will update when the data changes
}

// Check for stock issues before submitting
const checkStockIssues = () => {
  const issues: Array<{
    productName: string
    requestedQuantity: number
    availableStock: number
    allowBackorder: boolean
  }> = []
  
  form.value.products.forEach(item => {
    // Only check if product is selected and quantity is greater than 0
    if (item.product_id && item.product_id > 0 && item.quantity > 0) {
      const product = products.value.find(p => p.id === Number(item.product_id))
      if (product?.stock) {
        const stock = product.stock
        // Only add to issues if quantity exceeds available stock AND backorder is not allowed
        if (item.quantity > stock.quantity && !stock.allow_backorder) {
          issues.push({
            productName: product.name,
            requestedQuantity: item.quantity,
            availableStock: stock.quantity,
            allowBackorder: stock.allow_backorder
          })
        }
      }
    }
  })
  
  console.log('Stock check - Issues found:', issues.length, issues)
  return issues
}

// Watch for products loading - no need to update prices since we calculate them dynamically
watch(() => products.value, (newProducts) => {
  console.log('Products loaded:', newProducts.length)
}, { deep: true })

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.customer_id) {
    errors.value.customer_id = 'Cliente é obrigatório'
  }

  if (!form.value.payment_method) {
    errors.value.payment_method = 'Método de pagamento é obrigatório'
  }

  if (form.value.products.length === 0) {
    errors.value.products = 'Pelo menos um produto é obrigatório'
  }

  form.value.products.forEach((item, index) => {
    if (!item.product_id) {
      errors.value[`products.${index}.product_id`] = 'Produto é obrigatório'
    }
    if (!item.quantity || item.quantity < 1) {
      errors.value[`products.${index}.quantity`] = 'Quantidade deve ser maior que 0'
    }
  })

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  // Check for stock issues
  const stockIssues = checkStockIssues()
  if (stockIssues.length > 0) {
    // Show confirmation modal for stock issues
    console.log('Stock issues found:', stockIssues)
    stockConfirmData.value = stockIssues[0] // Show first issue
    showStockConfirm.value = true
    console.log('Stock confirm modal should show:', showStockConfirm.value)
    return
  }
  
  // Clear any previous stock confirmation data
  stockConfirmData.value = null
  showStockConfirm.value = false
  
  // If no stock issues, proceed with normal submission
  console.log('No stock issues found, proceeding with order creation')

  await submitOrder()
}

const prepareUpdateData = () => {
  if (!originalOrder.value) return form.value
  
  console.log('Preparing update data...')
  console.log('Original order status:', originalOrder.value.status)
  console.log('Form status:', form.value.status)
  console.log('Status comparison:', form.value.status !== originalOrder.value.status)
  
  const updateData: any = {
    customer_id: form.value.customer_id,
    products: form.value.products,
    payment_method: form.value.payment_method,
    shipping_amount: form.value.shipping_amount,
    tax_amount: form.value.tax_amount,
    notes: form.value.notes
  }
  
  // Only include status if it changed
  if (form.value.status !== originalOrder.value.status) {
    updateData.status = form.value.status
    console.log('✅ Status changed from', originalOrder.value.status, 'to', form.value.status)
    console.log('✅ Status will be included in update')
  } else {
    console.log('❌ Status unchanged, not sending status field')
  }
  
  console.log('Final update data:', updateData)
  return updateData
}

const submitOrder = async () => {
  try {
    let result: Order | null = null

    if (isEditing.value && props.orderId) {
      const updateData = prepareUpdateData()
      console.log('🚀 Sending update data to API:', updateData)
      console.log('🚀 Order ID:', props.orderId)
      
      result = await updateOrder(props.orderId, updateData)
      console.log('✅ Update successful, result:', result)
    } else {
      console.log('🚀 Creating new order:', form.value)
      result = await createOrder(form.value)
      console.log('✅ Create successful, result:', result)
    }

    if (result) {
      // Refresh the orders list after successful save
      console.log('🔄 Refreshing orders list after save')
      await refresh()
      
      emit('success', result)
      emit('update:show', false)
      console.log('✅ Modal closed and success emitted')
    }
  } catch (error) {
    console.error('❌ Error submitting form:', error)
  }
}

// Handle stock confirmation
const handleStockConfirm = async () => {
  showStockConfirm.value = false
  stockConfirmData.value = null
  await submitOrder()
}

const handleStockCancel = () => {
  showStockConfirm.value = false
  stockConfirmData.value = null
}
</script>

<style lang="scss" scoped>
.order-form {
  .form-section {
    margin-bottom: var(--spacing-6);
    
    .section-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--primary-dark);
      margin: 0 0 var(--spacing-4) 0;
      padding-bottom: var(--spacing-2);
      border-bottom: 2px solid var(--gray-200);
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .form-label {
    font-weight: 500;
    color: var(--gray-700);
    font-size: var(--font-size-sm);
  }

  .form-textarea {
    width: 100%;
    padding: var(--spacing-3);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-family: inherit;
    resize: vertical;
    transition: border-color var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--primary-light);
      box-shadow: 0 0 0 3px rgba(92, 219, 149, 0.1);
    }
  }

  .products-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .product-item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: var(--spacing-3);
    align-items: start;
    padding: var(--spacing-2);
    background: var(--gray-50);
    border-radius: var(--radius-md);
  }

  .product-select {
    min-width: 200px;
  }

  .quantity-input {
    width: 80px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stock-info {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: var(--spacing-1);
      font-size: var(--font-size-xs);
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--spacing-1);
      justify-content: center;
      flex-wrap: wrap;
      z-index: 1;
      
      .stock-label {
        color: var(--gray-600);
        font-weight: 500;
        white-space: nowrap;
        font-size: 0.7rem;
      }
      
      .stock-quantity {
        font-weight: 600;
        font-size: 0.7rem;
        
        &.stock-ok {
          color: var(--success);
        }
        
        &.stock-low {
          color: var(--warning);
        }
        
        &.stock-empty {
          color: var(--danger);
        }
      }
      
      .backorder-info {
        color: var(--info);
        font-style: italic;
        font-size: 0.65rem;
        white-space: nowrap;
      }
    }
  }

  .price-display {
    min-width: 120px;
    text-align: right;
    
    .unit-price {
      font-size: var(--font-size-sm);
      color: var(--gray-600);
      margin-bottom: var(--spacing-1);
    }
    
    .total-price {
      font-weight: 600;
      color: var(--primary-dark);
      font-size: var(--font-size-base);
    }
  }

  .add-product-btn {
    align-self: flex-start;
    margin-top: var(--spacing-2);
  }

  .order-summary {
    background: var(--gray-50);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    margin-top: var(--spacing-6);
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    
    &.total {
      border-top: 2px solid var(--gray-300);
      margin-top: var(--spacing-2);
      padding-top: var(--spacing-3);
      font-weight: 600;
      font-size: var(--font-size-lg);
    }
    
    .summary-label {
      color: var(--gray-600);
    }
    
    .summary-value {
      font-weight: 500;
      color: var(--primary-dark);
    }
  }
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

// Mobile optimizations
@media (max-width: 768px) {
  .order-form {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .product-item {
      grid-template-columns: 1fr;
      gap: var(--spacing-2);
    }
    
    .product-select,
    .quantity-input {
      width: 100%;
    }
    
    .price-display {
      text-align: left;
    }
  }

  .modal-actions {
    flex-direction: column;
    
    > * {
      width: 100%;
    }
  }
}

// Stock confirmation modal styles
.stock-confirm-details {
  .stock-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--gray-200);
    
    &:last-child {
      border-bottom: none;
    }
    
    strong {
      color: var(--gray-700);
      font-weight: 600;
    }
  }
}
</style>
