<template>
  <BaseModal :show="show" title="Editar quitação" size="sm" @update:show="$emit('update:show', $event)">
    <form class="edit-form" @submit.prevent="submit">
      <p v-if="customerName" class="customer">{{ customerName }}</p>
      <BaseSelect v-model="method" :options="paymentMethodOptions" label="Forma de pagamento" />
      <div class="actions">
        <BaseButton type="button" variant="secondary" :disabled="saving" @click="$emit('update:show', false)">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" variant="primary" :loading="saving" :disabled="!method || method === currentMethod">
          Salvar
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import BaseModal from '@/components/Base/Modal.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseButton from '@/components/Base/Button.vue'
import { customersService } from '@/services/api/customers'
import type { PayDebtRequest } from '@/types/api'

const props = defineProps<{
  show: boolean
  customerId: number | null
  debtId: number | null
  customerName?: string
  currentMethod?: string | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: [debt: { id: number; payment_method: string; payment_method_label: string }]
}>()

const toast = useToast()

const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'desconto_funcionario', label: 'Descontar (Funcionário)' }
]

const method = ref<string>('')
const saving = ref(false)

watch(
  () => props.show,
  (open) => {
    if (open) method.value = props.currentMethod ?? ''
  }
)

const submit = async () => {
  if (!props.customerId || !props.debtId || !method.value) return
  saving.value = true
  try {
    const res = await customersService.updateDebtPaymentMethod(
      props.customerId,
      props.debtId,
      method.value as PayDebtRequest['payment_method']
    )
    toast.success('Forma de pagamento atualizada')
    emit('saved', res.debt as any)
    emit('update:show', false)
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao atualizar a quitação')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.customer {
  margin: 0;
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
}
</style>
