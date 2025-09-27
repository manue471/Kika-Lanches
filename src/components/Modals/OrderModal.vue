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
            v-for="(item, index) in form.items" 
            :key="index"
            class="product-item"
          >
            <div class="product-select">
              <BaseSelect
                v-model="item.product_id"
                :options="productOptions"
                placeholder="Selecione um produto"
                @change="updateProductPrice(index)"
              />
            </div>
            <div class="quantity-input">
              <BaseInput
                v-model.number="item.quantity"
                type="number"
                min="1"
                placeholder="Qtd"
                @input="calculateItemTotal(index)"
              />
            </div>
            <div class="price-display">
              {{ formatCurrency(item.price * item.quantity) }}
            </div>
            <BaseButton
              type="button"
              variant="danger"
              size="sm"
              @click="removeProduct(index)"
              v-if="form.items.length > 1"
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
            <label for="shipping_amount" class="form-label">Taxa de Entrega</label>
            <BaseInput
              id="shipping_amount"
              v-model.number="form.shipping_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          
          <div class="form-group">
            <label for="tax_amount" class="form-label">Taxa de Serviço</label>
            <BaseInput
              id="tax_amount"
              v-model.number="form.tax_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOrders } from '@/composables/useOrders'
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'
import { useFormatter } from '@/composables/useUtils'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseButton from '@/components/Base/Button.vue'
import type { Order, CreateOrderRequest, UpdateOrderRequest, OrderItem } from '@/types/api'

interface Props {
  show: boolean
  order?: Order | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': [order: Order]
}>()

const { createOrder, updateOrder, isCreating, isUpdating } = useOrders()
const { products } = useProducts()
const { customers } = useCustomers()
const { currency } = useFormatter()

// Form state
const form = ref<CreateOrderRequest & UpdateOrderRequest>({
  customer_id: 0,
  items: [
    { product_id: 0, quantity: 1, price: 0 }
  ],
  status: 'pending',
  shipping_amount: 0,
  tax_amount: 0,
  notes: ''
})

const errors = ref<Record<string, string>>({})
const isSubmitting = computed(() => isCreating.value || isUpdating.value)
const isEditing = computed(() => !!props.order)

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

const subtotal = computed(() => {
  return form.value.items.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
})

const total = computed(() => {
  return subtotal.value + (form.value.shipping_amount || 0) + (form.value.tax_amount || 0)
})

const resetForm = () => {
  form.value = {
    customer_id: 0,
    items: [
      { product_id: 0, quantity: 1, price: 0 }
    ],
    status: 'pending',
    shipping_amount: 0,
    tax_amount: 0,
    notes: ''
  }
  errors.value = {}
}

// Watch for order changes
watch(() => props.order, (order) => {
  if (order) {
    form.value = {
      customer_id: order.customer_id,
      items: order.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      status: order.status,
      shipping_amount: order.shipping_amount || 0,
      tax_amount: order.tax_amount || 0,
      notes: order.notes || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal show/hide
watch(() => props.show, (show) => {
  if (!show) {
    resetForm()
  }
})

const addProduct = () => {
  form.value.items.push({
    product_id: 0,
    quantity: 1,
    price: 0
  })
}

const removeProduct = (index: number) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

const updateProductPrice = (index: number) => {
  const productId = form.value.items[index].product_id
  const product = products.value.find(p => p.id === productId)
  if (product) {
    form.value.items[index].price = product.price
  }
}

const calculateItemTotal = (index: number) => {
  // This will trigger the computed property to recalculate
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.customer_id) {
    errors.value.customer_id = 'Cliente é obrigatório'
  }

  if (form.value.items.length === 0) {
    errors.value.items = 'Pelo menos um produto é obrigatório'
  }

  form.value.items.forEach((item, index) => {
    if (!item.product_id) {
      errors.value[`items.${index}.product_id`] = 'Produto é obrigatório'
    }
    if (!item.quantity || item.quantity < 1) {
      errors.value[`items.${index}.quantity`] = 'Quantidade deve ser maior que 0'
    }
  })

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    let result: Order | null = null

    if (isEditing.value && props.order) {
      result = await updateOrder(props.order.id, form.value)
    } else {
      result = await createOrder(form.value)
    }

    if (result) {
      emit('success', result)
      emit('update:show', false)
    }
  } catch (error) {
    console.error('Error submitting form:', error)
  }
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
    align-items: center;
    padding: var(--spacing-3);
    background: var(--gray-50);
    border-radius: var(--radius-md);
  }

  .product-select {
    min-width: 200px;
  }

  .quantity-input {
    width: 80px;
  }

  .price-display {
    font-weight: 600;
    color: var(--primary-dark);
    min-width: 100px;
    text-align: right;
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
</style>
