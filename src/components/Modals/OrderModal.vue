<template>
  <BaseModal
    :show="show"
    :title="isEditing ? 'Editar Pedido' : 'Novo Pedido'"
    size="lg"
    @update:show="$emit('update:show', $event)"
  >
    <!-- Loading overlay quando está carregando pedido para edição -->
    <div v-if="isLoadingOrder && isEditing" class="loading-overlay">
      <BaseLoading :show="true" message="Carregando pedido..." variant="inline" />
    </div>
    
    <form @submit.prevent="handleSubmit" class="order-form" :class="{ 'is-loading': isLoadingOrder && isEditing }">
      <!-- Customer Selection -->
      <div class="form-section">
        <h3 class="section-title">Cliente</h3>
        <div class="form-group">
          <label for="customer" class="form-label">Selecionar Cliente *</label>
          <AutoComplete
            id="customer"
            v-model="selectedCustomer"
            :options="getCustomerOptions()"
            :search-term="customerSearchTerm"
            :is-loading="isCustomerSearching"
            placeholder="Digite o nome do cliente..."
            label-key="name"
            value-key="id"
            secondary-key="email"
            :min-search-length="1"
            :debounce-ms="500"
            :show-initial-suggestions="true"
            :filter-locally="true"
            :initial-suggestions-limit="20"
            @search="handleCustomerSearch"
            @select="handleCustomerSelect"
            @clear="handleCustomerClear"
            :error="errors.customer_id"
            class="customer-autocomplete"
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
              <AutoComplete
                :id="`product-${index}`"
                :model-value="getProductForItem(item.product_id)"
                :options="getProductOptions(index)"
                :search-term="getProductSearchTerm(index)"
                :is-loading="isProductSearching(index)"
                placeholder="Digite o nome do produto..."
                label-key="name"
                value-key="id"
                secondary-key="formatted_price"
                :min-search-length="1"
                :debounce-ms="500"
                :show-initial-suggestions="true"
                :filter-locally="true"
                :initial-suggestions-limit="20"
                @search="(term) => searchProductsForIndex(index, term)"
                @select="(product) => handleProductSelect(index, product)"
                @clear="() => handleProductClear(index)"
                :error="errors[`products.${index}.product_id`]"
                class="product-autocomplete"
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
              <div class="stock-info">
                <span class="stock-label">Estoque:</span>
                <span 
                  class="stock-quantity"
                  :class="getStockClass(item.product_id)"
                >
                  {{ getStockQuantity(item.product_id) }}
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
            <label for="payment_method" class="form-label">Método de Pagamento Principal</label>
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

        <!-- Partial Payment Section -->
        <div class="form-section" v-if="enablePartialPayment">
          <h3 class="section-title">Pagamento Parcial</h3>
          <div class="partial-payment-info">
            <p class="info-text">
              Você pode registrar um pagamento parcial. O valor restante será adicionado ao débito do cliente.
            </p>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="paid_amount" class="form-label">Valor Pago (R$)</label>
              <BaseInput
                id="paid_amount"
                v-model="paidAmountInput"
                type="text"
                placeholder="0.00"
                :error="errors.paid_amount"
                @blur="handlePaidAmountBlur"
              />
              <small class="form-hint">Valor pago à vista neste pedido</small>
            </div>
            <div class="form-group">
              <label for="debt_amount" class="form-label">Valor à Prazo (R$)</label>
              <BaseInput
                id="debt_amount"
                v-model.number="form.debt_amount"
                type="number"
                :min="0"
                :readonly="true"
                placeholder="0.00"
                step="0.01"
                class="readonly-input"
              />
              <small class="form-hint">Valor que será adicionado ao débito</small>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Métodos de Pagamento Utilizados</label>
            <div class="payment-methods-checkboxes">
              <label v-for="method in paymentMethodOptions" :key="method.value" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="method.value"
                  v-model="form.payment_methods"
                  class="checkbox-input"
                />
                <span>{{ method.label }}</span>
              </label>
            </div>
            <small class="form-hint">Selecione todos os métodos de pagamento utilizados neste pedido</small>
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
        <div class="summary-item" v-if="form.paid_amount && form.paid_amount > 0">
          <span class="summary-label">Valor Pago:</span>
          <span class="summary-value paid">{{ formatCurrency(form.paid_amount) }}</span>
        </div>
        <div class="summary-item" v-if="calculatedDebtAmount > 0">
          <span class="summary-label">Valor à Prazo:</span>
          <span class="summary-value debt">{{ formatCurrency(calculatedDebtAmount) }}</span>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="modal-actions">
        <div class="modal-actions-left">
          <BaseButton
            v-if="isEditing && props.orderId"
            variant="info"
            @click="showTicketForOrder"
            :loading="isOpeningTicket"
            :disabled="isOpeningTicket"
          >
            <span class="print-icon">🖨️</span>
            Imprimir Ticket
          </BaseButton>
        </div>
        
        <div class="modal-actions-right">
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

  <!-- Ticket Modal -->
  <TicketModal
    :show="showTicketModal"
    :order-id="createdOrderId"
    @update:show="handleTicketClose"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOrders } from '@/composables/useOrders'
import { useProducts } from '@/composables/useProducts'
import { useCustomers } from '@/composables/useCustomers'
import { useCustomerSearch } from '@/composables/useCustomerSearch'
import { useFormatter } from '@/composables/useUtils'
import { useNotifications } from '@/composables/useNotifications'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import AutoComplete from '@/components/Base/AutoComplete.vue'
import ConfirmModal from '@/components/Base/ConfirmModal.vue'
import TicketModal from './TicketModal.vue'
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

const { createOrder, updateOrder, getOrderById, isCreating, isUpdating, isLoading: isLoadingOrder, refresh } = useOrders()
const { products, loadProducts } = useProducts()
const { customers, loadCustomers } = useCustomers()
const { 
  searchTerm: customerSearchTerm,
  selectedCustomer,
  isSearching: isCustomerSearching,
  searchResults: customerSearchResults,
  searchCustomers: searchCustomersAPI,
  selectCustomer,
  clearSelection: clearCustomerSelection
} = useCustomerSearch()
const { currency } = useFormatter()
const { showNotification } = useNotifications()

// Form state
const form = ref({
  customer_id: 0,
  products: [
    { product_id: 0, quantity: 1 }
  ],
  status: 'confirmed' as Order['status'],
  payment_method: 'pix' as 'cartao_credito' | 'pix' | 'dinheiro' | 'a_prazo',
  paid_amount: undefined as number | undefined,
  debt_amount: undefined as number | undefined,
  payment_methods: [] as string[],
  shipping_amount: 0,
  tax_amount: 0,
  notes: ''
})

const errors = ref<Record<string, string>>({})
const isSubmitting = computed(() => isCreating.value || isUpdating.value)
const isEditing = computed(() => !!props.orderId)

// Input temporário para paid_amount (permite digitação livre)
const paidAmountInput = ref<string>('')

// Função para formatar número para string de exibição
const formatNumberInput = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return ''
  return value.toString()
}

// Função para converter string para número
const parseNumberInput = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? undefined : parsed
}

// Helper function to round monetary values to 2 decimal places (definido antes para uso em handlePaidAmountBlur)
const roundCurrency = (value: number): number => {
  if (isNaN(value) || !isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

// Handler para quando o campo perde o foco
const handlePaidAmountBlur = () => {
  const parsed = parseNumberInput(paidAmountInput.value)
  if (parsed !== undefined) {
    const totalValue = total.value
    if (parsed > totalValue) {
      form.value.paid_amount = roundCurrency(totalValue)
      paidAmountInput.value = formatNumberInput(totalValue)
    } else if (parsed < 0) {
      form.value.paid_amount = 0
      paidAmountInput.value = '0'
    } else {
      form.value.paid_amount = roundCurrency(parsed)
      paidAmountInput.value = formatNumberInput(roundCurrency(parsed))
    }
  } else {
    form.value.paid_amount = undefined
    paidAmountInput.value = ''
  }
}

// Sincronizar paidAmountInput com form.paid_amount
watch(() => form.value.paid_amount, (newValue) => {
  paidAmountInput.value = formatNumberInput(newValue)
}, { immediate: true })

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

// Ticket modal
const showTicketModal = ref(false)
const createdOrderId = ref<number | null>(null)
const isOpeningTicket = ref(false)

// Ensure modal starts closed
console.log('Initial stock confirm state:', showStockConfirm.value)

// Computed
const formatCurrency = currency

const statusOptions = [
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' }
]

const paymentMethodOptions = [
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'a_prazo', label: 'À Prazo' }
]

// Stock validation methods (moved before computed to avoid dependency issues)
const getStockInfo = (productId: number | string) => {
  if (!productId || productId === 0 || productId === '0') return null
  const productIdNum = Number(productId)
  if (isNaN(productIdNum)) return null
  
  // Find product by ID, ensuring type conversion
  const product = products.value.find(p => {
    const pId = typeof p.id === 'string' ? Number(p.id) : p.id
    return pId === productIdNum
  })
  
  return product?.stock || null
}

// Helper to get stock quantity - ensures we get the correct value from stock.quantity
const getStockQuantity = (productId: number | string): number => {
  if (!productId || productId === 0 || productId === '0') return 0
  
  const stock = getStockInfo(productId)
  if (!stock) {
    // Debug: log when stock is not found
    if (productId) {
      console.debug('Stock not found for product_id:', productId, 'Available products:', products.value.map(p => ({ id: p.id, name: p.name })))
    }
    return 0
  }
  
  // Handle both number and string quantities from API
  let quantity = stock.quantity
  if (typeof quantity === 'string') {
    quantity = parseFloat(quantity) || 0
  }
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    quantity = 0
  }
  
  return quantity
}

const getMaxQuantity = (productId: number | string): number => {
  const stock = getStockInfo(productId)
  if (!stock) return 999
  
  // If backorder is allowed, no max limit
  if (stock.allow_backorder) return 999
  
  // Otherwise, limit to available stock
  return stock.quantity ?? 0
}

const getStockError = (productId: number | string, quantity: number): string => {
  const stock = getStockInfo(productId)
  if (!stock) return ''
  
  // If backorder is allowed, no error
  if (stock.allow_backorder) return ''
  
  const stockQuantity = stock.quantity ?? 0
  
  // Check if quantity exceeds available stock
  if (quantity > stockQuantity) {
    return `Estoque insuficiente. Disponível: ${stockQuantity} unidades`
  }
  
  return ''
}

const getStockClass = (productId: number | string): string => {
  const stock = getStockInfo(productId)
  if (!stock) return ''
  
  const stockQuantity = stock.quantity ?? 0
  
  if (stockQuantity === 0) return 'stock-empty'
  if (stock.min_stock_level && stockQuantity <= stock.min_stock_level) return 'stock-low'
  return 'stock-ok'
}

// Computed properties for totals (must be defined before watchers that use them)
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

// Enable partial payment when payment method is not fully "a_prazo"
const enablePartialPayment = computed(() => {
  return form.value.payment_method !== 'a_prazo'
})

// Calculated debt amount
const calculatedDebtAmount = computed(() => {
  const totalValue = total.value
  const paidValue = form.value.paid_amount || 0
  
  if (form.value.payment_method === 'a_prazo') {
    // Fully on credit, all is debt
    return roundCurrency(totalValue)
  }
  
  if (paidValue >= totalValue) {
    // Fully paid
    return 0
  }
  
  // Partial payment - round to avoid floating point precision issues
  const debt = totalValue - paidValue
  return Math.max(0, roundCurrency(debt))
})

// Watch calculatedDebtAmount to sync with form.debt_amount
watch(() => calculatedDebtAmount.value, (newDebt) => {
  form.value.debt_amount = roundCurrency(newDebt)
}, { immediate: true })

// Watch paid_amount to update debt_amount
watch(() => form.value.paid_amount, (newPaidAmount) => {
  const totalValue = total.value
  
  if (newPaidAmount !== undefined && newPaidAmount !== null) {
    // Validação já é feita no handlePaidAmountBlur, mas mantemos aqui como segurança
    if (newPaidAmount > totalValue) {
      // Prevent paid amount from exceeding total
      form.value.paid_amount = roundCurrency(totalValue)
      paidAmountInput.value = formatNumberInput(totalValue)
    }
    
    // Update payment_methods to include main payment method if not already included
    if (form.value.payment_method && !form.value.payment_methods.includes(form.value.payment_method)) {
      form.value.payment_methods = [form.value.payment_method]
    }
  }
  
  // The calculatedDebtAmount watch will handle updating form.debt_amount
})

// Watch payment_method to update payment_methods
watch(() => form.value.payment_method, (newMethod) => {
  if (newMethod === 'a_prazo') {
    // If fully on credit, clear paid amount and set debt to total
    form.value.paid_amount = undefined
    paidAmountInput.value = ''
    form.value.debt_amount = roundCurrency(total.value)
    form.value.payment_methods = ['a_prazo']
  } else {
    // If not fully on credit, add to payment_methods if not already included
    if (newMethod && !form.value.payment_methods.includes(newMethod)) {
      form.value.payment_methods = [newMethod, ...form.value.payment_methods]
    }
  }
})

// The calculatedDebtAmount watch will handle updating form.debt_amount when total changes

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
    status: 'confirmed' as Order['status'],
    payment_method: 'pix' as 'cartao_credito' | 'pix' | 'dinheiro' | 'a_prazo',
    paid_amount: undefined,
    debt_amount: undefined,
    payment_methods: [],
    shipping_amount: 0,
    tax_amount: 0,
    notes: ''
  }
  paidAmountInput.value = ''
  errors.value = {}
  clearCustomerSelection()
  // Clear all product search states
  productSearchStates.value.clear()
  // Initialize state for the first product
  initProductSearchState(0)
}

// Watch for modal show/hide
watch(() => props.show, async (show) => {
  if (show) {
    // Load products and customers when modal opens
    // Carrega clientes sem filtro de busca para mostrar sugestões iniciais
    await Promise.all([
      loadProducts(),
      loadCustomers(true) // reset = true para carregar do início
    ])
    
    // If opening with an orderId, load the order data
    if (props.orderId) {
      try {

        const order = await getOrderById(props.orderId)

        
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
          paid_amount: order.paid_amount,
          debt_amount: order.debt_amount,
          payment_methods: order.payment_methods || [],
          shipping_amount: order.shipping_amount || 0,
          tax_amount: order.tax_amount || 0,
          notes: order.notes || ''
        }
        // Sincronizar o input com o valor do form
        paidAmountInput.value = formatNumberInput(order.paid_amount)
        
        // Set selected customer for autocomplete
        if (order.customer) {
          selectCustomer(order.customer)
        }
        
        // Initialize product search states for loaded products
        form.value.products.forEach((item, index) => {
          initProductSearchState(index)
          if (item.product_id) {
            const product = products.value.find(p => p.id === Number(item.product_id))
            if (product) {
              const state = getProductSearchState(index)
              state.selectedProduct = product
              state.searchTerm = product.name
            }
          }
        })
      } catch (error) {
        console.error('Error fetching order:', error)
        resetForm()
      }
    }
  } else {
    // Clear form and original order when modal closes
    resetForm()
    originalOrder.value = null
  }
})

// Customer selection methods
const getCustomerOptions = () => {
  // Combina clientes locais com resultados da busca na API
  const localCustomers = customers.value.filter(c => c.is_active !== false)
  const apiCustomers = customerSearchResults.value || []
  
  // Se há resultados da API, combina com os locais (evita duplicatas)
  if (apiCustomers.length > 0) {
    const localIds = new Set(localCustomers.map(c => c.id))
    const uniqueApiCustomers = apiCustomers.filter(c => !localIds.has(c.id))
    return [...localCustomers, ...uniqueApiCustomers]
  }
  
  // Caso contrário, retorna apenas os locais
  return localCustomers
}

const handleCustomerSearch = async (term: string) => {
  // Se o termo tem menos de 2 caracteres, limpa os resultados da API
  if (!term || term.length < 2) {
    customerSearchResults.value = []
    return
  }
  console.log('Customer search term:', term)
  // Busca na API quando o termo tem pelo menos 2 caracteres
  // Isso complementa a busca local que já está sendo feita pelo AutoComplete
  try {
    await searchCustomersAPI(term)
    console.log('Customer search results:', customerSearchResults.value)
  } catch (error) {
    console.error('Error searching customers:', error)
  }
  // Os resultados serão combinados com os locais em getCustomerOptions()
}

const handleCustomerSelect = (customer: any) => {
  form.value.customer_id = customer.id
  selectCustomer(customer)
}

const handleCustomerClear = () => {
  form.value.customer_id = 0
  clearCustomerSelection()
}

// Product search state - one instance per product item
const productSearchStates = ref<Map<number, {
  searchTerm: string
  searchResults: any[]
  isSearching: boolean
  selectedProduct: any | null
}>>(new Map())

// Initialize search state for a product item index
const initProductSearchState = (index: number) => {
  if (!productSearchStates.value.has(index)) {
    productSearchStates.value.set(index, {
      searchTerm: '',
      searchResults: [],
      isSearching: false,
      selectedProduct: null
    })
  }
}

// Get search state for a product item index
const getProductSearchState = (index: number) => {
  initProductSearchState(index)
  return productSearchStates.value.get(index)!
}

// Product search methods
// Agora com filtro local, a busca na API só é necessária se o filtro local não encontrar resultados suficientes
const searchProductsForIndex = async (index: number, _term: string) => {
  const state = getProductSearchState(index)
  // Com filtro local ativado, não precisamos buscar na API a cada letra
  // A busca na API pode ser usada apenas se necessário (ex: quando o filtro local não encontrar resultados)
  // Por enquanto, vamos manter a lista de produtos local e filtrar apenas localmente
  // Se no futuro precisar buscar mais produtos da API, pode ser implementado aqui
  // O searchTerm é gerenciado pelo AutoComplete internamente
  state.searchTerm = ''
}

const handleProductSelect = (index: number, product: any) => {
  const state = getProductSearchState(index)
  state.selectedProduct = product
  state.searchTerm = product.name
  
  // Update form with product ID
  form.value.products[index].product_id = product.id
  
  // Update price and check stock
  updateProductPrice(index)
}

const handleProductClear = (index: number) => {
  const state = getProductSearchState(index)
  state.selectedProduct = null
  state.searchTerm = ''
  state.searchResults = []
  
  form.value.products[index].product_id = 0
}

// Helper functions for AutoComplete
const getProductForItem = (productId: number | string) => {
  if (!productId || productId === 0 || productId === '0') return null
  const productIdNum = Number(productId)
  const product = products.value.find(p => {
    const pId = typeof p.id === 'string' ? Number(p.id) : p.id
    return pId === productIdNum
  })
  return product || null
}

const getProductOptions = (_index: number) => {
  // Sempre usa todos os produtos ativos para filtro local
  // O AutoComplete agora faz o filtro localmente
  return products.value.filter(p => p.is_active).map(product => ({
    ...product,
    id: product.id,
    name: product.name,
    formatted_price: formatCurrency(typeof product.price === 'string' ? parseFloat(product.price) : product.price)
  }))
}

const getProductSearchTerm = (index: number) => {
  const state = getProductSearchState(index)
  // If product is selected, show its name, otherwise show search term
  if (state.selectedProduct) {
    return state.selectedProduct.name
  }
  return state.searchTerm
}

const isProductSearching = (index: number) => {
  const state = getProductSearchState(index)
  return state.isSearching
}

const addProduct = () => {
  const newIndex = form.value.products.length
  form.value.products.push({
    product_id: 0,
    quantity: 1
  })
  // Initialize search state for new product
  initProductSearchState(newIndex)
}

const removeProduct = (index: number) => {
  if (form.value.products.length > 1) {
    // Clear search state for removed product
    productSearchStates.value.delete(index)
    // Reindex remaining states
    const newStates = new Map<number, any>()
    productSearchStates.value.forEach((state, idx) => {
      if (idx < index) {
        newStates.set(idx, state)
      } else if (idx > index) {
        newStates.set(idx - 1, state)
      }
    })
    productSearchStates.value = newStates
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
      // Se allow_backorder é true, permite estoque negativo/zero sem avisos
      if (stock.allow_backorder) {
        // Não mostra nenhum toast, permite continuar normalmente
        return
      }
      
      // Se não permite backorder, verifica estoque
      // If no stock and backorder not allowed, show warning
      if (stock.quantity <= 0) {
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
    if (!item.product_id || item.product_id <= 0 || item.quantity <= 0) {
      return
    }
    
    const product = products.value.find(p => p.id === Number(item.product_id))
    if (!product?.stock) {
      return
    }
    
    const stock = product.stock
    // Se allow_backorder é true, permite estoque negativo/zero, não adiciona como issue
    if (stock.allow_backorder) {
      // Permite continuar normalmente, não adiciona à lista de issues
      return
    }
    
    // Only add to issues if quantity exceeds available stock AND backorder is not allowed
    // Considera estoque 0 ou negativo como problema quando não permite backorder
    if (item.quantity > stock.quantity || stock.quantity <= 0) {
      issues.push({
        productName: product.name,
        requestedQuantity: item.quantity,
        availableStock: stock.quantity,
        allowBackorder: stock.allow_backorder
      })
    }
  })
  
  console.log('Stock check - Issues found:', issues.length, issues)
  return issues
}

// Watch for products loading - no need to update prices since we calculate them dynamically
watch(() => products.value, (newProducts) => {
  console.log('Products loaded:', newProducts.length)
}, { deep: true })

const validatePayment = (): { isValid: boolean; error?: string } => {
  const totalValue = total.value
  const paymentMethod = form.value.payment_method
  const paidAmount = form.value.paid_amount

  // If payment is fully on credit, it's valid
  if (paymentMethod === 'a_prazo') {
    return { isValid: true }
  }

  // If there's a partial payment
  if (paidAmount !== undefined && paidAmount !== null) {
    if (paidAmount <= 0) {
      return { 
        isValid: false, 
        error: 'Valor pago deve ser maior que zero' 
      }
    }
    
    if (paidAmount >= totalValue) {
      return { 
        isValid: false, 
        error: 'Valor pago deve ser menor que o total para pagamento parcial' 
      }
    }
    
    const debtAmount = totalValue - paidAmount
    if (debtAmount <= 0) {
      return { 
        isValid: false, 
        error: 'Valor à prazo deve ser maior que zero' 
      }
    }
  }

  return { isValid: true }
}

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

  // Validate payment
  const paymentValidation = validatePayment()
  if (!paymentValidation.isValid && paymentValidation.error) {
    errors.value.paid_amount = paymentValidation.error
    return false
  }

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

const prepareOrderData = () => {
  // Prepare base order data
  const orderData: any = {
    customer_id: form.value.customer_id,
    products: form.value.products,
    payment_method: form.value.payment_method,
    shipping_amount: roundCurrency(form.value.shipping_amount || 0),
    tax_amount: roundCurrency(form.value.tax_amount || 0),
    notes: form.value.notes
  }

    // Add payment information according to payment type
    if (form.value.payment_method === 'a_prazo') {
      // Fully on credit - no paid amount, all is debt
      orderData.payment_methods = ['a_prazo']
    } else if (form.value.paid_amount !== undefined && form.value.paid_amount > 0) {
      // Partial payment - part paid, part as debt
      orderData.paid_amount = roundCurrency(form.value.paid_amount)
      const methods = form.value.payment_methods.length > 0 
        ? [...form.value.payment_methods] 
        : [form.value.payment_method]
      
      // If paid amount is less than total, add 'a_prazo' to methods
      if (form.value.paid_amount < total.value && !methods.includes('a_prazo')) {
        methods.push('a_prazo')
      }
      orderData.payment_methods = methods
    } else {
      // Full payment à vista - no debt
      // Backend will handle this automatically, but we can be explicit
      orderData.paid_amount = roundCurrency(total.value)
      orderData.payment_methods = form.value.payment_methods.length > 0 
        ? form.value.payment_methods 
        : [form.value.payment_method]
    }

  return orderData
}

const submitOrder = async () => {
  try {
    let result: Order | null = null

    // Prepare order data with payment information
    const orderData = prepareOrderData()

    if (isEditing.value && props.orderId) {
      // Only include status if it changed
      if (form.value.status !== originalOrder.value?.status) {
        orderData.status = form.value.status
      }
      
      console.log('🚀 Sending update data to API:', orderData)
      console.log('🚀 Order ID:', props.orderId)
      
      result = await updateOrder(props.orderId, orderData)
      console.log('✅ Update successful, result:', result)
    } else {
      orderData.status = form.value.status
      console.log('🚀 Creating new order:', orderData)
      result = await createOrder(orderData)
      console.log('✅ Create successful, result:', result)
    }

    if (result) {
      // Refresh the orders list after successful save
      console.log('🔄 Refreshing orders list after save')
      await refresh()
      
      // If it's a new order (not editing), show ticket
      if (!isEditing.value && result.id) {
        console.log('🎫 Showing ticket for new order:', result.id)
        createdOrderId.value = result.id
        showTicketModal.value = true
      }
      
      emit('success', result)
      
      // Only close modal if not showing ticket
      if (!showTicketModal.value) {
        emit('update:show', false)
        console.log('✅ Modal closed and success emitted')
      }
    }
  } catch (error) {
    console.error('❌ Error submitting form:', error)
  }
}

// Handle ticket modal close
const handleTicketClose = () => {
  showTicketModal.value = false
  createdOrderId.value = null
  emit('update:show', false)
  console.log('✅ Ticket modal closed, main modal closing')
}

// Show ticket for existing order
const showTicketForOrder = async () => {
  if (props.orderId) {
    try {
      isOpeningTicket.value = true
      console.log('🎫 Showing ticket for existing order:', props.orderId)
      // Garantir que o pedido está carregado antes de abrir o modal
      if (!originalOrder.value) {
        await getOrderById(props.orderId)
      }
      createdOrderId.value = props.orderId
      showTicketModal.value = true
    } catch (error) {
      console.error('Error opening ticket:', error)
      showNotification('Erro ao abrir ticket', 'error')
    } finally {
      isOpeningTicket.value = false
    }
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
  .customer-autocomplete,
  .product-autocomplete {
    width: 100%;
  }

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
      
      &.paid {
        color: var(--success);
      }
      
      &.debt {
        color: var(--warning);
      }
    }
  }

  .partial-payment-info {
    background: var(--info-light, #e0f2fe);
    padding: var(--spacing-3);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-4);
    
    .info-text {
      margin: 0;
      color: var(--info-dark, #0369a1);
      font-size: var(--font-size-sm);
    }
  }

  .payment-methods-checkboxes {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    margin-top: var(--spacing-2);
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      cursor: pointer;
      padding: var(--spacing-2);
      border-radius: var(--radius-sm);
      transition: background-color var(--transition-fast);
      
      &:hover {
        background: var(--gray-50);
      }
      
      .checkbox-input {
        cursor: pointer;
      }
    }
  }

  .form-hint {
    display: block;
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--gray-500);
  }

  .readonly-input {
    background: var(--gray-50);
    cursor: not-allowed;
  }
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-actions-left {
  display: flex;
  justify-content: flex-start;
  margin-right: 12px;
  gap: var(--spacing-3);
}

.modal-actions-right {
  display: flex;
  gap: var(--spacing-3);
}

.print-icon {
  margin-right: var(--spacing-2);
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
    gap: var(--spacing-3);
  }
  
  .modal-actions-left,
  .modal-actions-right {
    width: 100%;
    justify-content: center;
  }
  
  .modal-actions-left {
    order: 2;
  }
  
  .modal-actions-right {
    order: 1;
  }
}

// Loading overlay styles
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  z-index: 10;
  border-radius: var(--border-radius-md);
  
  p {
    margin: 0;
    color: var(--gray-700);
    font-size: var(--font-size-sm);
  }
}

.order-form.is-loading {
  position: relative;
  pointer-events: none;
  opacity: 0.6;
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
