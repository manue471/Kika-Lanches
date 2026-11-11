<template>
  <BaseModal
    :show="show"
    title="Comprovante de quitação"
    size="md"
    @update:show="$emit('update:show', $event)"
  >
    <div class="pay-debt-success">
      <p v-if="customerName" class="success-title">{{ customerName }}</p>
      <p class="success-text">Abra no navegador, baixe ou compartilhe o comprovante em PDF.</p>
      <div class="receipt-actions">
        <BaseButton
          type="button"
          variant="secondary"
          :loading="loading"
          :disabled="isSharing"
          @click="openReceiptPdf(false)"
        >
          <span class="action-icon">📄</span>
          Abrir PDF
        </BaseButton>
        <BaseButton
          type="button"
          variant="secondary"
          :loading="loading"
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
          :loading="loading || isSharing"
          :disabled="loading || isSharing"
          @click="shareReceiptPdf"
        >
          <span v-if="!(loading || isSharing)" class="action-icon">📤</span>
          {{ loading || isSharing ? 'Gerando...' : 'Compartilhar' }}
        </BaseButton>
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <BaseButton type="button" variant="primary" @click="$emit('update:show', false)">Fechar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import BaseModal from '@/components/Base/Modal.vue'
import BaseButton from '@/components/Base/Button.vue'
import { useWebShare } from '@/composables/useWebShare'
import { customersService } from '@/services/api/customers'

interface Props {
  show: boolean
  customerId: number | null
  debtId: number | null
  customerName?: string
}

const props = defineProps<Props>()

defineEmits<{
  'update:show': [value: boolean]
}>()

const toast = useToast()
const { shareFile, isSupported: isShareSupported, isSharing } = useWebShare()

const loading = ref(false)

const filename = () => `comprovante-quitacao-${props.debtId ?? 'recibo'}.pdf`

const shareTitle = () =>
  props.customerName ? `Comprovante de quitação — ${props.customerName}` : 'Comprovante de quitação'

const openReceiptPdf = async (download: boolean) => {
  if (props.customerId == null || props.debtId == null) return
  loading.value = true
  try {
    const blob = await customersService.getDebtReceiptPdf(props.customerId, props.debtId, { download })
    const url = URL.createObjectURL(blob)
    if (download) {
      const link = document.createElement('a')
      link.href = url
      link.download = filename()
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('PDF baixado com sucesso')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao gerar comprovante')
  } finally {
    loading.value = false
  }
}

const shareReceiptPdf = async () => {
  if (props.customerId == null || props.debtId == null) return
  loading.value = true
  try {
    const blob = await customersService.getDebtReceiptPdf(props.customerId, props.debtId, { download: false })
    await shareFile(blob, filename(), shareTitle(), 'Comprovante de quitação (PDF)')
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      toast.error(e?.message || 'Erro ao gerar PDF para compartilhar')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.pay-debt-success {
  text-align: center;
}

.success-title {
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-2);
}

.success-text {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.receipt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  justify-content: center;
}

.action-icon {
  margin-right: var(--spacing-1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}
</style>
