<template>
  <div class="cashbook-section">
    <BaseCard class="filters-card">
      <div class="filters-row">
        <BaseInput v-model="cashDate" type="date" label="Data" @change="onFiltersChange" />
        <BaseButton variant="primary" :loading="loading" @click="loadCashbook">Atualizar</BaseButton>
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

      <div class="reports-grid">
        <BaseCard title="Recebido" class="report-card">
          <div class="report-summary">
            <div class="summary-item highlight-row gap-2">
              <span class="summary-label">Total efetivo recebido</span>
              <span class="summary-value xl">{{ formatCurrency(effectiveIn) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Pedidos (PIX + dinheiro)</span>
              <span class="summary-value">{{ formatCurrency(ordersIn) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Quitações à vista (PIX + dinheiro)</span>
              <span class="summary-value">{{ formatCurrency(debtPayIn) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Sugestão do sistema (dia)</span>
              <span class="summary-value">{{ formatCurrency(suggestedIn) }}</span>
            </div>
          </div>
          <div v-if="manualChipVisible" class="manual-chips">
            <span class="chip chip-warn">Ajustado manualmente</span>
            <span v-if="entries?.manual_note" class="chip chip-note">Nota: {{ entries.manual_note }}</span>
            <span v-if="confirmedLabel" class="chip chip-muted">{{ confirmedLabel }}</span>
          </div>
          <div class="card-actions">
            <BaseButton variant="secondary" size="sm" @click="openAdjustModal">Corrigir total recebido</BaseButton>
          </div>
        </BaseCard>

        <BaseCard title="Saídas" class="report-card full-width">
          <div class="outflows-head">
            <span class="outflows-total">Total saídas: {{ formatCurrency(outflowsTotal) }}</span>
            <BaseButton variant="primary" size="sm" @click="openOutflowModal">Registrar saída</BaseButton>
          </div>
          <div v-if="!outflowItems.length" class="empty-inline">Nenhuma saída registrada neste dia.</div>
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
                <td>{{ formatCurrency(num(row.amount)) }}</td>
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

        <BaseCard title="Resultado do dia" class="report-card">
          <div class="net-block" :class="netClass">
            <span class="net-label">Líquido (recebido − saídas)</span>
            <span class="net-value">{{ formatCurrency(netVal) }}</span>
          </div>
        </BaseCard>
      </div>
    </template>

    <BaseCard v-else-if="!loading && active" class="hint-card">
      <p>Selecione a data e clique em Atualizar para carregar o livro-caixa.</p>
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
import type { CashbookResponse, CashOutflow, User } from '@/types/api'

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

function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const cashDate = ref(todayStr())
const sellerSelection = ref('')
const cashbook = ref<CashbookResponse | null>(null)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

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

const ordersIn = computed(() => num(entries.value?.orders_pix_dinheiro_in))
const debtPayIn = computed(() => num(entries.value?.debt_payments_pix_dinheiro_in))
const suggestedIn = computed(() => num(entries.value?.suggested_total_received_day))
const effectiveIn = computed(() => num(entries.value?.effective_received_total))

const outflowItems = computed<CashOutflow[]>(() => cashbook.value?.outflows?.items ?? [])
const outflowsTotal = computed(() => num(cashbook.value?.outflows?.manual_total))

const netVal = computed(() => num(cashbook.value?.net))

const netClass = computed(() => {
  if (netVal.value > 0) return 'net-pos'
  if (netVal.value < 0) return 'net-neg'
  return 'net-zero'
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

function buildCashbookParams(): { date: string; my_sales?: boolean; seller_id?: number } {
  const q: { date: string; my_sales?: boolean; seller_id?: number } = { date: cashDate.value }
  if (props.canPickSeller) {
    if (sellerSelection.value === '__me__') q.my_sales = true
    else if (sellerSelection.value && /^\d+$/.test(sellerSelection.value)) {
      q.seller_id = Number(sellerSelection.value)
    }
  }
  return q
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
    return num(e.manual_received_total)
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

.filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-4);
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

.summary-item {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.report-summary .summary-item.highlight-row .summary-value.xl {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--primary-dark);
}

.summary-item.full {
  grid-column: 1 / -1;
}

.summary-value.muted {
  color: var(--gray-600);
  font-weight: 400;
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

.net-block {
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);

  &.net-pos {
    background: var(--success-light, #d1fae5);
    .net-value {
      color: var(--success-dark, #065f46);
    }
  }

  &.net-neg {
    background: #fee2e2;
    .net-value {
      color: #991b1b;
    }
  }

  &.net-zero {
    background: var(--gray-50);
    .net-value {
      color: var(--gray-800);
    }
  }
}

.net-label {
  font-size: var(--font-size-sm);
  color: var(--gray-700);
}

.net-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.seller-filter-card {
  margin-bottom: 0;
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
