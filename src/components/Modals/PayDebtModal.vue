<template>
  <BaseModal
    :show="show"
    title="Quitar Débito"
    size="md"
    @update:show="$emit('update:show', $event)"
  >
    <div v-if="customer && !receiptCtx" class="pay-debt-form">
      <!-- Customer Info -->
      <div class="customer-info-section">
        <h3 class="section-title">Cliente</h3>
        <div class="customer-details">
          <div class="detail-row">
            <span class="label">Nome:</span>
            <span class="value">{{ customer.name }}</span>
          </div>
          <div class="detail-row" v-if="customer.phone">
            <span class="label">Telefone:</span>
            <span class="value">{{ customer.phone }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Débito Atual:</span>
            <span class="value balance">{{ formatCurrency(customer.balance || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="payment-section">
        <h3 class="section-title">Registrar Pagamento</h3>
        
        <div class="form-group">
          <BaseSelect
            id="payment_method"
            v-model="paymentForm.payment_method"
            :options="paymentMethodOptions"
            label="Forma de pagamento"
            required
            :error="errors.payment_method"
          />
        </div>

        <div class="form-group">
          <label for="amount" class="form-label">Valor do Pagamento (R$) *</label>
          <BaseInput
            id="amount"
            v-model.number="paymentForm.amount"
            type="number"
            :min="0.01"
            :max="customer.balance || 0"
            step="0.01"
            placeholder="0.00"
            :error="errors.amount"
            required
          />
          <small class="form-hint">
            Valor máximo: {{ formatCurrency(customer.balance || 0) }}
          </small>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Descrição (opcional)</label>
          <BaseInput
            id="description"
            v-model="paymentForm.description"
            type="text"
            placeholder="Ex: Pagamento parcial, recebido em dinheiro, etc."
            :error="errors.description"
          />
        </div>

        <div class="payment-preview" v-if="paymentForm.amount && paymentForm.amount > 0">
          <div class="preview-item">
            <span class="preview-label">Débito atual:</span>
            <span class="preview-value">{{ formatCurrency(customer.balance || 0) }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Valor do pagamento:</span>
            <span class="preview-value payment">{{ formatCurrency(paymentForm.amount) }}</span>
          </div>
          <div class="preview-item total">
            <span class="preview-label">Saldo após pagamento:</span>
            <span class="preview-value" :class="getRemainingBalanceClass()">
              {{ formatCurrency(getRemainingBalance()) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="customer && receiptCtx" class="pay-debt-success">
      <p class="success-title">Pagamento registrado</p>
      <p class="success-text">Abra no navegador, baixe ou compartilhe o comprovante em PDF.</p>
      <div class="receipt-actions">
        <BaseButton
          type="button"
          variant="secondary"
          :loading="receiptPdfLoading"
          :disabled="isSharing"
          @click="openReceiptPdf(false)"
        >
          <span class="action-icon">📄</span>
          Abrir PDF
        </BaseButton>
        <BaseButton
          type="button"
          variant="secondary"
          :loading="receiptPdfLoading"
          :disabled="isSharing"
          @click="openReceiptPdf(true)"
        >
          <span class="action-icon">⬇️</span>
          Baixar PDF
        </BaseButton>
        <BaseButton
          v-if="isShareSupported"
          type="button"
          variant="success"
          :loading="receiptPdfLoading || isSharing"
          :disabled="receiptPdfLoading || isSharing"
          @click="shareReceiptPdf"
        >
          <span v-if="!(receiptPdfLoading || isSharing)" class="action-icon">📤</span>
          {{ receiptPdfLoading || isSharing ? 'Gerando...' : 'Compartilhar' }}
        </BaseButton>
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <template v-if="receiptCtx">
          <BaseButton type="button" variant="primary" @click="closeAfterReceipt">Fechar</BaseButton>
        </template>
        <template v-else>
          <BaseButton
            type="button"
            variant="secondary"
            @click="$emit('update:show', false)"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            type="button"
            variant="primary"
            :loading="isPayingDebt"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            Registrar Pagamento
          </BaseButton>
        </template>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseSelect from '@/components/Base/Select.vue'
import { useCustomerDebts } from '@/composables/useCustomerDebts'
import { useFormatter } from '@/composables/useUtils'
import { useWebShare } from '@/composables/useWebShare'
import { customersService } from '@/services/api/customers'
import type { PayDebtRequest } from '@/types/api'
// Partial customer type (only what we need for this modal)
interface CustomerBasic {
  id: number
  name: string
  phone?: string
  balance?: number
}

interface Props {
  show: boolean
  customer: CustomerBasic | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const toast = useToast()
const { payDebt, isPayingDebt, loadBalance } = useCustomerDebts()
const { currency } = useFormatter()
const { shareFile, isSupported: isShareSupported, isSharing } = useWebShare()

const formatCurrency = currency

const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de crédito' }
]

// Form state
const paymentForm = ref({
  payment_method: 'pix' as PayDebtRequest['payment_method'],
  amount: undefined as number | undefined,
  description: ''
})

const errors = ref<Record<string, string>>({})

const receiptCtx = ref<{ customerId: number; debtId: number } | null>(null)
const receiptPdfLoading = ref(false)

// Computed
const canSubmit = computed(() => {
  if (!props.customer) return false
  if (!paymentForm.value.payment_method) return false
  if (!paymentForm.value.amount || paymentForm.value.amount <= 0) return false
  if (paymentForm.value.amount > (props.customer.balance || 0)) return false
  return true
})

const getRemainingBalance = (): number => {
  if (!props.customer || !paymentForm.value.amount) return props.customer?.balance || 0
  const currentBalance = props.customer.balance || 0
  return Math.max(0, currentBalance - paymentForm.value.amount)
}

const getRemainingBalanceClass = (): string => {
  const remaining = getRemainingBalance()
  return remaining === 0 ? 'paid' : 'partial'
}

// Methods
const validateForm = (): boolean => {
  errors.value = {}

  if (!paymentForm.value.payment_method) {
    errors.value.payment_method = 'Selecione a forma de pagamento'
    return false
  }

  if (!paymentForm.value.amount || paymentForm.value.amount <= 0) {
    errors.value.amount = 'Valor do pagamento é obrigatório e deve ser maior que zero'
    return false
  }

  if (!props.customer) {
    errors.value.customer = 'Cliente não encontrado'
    return false
  }

  const maxAmount = props.customer.balance || 0
  if (paymentForm.value.amount > maxAmount) {
    errors.value.amount = `Valor não pode ser maior que o débito atual (${formatCurrency(maxAmount)})`
    return false
  }

  return true
}

const debtReceiptFilename = () => `comprovante-quitacao-${receiptCtx.value?.debtId ?? 'recibo'}.pdf`

const receiptShareTitle = () => {
  const name = props.customer?.name
  return name ? `Comprovante de quitação — ${name}` : 'Comprovante de quitação'
}

const openReceiptPdf = async (download: boolean) => {
  if (!receiptCtx.value) return
  receiptPdfLoading.value = true
  try {
    const blob = await customersService.getDebtReceiptPdf(
      receiptCtx.value.customerId,
      receiptCtx.value.debtId,
      { download }
    )
    const url = URL.createObjectURL(blob)
    if (download) {
      const link = document.createElement('a')
      link.href = url
      link.download = debtReceiptFilename()
      link.click()
      URL.revokeObjectURL(url)
      toast.success('PDF baixado com sucesso')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao gerar comprovante')
  } finally {
    receiptPdfLoading.value = false
  }
}

const shareReceiptPdf = async () => {
  if (!receiptCtx.value) return
  receiptPdfLoading.value = true
  try {
    const blob = await customersService.getDebtReceiptPdf(
      receiptCtx.value.customerId,
      receiptCtx.value.debtId,
      { download: false }
    )
    await shareFile(blob, debtReceiptFilename(), receiptShareTitle(), 'Comprovante de quitação (PDF)')
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      toast.error(e?.message || 'Erro ao gerar PDF para compartilhar')
    }
  } finally {
    receiptPdfLoading.value = false
  }
}

const closeAfterReceipt = () => {
  receiptCtx.value = null
  emit('update:show', false)
}

const handleSubmit = async () => {
  if (!validateForm() || !props.customer) return

  try {
    const res = await payDebt(props.customer.id, {
      amount: paymentForm.value.amount!,
      payment_method: paymentForm.value.payment_method,
      description: paymentForm.value.description || undefined
    })

    await loadBalance(props.customer.id)

    receiptCtx.value = { customerId: props.customer.id, debtId: res.debt.id }
    emit('success')

    paymentForm.value = {
      payment_method: 'pix',
      amount: undefined,
      description: ''
    }
    errors.value = {}
  } catch (error: any) {
    console.error('Error paying debt:', error)
  }
}

// Watch for modal show/hide
watch(() => props.show, (show) => {
  if (!show) {
    receiptCtx.value = null
    paymentForm.value = {
      payment_method: 'pix',
      amount: undefined,
      description: ''
    }
    errors.value = {}
  }
})
</script>

<style lang="scss" scoped>
.pay-debt-form {
  .customer-info-section {
    margin-bottom: var(--spacing-6);
    padding: var(--spacing-4);
    background: var(--gray-50);
    border-radius: var(--radius-md);
  }

  .payment-section {
    margin-bottom: var(--spacing-4);
  }

  .section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-dark);
    margin: 0 0 var(--spacing-4) 0;
    padding-bottom: var(--spacing-2);
    border-bottom: 2px solid var(--gray-200);
  }

  .customer-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;

    .label {
      font-weight: 600;
      color: var(--gray-600);
    }

    .value {
      color: var(--gray-800);
      font-weight: 500;

      &.balance {
        color: var(--warning, #f59e0b);
        font-weight: 700;
        font-size: var(--font-size-lg);
      }
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
  }

  .form-label {
    font-weight: 500;
    color: var(--gray-700);
    font-size: var(--font-size-sm);
  }

  .form-hint {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--gray-500);
    margin-top: var(--spacing-1);
  }

  .payment-preview {
    margin-top: var(--spacing-4);
    padding: var(--spacing-4);
    background: var(--gray-50);
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-200);
  }

  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;

    &.total {
      border-top: 2px solid var(--gray-300);
      margin-top: var(--spacing-2);
      padding-top: var(--spacing-3);
      font-weight: 600;
    }

    .preview-label {
      color: var(--gray-600);
    }

    .preview-value {
      font-weight: 500;
      color: var(--primary-dark);

      &.payment {
        color: var(--success, #10b981);
      }

      &.paid {
        color: var(--success, #10b981);
      }

      &.partial {
        color: var(--warning, #f59e0b);
      }
    }
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

.pay-debt-success {
  padding: var(--spacing-2) 0;
  text-align: center;
}

.success-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--success-dark, #065f46);
  margin: 0 0 var(--spacing-2);
}

.success-text {
  margin: 0 0 var(--spacing-4);
  color: var(--gray-600);
  font-size: var(--font-size-sm);
}

.receipt-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-3);

  .action-icon {
    margin-right: var(--spacing-1);
  }
}
</style>
