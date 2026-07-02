<template>
  <div class="cashbook-section">
    <BaseCard class="filters-card">
      <div class="mode-row">
        <label class="radio-label">
          <input v-model="filterMode" type="radio" value="simple" />
          Data e período do dia
        </label>
        <label class="radio-label">
          <input v-model="filterMode" type="radio" value="range" />
          Intervalo customizado (data e hora)
        </label>
      </div>

      <div v-if="filterMode === 'simple'" class="filters-row">
        <BaseInput v-model="cashDate" type="date" label="Data" @change="onFiltersChange" />
        <BaseSelect
          v-model="periodFilter"
          :options="periodOptions"
          label="Período"
          placeholder="Período"
          @change="onFiltersChange"
        />
        <BaseButton variant="primary" :loading="loading" @click="loadCashbook">Atualizar</BaseButton>
        <BaseButton
          variant="secondary"
          :loading="pdfLoading"
          :disabled="loading"
          @click="exportCashbookPdf(false)"
        >
          Abrir PDF
        </BaseButton>
        <BaseButton
          variant="secondary"
          :loading="pdfLoading"
          :disabled="loading"
          @click="exportCashbookPdf(true)"
        >
          Baixar PDF
        </BaseButton>
        <BaseButton
          v-if="isShareSupported"
          variant="success"
          :disabled="loading || pdfLoading || isSharing"
          :loading="isSharing"
          @click="shareCashbookPdf"
        >
          <span v-if="!isSharing" class="share-icon">📤</span>
          {{ pdfLoading || isSharing ? 'Gerando...' : 'Compartilhar' }}
        </BaseButton>
      </div>

      <div v-else class="filters-row range-row">
        <BaseInput v-model="rangeStart" type="datetime-local" label="Início" @change="onFiltersChange" />
        <BaseInput v-model="rangeEnd" type="datetime-local" label="Fim" @change="onFiltersChange" />
        <BaseButton variant="primary" :loading="loading" @click="loadCashbook">Atualizar</BaseButton>
        <BaseButton
          variant="secondary"
          :loading="pdfLoading"
          :disabled="loading"
          @click="exportCashbookPdf(false)"
        >
          Abrir PDF
        </BaseButton>
        <BaseButton
          variant="secondary"
          :loading="pdfLoading"
          :disabled="loading"
          @click="exportCashbookPdf(true)"
        >
          Baixar PDF
        </BaseButton>
        <BaseButton
          v-if="isShareSupported"
          variant="success"
          :disabled="loading || pdfLoading || isSharing"
          :loading="isSharing"
          @click="shareCashbookPdf"
        >
          <span v-if="!isSharing" class="share-icon">📤</span>
          {{ pdfLoading || isSharing ? 'Gerando...' : 'Compartilhar' }}
        </BaseButton>
      </div>
      <div v-if="canPickSeller" class="seller-block">
        <BaseSelect
          v-model="sellerSelection"
          :options="sellerSelectOptions"
          label="Vendedor"
          placeholder="Todos os vendedores"
          @change="onFiltersChange"
        />
        <p class="seller-hint">
          Restringe aos lançamentos do vendedor escolhido ou às suas próprias vendas. Somente administrador e
          proprietário veem este filtro.
        </p>
      </div>
    </BaseCard>

    <BaseLoading :show="loading && !cashbook" message="Carregando livro-caixa..." variant="overlay" />

    <BaseCard v-if="errorMsg" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Não foi possível carregar o livro-caixa</h3>
          <p>{{ errorMsg }}</p>
          <BaseButton variant="secondary" @click="loadCashbook">Tentar novamente</BaseButton>
        </div>
      </div>
    </BaseCard>

    <template v-else-if="cashbook">
      <BaseCard v-if="sellerBanner" class="report-card full-width seller-filter-card">
        <p class="seller-filter-banner">
          <span class="seller-filter-label">Vendedor</span>
          <strong class="seller-filter-name">{{ sellerBanner.name }}</strong>
          <span v-if="sellerBanner.self" class="seller-self-pill">Você</span>
        </p>
      </BaseCard>

      <BaseCard v-if="periodBanner" class="report-card full-width period-banner-card">
        <p class="period-banner">
          <span class="period-banner-label">Período</span>
          <strong>{{ periodBanner }}</strong>
        </p>
      </BaseCard>

      <div class="reports-grid">
        <BaseCard title="Recebimentos por forma de pagamento" class="report-card full-width">
          <table class="payment-methods-table">
            <thead>
              <tr>
                <th>Forma</th>
                <th class="col-num">Pedidos (R$)</th>
                <th class="col-num">Pag. débito (R$)</th>
                <th class="col-num">Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paymentRows" :key="row.key">
                <td>{{ row.label }}</td>
                <td class="col-num">{{ formatCurrency(row.orders) }}</td>
                <td class="col-num">{{ formatCurrency(row.debtPayments) }}</td>
                <td class="col-num">{{ formatCurrency(row.total) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="payment-totals-row">
                <td><strong>Total</strong></td>
                <td class="col-num"><strong>{{ formatCurrency(paymentFooter.orders) }}</strong></td>
                <td class="col-num"><strong>{{ formatCurrency(paymentFooter.debtPayments) }}</strong></td>
                <td class="col-num"><strong>{{ formatCurrency(paymentFooter.total) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </BaseCard>

        <BaseCard :title="summaryTitle" class="report-card full-width">
          <div class="report-summary">
            <div class="summary-item highlight-row">
              <span class="summary-label" title="Entrada imediata no caixa (PIX + dinheiro)">Caixa (PIX + Dinheiro)</span>
              <span class="summary-value xl">{{ formatCurrency(suggestedIn) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label" title="Inclui cartão (recebimento registrado no período)">Total recebido</span>
              <span class="summary-value">{{ formatCurrency(cashReceivedTotal) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label" title="Vendas fiado do período — não entrou no caixa">À prazo (pedidos)</span>
              <span class="summary-value">{{ formatCurrency(aPrazoOrders) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label" title="Despesas lançadas">Saídas</span>
              <span class="summary-value negative">{{ formatCurrency(outflowsTotal) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label" :title="`Caixa efetivo − saídas`">Líquido {{ isFullDay ? 'do dia' : 'do período' }}</span>
              <span class="summary-value" :class="netSummaryClass">{{ formatCurrency(netVal) }}</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Recebido" class="report-card">
          <div class="report-summary">
            <div class="summary-item highlight-row gap-2">
              <span class="summary-label">Total efetivo recebido</span>
              <span class="summary-value xl">{{ formatCurrency(effectiveIn) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label" title="Valor usado no cálculo do líquido (manual ou sugestão)">
                Caixa {{ isFullDay ? 'do dia' : 'do período' }} (sugestão)
              </span>
              <span class="summary-value muted">{{ formatCurrency(suggestedIn) }}</span>
            </div>
          </div>
          <div v-if="isFullDay && manualChipVisible" class="manual-chips">
            <span class="chip chip-warn">Ajustado manualmente</span>
            <span v-if="entries?.manual_note" class="chip chip-note">Nota: {{ entries.manual_note }}</span>
            <span v-if="confirmedLabel" class="chip chip-muted">{{ confirmedLabel }}</span>
          </div>
          <p v-if="!isFullDay" class="partial-hint">
            Ajuste manual do total recebido está disponível apenas para o dia inteiro.
          </p>
          <div v-if="isFullDay" class="card-actions">
            <BaseButton variant="secondary" size="sm" @click="openAdjustModal">Corrigir total recebido</BaseButton>
          </div>
        </BaseCard>

        <BaseCard title="Saídas" class="report-card full-width">
          <div class="outflows-head">
            <span class="outflows-total">Total saídas: {{ formatCurrency(outflowsTotal) }}</span>
            <BaseButton variant="primary" size="sm" @click="openOutflowModal">Registrar saída</BaseButton>
          </div>
          <div v-if="!outflowItems.length" class="empty-inline">Nenhuma saída registrada neste período.</div>
          <table v-else class="outflows-table">
            <thead>
              <tr>
                <th>Valor</th>
                <th>Observação</th>
                <th>Quando</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in outflowItems" :key="row.id">
                <td>{{ formatCurrency(cashbookNum(row.amount)) }}</td>
                <td>{{ row.note || '—' }}</td>
                <td>{{ formatOutflowWhen(row.spent_at || row.created_at) }}</td>
                <td class="cell-actions">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    :loading="deletingId === row.id"
                    @click="removeOutflow(row.id)"
                  >
                    Excluir
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </BaseCard>
      </div>
    </template>

    <BaseCard v-else-if="!loading && active" class="hint-card">
      <p>Selecione o período e clique em Atualizar para carregar o livro-caixa.</p>
    </BaseCard>

    <BaseModal :show="showAdjustModal" title="Corrigir total recebido" size="md" @update:show="showAdjustModal = $event">
      <div class="modal-form">
        <BaseInput
          v-model.number="adjustForm.total"
          type="number"
          step="0.01"
          min="0"
          label="Total recebido (R$)"
        />
        <BaseInput v-model="adjustForm.note" type="text" label="Nota (opcional)" />
        <p class="modal-hint">Use “Voltar à sugestão” para remover o ajuste manual e voltar ao cálculo automático.</p>
      </div>
      <template #footer>
        <div class="modal-actions">
          <BaseButton variant="secondary" @click="showAdjustModal = false">Cancelar</BaseButton>
          <BaseButton variant="secondary" :loading="savingAdjust" @click="saveAdjustSuggestion">
            Voltar à sugestão
          </BaseButton>
          <BaseButton variant="primary" :loading="savingAdjust" @click="saveAdjustManual">Salvar</BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal :show="showOutflowModal" title="Registrar saída" size="md" @update:show="showOutflowModal = $event">
      <div class="modal-form">
        <BaseInput v-model.number="outflowForm.amount" type="number" step="0.01" min="0.01" label="Valor (R$) *" />
        <BaseInput v-model="outflowForm.note" type="text" label="Observação (opcional)" />
        <BaseInput v-model="outflowForm.spent_at" type="datetime-local" label="Data/hora da saída" />
      </div>
      <template #footer>
        <div class="modal-actions">
          <BaseButton variant="secondary" @click="showOutflowModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :loading="savingOutflow" :disabled="!outflowForm.amount" @click="submitOutflow">
            Registrar
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { reportsService } from '@/services/api/reports'
import { cashOutflowsService } from '@/services/api/cashOutflows'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import BaseModal from '@/components/Base/Modal.vue'
import { useFormatter } from '@/composables/useUtils'
import { useWebShare } from '@/composables/useWebShare'
import {
  buildPaymentMethodRows,
  cashbookNum,
  paymentMethodFooterTotals
} from '@/utils/cashbook'
import type { CashbookFilters, CashbookResponse, CashOutflow, User } from '@/types/api'

const props = withDefaults(
  defineProps<{
    active?: boolean
    canPickSeller: boolean
    sellerUsers: User[]
  }>(),
  { active: true, sellerUsers: () => [] }
)

const toast = useToast()
const { currency, date } = useFormatter()
const formatCurrency = currency
const { shareFile, isSupported: isShareSupported, isSharing } = useWebShare()

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const cashDate = ref(todayStr())
const filterMode = ref<'simple' | 'range'>('simple')
const periodFilter = ref<'manha' | 'tarde' | ''>('')
const periodOptions = [
  { value: '', label: 'Dia inteiro' },
  { value: 'manha', label: 'Manhã (06:00 – 11:00)' },
  { value: 'tarde', label: 'Tarde (12:00 – 17:00)' }
]

function defaultRangeInputs() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return {
    start: `${y}-${m}-${day}T06:00`,
    end: `${y}-${m}-${day}T23:59`
  }
}
const defaultRange = defaultRangeInputs()
const rangeStart = ref(defaultRange.start)
const rangeEnd = ref(defaultRange.end)

const sellerSelection = ref('')
const cashbook = ref<CashbookResponse | null>(null)
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const pdfLoading = ref(false)

const showAdjustModal = ref(false)
const adjustForm = ref({ total: 0 as number, note: '' })
const savingAdjust = ref(false)

const showOutflowModal = ref(false)
const outflowForm = ref({ amount: undefined as number | undefined, note: '', spent_at: '' })
const savingOutflow = ref(false)
const deletingId = ref<number | null>(null)

const sellerSelectOptions = computed(() => {
  const opts: { value: string; label: string }[] = [
    { value: '', label: 'Todos os vendedores' },
    { value: '__me__', label: 'Minhas vendas (eu)' }
  ]
  for (const u of props.sellerUsers) {
    opts.push({ value: String(u.id), label: u.name })
  }
  return opts
})

const entries = computed(() => cashbook.value?.entries)

const isFullDay = computed(
  () => filterMode.value === 'simple' && !periodFilter.value
)

const summaryTitle = computed(() => (isFullDay.value ? 'Resumo do dia' : 'Resumo do período'))

const periodBanner = computed(() => {
  const cb = cashbook.value
  if (!cb) return ''
  if (cb.range_label) return cb.range_label
  if (cb.period_label) return cb.period_label
  return ''
})

const paymentRows = computed(() => buildPaymentMethodRows(entries.value))
const paymentFooter = computed(() => paymentMethodFooterTotals(paymentRows.value))

const suggestedIn = computed(() => cashbookNum(entries.value?.suggested_total_received_day))
const cashReceivedTotal = computed(() => cashbookNum(entries.value?.cash_received_total))
const aPrazoOrders = computed(() => cashbookNum(entries.value?.orders_by_method?.a_prazo))
const effectiveIn = computed(() => cashbookNum(entries.value?.effective_received_total))

const outflowItems = computed<CashOutflow[]>(() => cashbook.value?.outflows?.items ?? [])
const outflowsTotal = computed(() => cashbookNum(cashbook.value?.outflows?.manual_total))

const netVal = computed(() => cashbookNum(cashbook.value?.net))

const netSummaryClass = computed(() => {
  if (netVal.value > 0) return 'positive'
  if (netVal.value < 0) return 'negative'
  return ''
})

const sellerBanner = computed(() => {
  const s = cashbook.value?.filters?.seller
  if (!s) return null
  if (!s.name && s.user_id == null && !s.self) return null
  return {
    name: s.name || (s.user_id != null ? `Vendedor #${s.user_id}` : 'Minhas vendas'),
    self: !!s.self
  }
})

const manualChipVisible = computed(() => {
  const e = entries.value
  if (!e) return false
  const manual = e.manual_received_total
  const hasManual =
    manual !== null &&
    manual !== undefined &&
    manual !== '' &&
    !(typeof manual === 'string' && !manual.trim())
  return !!(hasManual || (e.manual_note && String(e.manual_note).trim()) || e.confirmed_at)
})

const confirmedLabel = computed(() => {
  const e = entries.value
  if (!e?.confirmed_at) return ''
  const who = e.confirmed_by?.name || (e.confirmed_by?.id != null ? `#${e.confirmed_by.id}` : '')
  try {
    const d = new Date(e.confirmed_at)
    const ds = date(d)
    return who ? `Confirmado em ${ds} por ${who}` : `Confirmado em ${ds}`
  } catch {
    return ''
  }
})

function localDateTimeInput(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function spentAtToApi(local: string): string | undefined {
  if (!local) return undefined
  const s = local.length === 16 ? `${local}:00` : local
  const dt = new Date(s)
  if (Number.isNaN(dt.getTime())) return undefined
  return dt.toISOString()
}

function formatOutflowWhen(s?: string | null) {
  if (!s) return '—'
  try {
    return date(new Date(s))
  } catch {
    return s
  }
}

function toApiIsoDateTime(local: string): string {
  if (!local) return ''
  return local.length === 16 ? `${local}:00` : local
}

function buildCashbookParams(): CashbookFilters {
  const q: CashbookFilters = {}
  if (filterMode.value === 'range' && rangeStart.value && rangeEnd.value) {
    q.start_at = toApiIsoDateTime(rangeStart.value)
    q.end_at = toApiIsoDateTime(rangeEnd.value)
  } else {
    q.date = cashDate.value
    if (periodFilter.value) q.period = periodFilter.value
  }
  if (props.canPickSeller) {
    if (sellerSelection.value === '__me__') q.my_sales = true
    else if (sellerSelection.value && /^\d+$/.test(sellerSelection.value)) {
      q.seller_id = Number(sellerSelection.value)
    }
  }
  return q
}

function cashbookPdfFilename(serverFilename?: string | null): string {
  if (serverFilename) return serverFilename
  if (filterMode.value === 'range' && rangeStart.value && rangeEnd.value) {
    return `relatorio-financeiro-${rangeStart.value.replace(/[:]/g, '-')}.pdf`
  }
  const suffix = periodFilter.value ? `-${periodFilter.value}` : ''
  return `relatorio-financeiro-${cashDate.value}${suffix}.pdf`
}

function cashbookShareTitle(): string {
  return cashbook.value?.range_label || cashbook.value?.period_label || `Livro-caixa — ${cashDate.value}`
}

async function loadCashbook() {
  if (!props.active) return
  loading.value = true
  errorMsg.value = null
  try {
    cashbook.value = await reportsService.getCashbook(buildCashbookParams())
  } catch (e: any) {
    cashbook.value = null
    errorMsg.value = e?.message || 'Erro ao carregar livro-caixa'
    toast.error(errorMsg.value)
  } finally {
    loading.value = false
  }
}

function onFiltersChange() {
  if (props.active) loadCashbook()
}

const exportCashbookPdf = async (download: boolean) => {
  pdfLoading.value = true
  try {
    const { blob, filename } = await reportsService.getCashbookPdf(buildCashbookParams(), { download })
    const url = URL.createObjectURL(blob)
    const name = cashbookPdfFilename(filename)
    if (download) {
      const link = document.createElement('a')
      link.href = url
      link.download = name
      link.click()
      toast.success('PDF baixado com sucesso')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    URL.revokeObjectURL(url)
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao gerar PDF do livro-caixa')
  } finally {
    pdfLoading.value = false
  }
}

const shareCashbookPdf = async () => {
  pdfLoading.value = true
  try {
    const { blob, filename } = await reportsService.getCashbookPdf(buildCashbookParams(), { download: false })
    const title = cashbookShareTitle()
    await shareFile(blob, cashbookPdfFilename(filename), title, 'Relatório financeiro (PDF)')
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      toast.error(e?.message || 'Erro ao gerar PDF para compartilhar')
    }
  } finally {
    pdfLoading.value = false
  }
}

watch(
  () => props.active,
  (v) => {
    if (v) loadCashbook()
  },
  { immediate: true }
)

function defaultAdjustTotal(): number {
  const e = entries.value
  if (e?.manual_received_total != null && e.manual_received_total !== '') {
    return cashbookNum(e.manual_received_total)
  }
  const s = suggestedIn.value
  if (s > 0) return s
  return effectiveIn.value
}

function openAdjustModal() {
  adjustForm.value = {
    total: defaultAdjustTotal(),
    note: (entries.value?.manual_note as string) || ''
  }
  showAdjustModal.value = true
}

async function saveAdjustManual() {
  savingAdjust.value = true
  try {
    cashbook.value = await reportsService.putCashbook({
      date: cashDate.value,
      manual_received_total: Number(adjustForm.value.total),
      manual_note: adjustForm.value.note?.trim() || undefined
    })
    toast.success('Total recebido atualizado')
    showAdjustModal.value = false
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao salvar')
  } finally {
    savingAdjust.value = false
  }
}

async function saveAdjustSuggestion() {
  savingAdjust.value = true
  try {
    cashbook.value = await reportsService.putCashbook({
      date: cashDate.value,
      manual_received_total: null
    })
    toast.success('Voltou à sugestão automática')
    showAdjustModal.value = false
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao salvar')
  } finally {
    savingAdjust.value = false
  }
}

function openOutflowModal() {
  outflowForm.value = {
    amount: undefined,
    note: '',
    spent_at: localDateTimeInput()
  }
  showOutflowModal.value = true
}

async function submitOutflow() {
  const amt = outflowForm.value.amount
  if (!amt || amt <= 0) {
    toast.error('Informe um valor válido')
    return
  }
  savingOutflow.value = true
  try {
    await cashOutflowsService.create({
      amount: amt,
      note: outflowForm.value.note?.trim() || undefined,
      spent_at: spentAtToApi(outflowForm.value.spent_at)
    })
    toast.success('Saída registrada')
    showOutflowModal.value = false
    await loadCashbook()
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao registrar saída')
  } finally {
    savingOutflow.value = false
  }
}

async function removeOutflow(id: number) {
  if (!window.confirm('Excluir esta saída?')) return
  deletingId.value = id
  try {
    await cashOutflowsService.delete(id)
    toast.success('Saída removida')
    await loadCashbook()
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao excluir')
  } finally {
    deletingId.value = null
  }
}
</script>

<style lang="scss" scoped>
.cashbook-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-4);
}

.range-row {
  align-items: flex-end;
}

.seller-block {
  margin-top: var(--spacing-4);
  .seller-hint {
    margin: var(--spacing-2) 0 0;
    font-size: var(--font-size-sm);
    color: var(--gray-600);
  }
}

.error-card {
  border-color: var(--danger, #dc2626);
}

.error-content {
  display: flex;
  gap: var(--spacing-4);
  align-items: flex-start;
}

.reports-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-4);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.summary-item.highlight-row .summary-value.xl {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--primary-dark);
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.summary-value {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--primary-dark);

  &.positive {
    color: var(--success, #059669);
  }

  &.negative {
    color: var(--danger, #dc2626);
  }

  &.muted {
    color: var(--gray-600);
    font-weight: 500;
    font-size: var(--font-size-base);
  }
}

.payment-methods-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th,
  td {
    text-align: left;
    padding: var(--spacing-2) var(--spacing-3);
    border-bottom: 1px solid var(--gray-200);
  }

  th {
    color: var(--gray-600);
    font-weight: 600;
  }

  .col-num {
    text-align: right;
    white-space: nowrap;
  }

  tfoot .payment-totals-row td {
    border-top: 2px solid var(--gray-200);
    border-bottom: none;
    padding-top: var(--spacing-3);
  }
}

.manual-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.chip {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.chip-warn {
  background: var(--warning-light, #fef3c7);
  color: var(--warning-dark, #92400e);
}

.chip-note {
  background: var(--gray-100);
  color: var(--gray-800);
}

.chip-muted {
  background: var(--gray-50);
  color: var(--gray-600);
  font-weight: 500;
}

.card-actions {
  margin-top: var(--spacing-4);
}

.outflows-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.outflows-total {
  font-weight: 600;
  color: var(--primary-dark);
}

.empty-inline {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
}

.outflows-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th,
  td {
    text-align: left;
    padding: var(--spacing-2) var(--spacing-3);
    border-bottom: 1px solid var(--gray-200);
  }

  th {
    color: var(--gray-600);
    font-weight: 600;
  }

  .cell-actions {
    text-align: right;
    white-space: nowrap;
  }
}

.seller-filter-card {
  margin-bottom: 0;
}

.period-banner-card {
  margin-bottom: 0;
}

.period-banner {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
}

.period-banner-label {
  color: var(--gray-600);
}

.partial-hint {
  margin: var(--spacing-3) 0 0;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.seller-filter-banner {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
}

.seller-filter-label {
  color: var(--gray-600);
}

.seller-filter-name {
  color: var(--primary-dark);
}

.seller-self-pill {
  background: var(--primary);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.hint-card p {
  margin: 0;
  color: var(--gray-600);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.modal-hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--spacing-2);
}
</style>
