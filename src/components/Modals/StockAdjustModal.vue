<template>
  <BaseModal
    :show="show"
    :title="product ? `Estoque · ${product.name}` : 'Estoque'"
    size="md"
    @update:show="$emit('update:show', $event)"
  >
    <div class="tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.id"
        role="tab"
        :aria-selected="tab === t.id"
        :class="['tab', { active: tab === t.id }]"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Ajustar -->
    <form v-if="tab === 'adjust'" class="adjust" @submit.prevent="submit">
      <div class="balance">
        <span class="balance-label">Saldo atual</span>
        <span class="balance-value">{{ currentQuantity }}</span>
        <span class="balance-unit">unidades</span>
      </div>

      <div class="segmented" role="radiogroup" aria-label="Tipo de movimentação">
        <button
          v-for="op in operations"
          :key="op.id"
          type="button"
          role="radio"
          :aria-checked="operation === op.id"
          :class="['segment', { active: operation === op.id }]"
          @click="selectOperation(op.id)"
        >
          {{ op.label }}
        </button>
      </div>
      <p class="op-hint">{{ activeOperation.hint }}</p>

      <div class="field">
        <label for="stock-qty" class="label">{{ activeOperation.quantityLabel }}</label>
        <BaseInput
          id="stock-qty"
          v-model="quantityInput"
          type="number"
          min="0"
          step="1"
          placeholder="0"
        />
      </div>

      <div class="field">
        <label for="stock-reason" class="label">
          Motivo<span v-if="reasonRequired"> *</span>
        </label>
        <BaseSelect
          id="stock-reason"
          v-model="reasonChoice"
          :options="reasonOptions"
          placeholder="Selecione o motivo"
        />
        <BaseInput
          v-if="reasonChoice === OTHER"
          v-model="customReason"
          placeholder="Descreva o motivo"
        />
      </div>

      <div v-if="quantityInput !== ''" class="preview" :class="{ invalid: !!validationError }">
        <template v-if="!validationError">
          <span>{{ currentQuantity }}</span>
          <span class="arrow">→</span>
          <strong>{{ resultingQuantity }}</strong>
          <span class="delta" :class="deltaClass">{{ deltaLabel }}</span>
        </template>
        <template v-else>{{ validationError }}</template>
      </div>

      <p v-if="serverError" class="server-error">{{ serverError }}</p>
    </form>

    <!-- Histórico -->
    <div v-else class="history">
      <p v-if="isLoadingHistory && movements.length === 0" class="muted">Carregando histórico...</p>
      <p v-else-if="movements.length === 0" class="muted">Nenhuma movimentação registrada ainda.</p>
      <ul v-else class="movement-list">
        <li v-for="m in movements" :key="m.id" class="movement">
          <div class="movement-main">
            <Badge :variant="typeMeta(m.type).variant">{{ typeMeta(m.type).label }}</Badge>
            <span class="movement-reason">{{ m.reason || '—' }}</span>
          </div>
          <div class="movement-side">
            <strong :class="m.quantity_change > 0 ? 'plus' : 'minus'">
              {{ m.quantity_change > 0 ? '+' : '' }}{{ m.quantity_change }}
            </strong>
            <span class="movement-balance">{{ m.quantity_before }} → {{ m.quantity_after }}</span>
          </div>
          <div class="movement-meta">
            {{ formatDateTime(m.created_at) }}<template v-if="m.user"> · {{ m.user.name }}</template>
          </div>
        </li>
      </ul>
      <BaseButton
        v-if="hasMoreHistory"
        variant="secondary"
        size="sm"
        :disabled="isLoadingHistory"
        @click="loadHistory(historyPage + 1)"
      >
        Carregar mais
      </BaseButton>
    </div>

    <template #footer>
      <div class="footer">
        <BaseButton variant="secondary" @click="$emit('update:show', false)">
          {{ tab === 'adjust' ? 'Cancelar' : 'Fechar' }}
        </BaseButton>
        <BaseButton
          v-if="tab === 'adjust'"
          variant="primary"
          :disabled="!canSubmit || isSubmitting"
          @click="submit"
        >
          {{ isSubmitting ? 'Salvando...' : 'Confirmar' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseButton from '@/components/Base/Button.vue'
import Badge from '@/components/Base/Badge.vue'
import { productsService } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'
import type { Product, StockMovement, StockOperation } from '@/types/api'

const props = defineProps<{
  show: boolean
  product: Product | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  success: []
}>()

const notifications = useNotifications()

const OTHER = '__other__'

const tabs = [
  { id: 'adjust', label: 'Ajustar' },
  { id: 'history', label: 'Histórico' }
] as const

const operations = [
  {
    id: 'add' as StockOperation,
    label: 'Entrada',
    quantityLabel: 'Quantidade que entrou',
    hint: 'Soma ao saldo atual. Use quando chegar mercadoria.',
    reasons: ['Compra / reposição', 'Devolução de cliente', 'Produção']
  },
  {
    id: 'subtract' as StockOperation,
    label: 'Saída',
    quantityLabel: 'Quantidade que saiu',
    hint: 'Subtrai do saldo atual. Vendas já baixam o estoque sozinhas.',
    reasons: ['Perda / quebra', 'Vencimento', 'Consumo próprio']
  },
  {
    id: 'set' as StockOperation,
    label: 'Contagem',
    quantityLabel: 'Quantidade contada',
    hint: 'Define o saldo pela contagem real. A diferença fica registrada.',
    reasons: ['Contagem de inventário', 'Correção de cadastro']
  }
]

const tab = ref<'adjust' | 'history'>('adjust')
const operation = ref<StockOperation>('add')
const quantityInput = ref<string | number>('')
const reasonChoice = ref('')
const customReason = ref('')
const isSubmitting = ref(false)
const serverError = ref('')

// History
const movements = ref<StockMovement[]>([])
const historyPage = ref(1)
const hasMoreHistory = ref(false)
const isLoadingHistory = ref(false)

const currentQuantity = ref(0)

const activeOperation = computed(() => operations.find(o => o.id === operation.value)!)
const reasonRequired = computed(() => operation.value !== 'add')
const allowBackorder = computed(() => !!props.product?.stock?.allow_backorder)

const reasonOptions = computed(() => [
  ...activeOperation.value.reasons.map(r => ({ value: r, label: r })),
  { value: OTHER, label: 'Outro' }
])

const quantity = computed(() => (quantityInput.value === '' ? NaN : Number(quantityInput.value)))

const resultingQuantity = computed(() => {
  if (operation.value === 'add') return currentQuantity.value + quantity.value
  if (operation.value === 'subtract') return currentQuantity.value - quantity.value
  return quantity.value
})

const delta = computed(() => resultingQuantity.value - currentQuantity.value)
const deltaLabel = computed(() => (delta.value > 0 ? `+${delta.value}` : `${delta.value}`))
const deltaClass = computed(() => (delta.value > 0 ? 'plus' : delta.value < 0 ? 'minus' : ''))

const finalReason = computed(() => {
  if (reasonChoice.value === OTHER) return customReason.value.trim()
  return reasonChoice.value
})

const validationError = computed(() => {
  if (quantityInput.value === '') return ''
  const q = quantity.value
  if (!Number.isInteger(q) || q < 0) return 'Informe uma quantidade inteira, zero ou maior.'
  if (operation.value !== 'set' && q === 0) return 'A quantidade deve ser maior que zero.'
  if (operation.value === 'subtract' && q > currentQuantity.value && !allowBackorder.value) {
    return `A saída é maior que o saldo disponível (${currentQuantity.value}).`
  }
  return ''
})

const canSubmit = computed(() => {
  if (quantityInput.value === '' || validationError.value) return false
  if (reasonRequired.value && !finalReason.value) return false
  return true
})

const selectOperation = (id: StockOperation) => {
  operation.value = id
  reasonChoice.value = ''
  customReason.value = ''
  serverError.value = ''
}

const resetForm = () => {
  tab.value = 'adjust'
  operation.value = 'add'
  quantityInput.value = ''
  reasonChoice.value = ''
  customReason.value = ''
  serverError.value = ''
  movements.value = []
  historyPage.value = 1
  hasMoreHistory.value = false
}

const loadHistory = async (page = 1) => {
  if (!props.product) return
  isLoadingHistory.value = true
  try {
    const res = await productsService.getStockMovements(props.product.id, page)
    movements.value = page === 1 ? res.data : [...movements.value, ...res.data]
    historyPage.value = res.current_page
    hasMoreHistory.value = res.current_page < res.last_page
  } catch {
    // The API client already reports the error
  } finally {
    isLoadingHistory.value = false
  }
}

const submit = async () => {
  if (!props.product || !canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  serverError.value = ''
  try {
    await productsService.adjustStock(
      props.product.id,
      operation.value,
      quantity.value,
      finalReason.value || undefined
    )
    notifications.success('Estoque atualizado')
    emit('success')
    emit('update:show', false)
  } catch (e: any) {
    const errors = e?.response?.data?.errors
    serverError.value = errors?.quantity?.[0] || errors?.reason?.[0] || e?.response?.data?.message || 'Não foi possível atualizar o estoque.'
  } finally {
    isSubmitting.value = false
  }
}

const typeMeta = (type: StockMovement['type']): { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' } => {
  switch (type) {
    case 'entry': return { label: 'Entrada', variant: 'success' }
    case 'exit': return { label: 'Saída', variant: 'danger' }
    case 'adjustment': return { label: 'Contagem', variant: 'info' }
    case 'sale': return { label: 'Venda', variant: 'neutral' }
    case 'sale_return': return { label: 'Estorno', variant: 'warning' }
    default: return { label: 'Inicial', variant: 'neutral' }
  }
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

watch(() => props.show, (show) => {
  if (show) {
    resetForm()
    currentQuantity.value = props.product?.stock?.quantity ?? props.product?.stock_quantity ?? 0
  }
})

watch(tab, (t) => {
  if (t === 'history' && movements.value.length === 0) loadHistory(1)
})
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--border);
}

.tab {
  padding: var(--spacing-2) var(--spacing-4);
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-weight: 500;
  cursor: pointer;

  &.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
}

.adjust {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.balance {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--surface-muted);
  border-radius: var(--radius-lg);
}

.balance-label {
  margin-right: auto;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.balance-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text);
}

.balance-unit {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 3px;
  background: var(--gray-200);
  border-radius: var(--radius-lg);
}

.segment {
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &.active {
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-sm);
  }
}

.op-hint {
  margin-top: calc(var(--spacing-2) * -1);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text);
}

.preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-lg);

  &.invalid {
    border-color: var(--danger);
    background: var(--danger-soft);
    color: var(--danger-strong);
    font-size: var(--font-size-sm);
  }
}

.arrow { color: var(--text-muted); }
.delta { margin-left: auto; font-size: var(--font-size-sm); font-weight: 600; }
.plus { color: var(--success); }
.minus { color: var(--danger); }

.server-error {
  font-size: var(--font-size-sm);
  color: var(--danger);
}

.history {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-3);
  min-height: 160px;
}

.muted {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.movement-list {
  list-style: none;
  width: 100%;
}

.movement {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-1) var(--spacing-3);
  padding: var(--spacing-3) 0;

  & + & { border-top: 1px solid var(--border); }
}

.movement-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.movement-reason {
  font-size: var(--font-size-sm);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movement-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.movement-balance,
.movement-meta {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.movement-meta { grid-column: 1 / -1; }

.footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
}
</style>
