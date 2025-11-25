<template>
  <BaseModal
    :show="show"
    title="Quitar Débito"
    size="md"
    @update:show="$emit('update:show', $event)"
  >
    <div v-if="customer" class="pay-debt-form">
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
          type="button"
          variant="primary"
          :loading="isPayingDebt"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          Registrar Pagamento
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseButton from '@/components/Base/Button.vue'
import { useCustomerDebts } from '@/composables/useCustomerDebts'
import { useFormatter } from '@/composables/useUtils'
import { useNotifications } from '@/composables/useNotifications'
import type { Customer } from '@/types/api'

interface Props {
  show: boolean
  customer: Customer | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const { payDebt, isPayingDebt, loadBalance } = useCustomerDebts()
const { currency } = useFormatter()
const { showNotification } = useNotifications()

const formatCurrency = currency

// Form state
const paymentForm = ref({
  amount: undefined as number | undefined,
  description: ''
})

const errors = ref<Record<string, string>>({})

// Computed
const canSubmit = computed(() => {
  if (!props.customer) return false
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

const handleSubmit = async () => {
  if (!validateForm() || !props.customer) return

  try {
    await payDebt(props.customer.id, {
      amount: paymentForm.value.amount!,
      description: paymentForm.value.description || undefined
    })

    // Reload balance to get updated value
    await loadBalance(props.customer.id)

    emit('success')
    emit('update:show', false)
    
    // Reset form
    paymentForm.value = {
      amount: undefined,
      description: ''
    }
    errors.value = {}
  } catch (error: any) {
    console.error('Error paying debt:', error)
    // Error is handled by the composable
  }
}

// Watch for modal show/hide
watch(() => props.show, (show) => {
  if (!show) {
    // Reset form when modal closes
    paymentForm.value = {
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
</style>
