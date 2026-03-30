<template>
  <div class="daily-products-section">
    <BaseCard class="filters-card">
      <div class="mode-row">
        <label class="radio-label">
          <input v-model="productsMode" type="radio" value="simple" />
          Data e período do dia
        </label>
        <label class="radio-label">
          <input v-model="productsMode" type="radio" value="range" />
          Intervalo customizado (data e hora)
        </label>
      </div>

      <div v-if="productsMode === 'simple'" class="products-filters-grid">
        <BaseInput
          v-model="productsDateFilter"
          type="date"
          @change="loadDailyProducts"
        />
        <BaseSelect
          v-model="productsPeriodFilter"
          :options="periodOptions"
          placeholder="Período"
          @change="loadDailyProducts"
        />
        <div class="products-filters-actions">
          <BaseButton variant="secondary" :disabled="isExportingPdf" @click="exportDailyProductsPdf(false)">
            {{ isExportingPdf ? 'Gerando...' : 'Ver PDF' }}
          </BaseButton>
          <BaseButton variant="primary" :disabled="isExportingPdf" @click="exportDailyProductsPdf(true)">
            {{ isExportingPdf ? 'Gerando...' : 'Baixar PDF' }}
          </BaseButton>
          <BaseButton
            v-if="isShareSupported"
            variant="success"
            :disabled="isExportingPdf || isSharing"
            :loading="isSharing"
            @click="shareDailyProductsPdf"
          >
            <span v-if="!isSharing" class="share-icon">📤</span>
            {{ isExportingPdf || isSharing ? 'Gerando...' : 'Compartilhar' }}
          </BaseButton>
        </div>
      </div>

      <div v-else class="products-filters-grid range-grid">
        <BaseInput v-model="rangeStart" type="datetime-local" label="Início" @change="loadDailyProducts" />
        <BaseInput v-model="rangeEnd" type="datetime-local" label="Fim" @change="loadDailyProducts" />
        <div class="products-filters-actions">
          <BaseButton variant="secondary" :disabled="isExportingPdf" @click="exportDailyProductsPdf(false)">
            {{ isExportingPdf ? 'Gerando...' : 'Ver PDF' }}
          </BaseButton>
          <BaseButton variant="primary" :disabled="isExportingPdf" @click="exportDailyProductsPdf(true)">
            {{ isExportingPdf ? 'Gerando...' : 'Baixar PDF' }}
          </BaseButton>
          <BaseButton
            v-if="isShareSupported"
            variant="success"
            :disabled="isExportingPdf || isSharing"
            :loading="isSharing"
            @click="shareDailyProductsPdf"
          >
            <span v-if="!isSharing" class="share-icon">📤</span>
            {{ isExportingPdf || isSharing ? 'Gerando...' : 'Compartilhar' }}
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseLoading
      v-if="isLoadingProducts"
      message="Carregando produtos vendidos..."
      :show="isLoadingProducts"
      variant="overlay"
    />

    <BaseCard v-if="productsError" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao carregar produtos vendidos</h3>
          <p>{{ productsError }}</p>
          <BaseButton variant="secondary" @click="loadDailyProducts">Tentar novamente</BaseButton>
        </div>
      </div>
    </BaseCard>

    <div v-else-if="dailyProducts" class="products-sold-content">
      <BaseCard class="summary-card">
        <div class="summary-grid">
          <div v-if="dailyProducts.range_label" class="summary-item full">
            <div class="summary-label">Período</div>
            <div class="summary-value">{{ dailyProducts.range_label }}</div>
          </div>
          <div v-else class="summary-item">
            <div class="summary-label">Data</div>
            <div class="summary-value">{{ formatDate(dailyProducts.date) }}</div>
          </div>
          <div v-if="dailyProducts.period_label" class="summary-item">
            <div class="summary-label">Período</div>
            <div class="summary-value">{{ dailyProducts.period_label }}</div>
          </div>
          <div v-if="dailyProducts.time_range" class="summary-item">
            <div class="summary-label">Horário</div>
            <div class="summary-value">{{ dailyProducts.time_range.start }} - {{ dailyProducts.time_range.end }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total de Pedidos</div>
            <div class="summary-value highlight">{{ dailyProducts.total_orders }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total de Produtos Vendidos</div>
            <div class="summary-value highlight">{{ dailyProducts.total_products_sold }}</div>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="products-list-card">
        <h3 class="products-list-title">Produtos Vendidos</h3>
        <div v-if="dailyProducts.products.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>Nenhum produto vendido</h3>
          <p>Não há produtos vendidos no período selecionado</p>
        </div>
        <div v-else class="products-table">
          <div class="products-table-header">
            <div class="table-col col-product">Produto</div>
            <div class="table-col col-sku">SKU</div>
            <div class="table-col col-quantity">Quantidade</div>
            <div class="table-col col-price">Preço Unitário</div>
            <div class="table-col col-total">Total</div>
          </div>
          <div
            v-for="product in dailyProducts.products"
            :key="product.product_id"
            class="products-table-row"
          >
            <div class="table-col col-product"><strong>{{ product.name }}</strong></div>
            <div class="table-col col-sku">{{ product.sku || '-' }}</div>
            <div class="table-col col-quantity"><span class="quantity-badge">{{ product.quantity_sold }}</span></div>
            <div class="table-col col-price">{{ formatCurrency(product.unit_price) }}</div>
            <div class="table-col col-total"><strong>{{ formatCurrency(product.total_revenue) }}</strong></div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useFormatter } from '@/composables/useUtils'
import { useWebShare } from '@/composables/useWebShare'
import { reportsService } from '@/services/api/reports'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import type { DailyProductsResponse } from '@/types/api'

const { currency, date } = useFormatter()
const formatCurrency = currency
const formatDate = (dateString: string) => date(new Date(dateString))
const toast = useToast()
const { shareFile, isSupported: isShareSupported, isSharing } = useWebShare()

const productsMode = ref<'simple' | 'range'>('simple')
const dailyProducts = ref<DailyProductsResponse | null>(null)
const isLoadingProducts = ref(false)
const isExportingPdf = ref(false)
const productsError = ref<string | null>(null)
const productsDateFilter = ref<string>(new Date().toISOString().split('T')[0])
const productsPeriodFilter = ref<'manha' | 'tarde' | ''>('')

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
const r = defaultRangeInputs()
const rangeStart = ref(r.start)
const rangeEnd = ref(r.end)

const periodOptions = [
  { value: '', label: 'Dia Inteiro' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' }
]

function toApiDateTime(local: string): string {
  if (!local) return ''
  const s = local.length === 16 ? `${local}:00` : local
  return s.includes('T') ? s.replace('T', ' ') : s
}

function getRequestOptions() {
  if (productsMode.value === 'range' && rangeStart.value && rangeEnd.value) {
    return {
      start_at: toApiDateTime(rangeStart.value),
      end_at: toApiDateTime(rangeEnd.value)
    }
  }
  const o: { date?: string; period?: 'manha' | 'tarde' } = {}
  if (productsDateFilter.value) o.date = productsDateFilter.value
  if (productsPeriodFilter.value) o.period = productsPeriodFilter.value as 'manha' | 'tarde'
  return o
}

const loadDailyProducts = async () => {
  isLoadingProducts.value = true
  productsError.value = null
  try {
    dailyProducts.value = await reportsService.getDailyProducts(getRequestOptions())
  } catch (err: any) {
    productsError.value = err?.message || 'Erro ao carregar produtos vendidos'
    console.error(err)
  } finally {
    isLoadingProducts.value = false
  }
}

function getDailyProductsPdfOptions() {
  return getRequestOptions() as Record<string, string | undefined>
}

function getDailyProductsPdfFilename() {
  if (productsMode.value === 'range' && rangeStart.value && rangeEnd.value) {
    return `produtos-vendidos-${rangeStart.value.replace(/[:]/g, '-')}.pdf`
  }
  const opts = getDailyProductsPdfOptions()
  return `produtos-vendidos-${opts.date || 'hoje'}${opts.period ? `-${opts.period}` : ''}.pdf`
}

const exportDailyProductsPdf = async (download: boolean) => {
  isExportingPdf.value = true
  try {
    const options: any = { ...getDailyProductsPdfOptions() }
    if (download) options.download = true
    const blob = await reportsService.getDailyProductsPdf(options)
    const url = URL.createObjectURL(blob)
    if (download) {
      const link = document.createElement('a')
      link.href = url
      link.download = getDailyProductsPdfFilename()
      link.click()
      toast.success('PDF baixado com sucesso')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    URL.revokeObjectURL(url)
  } catch (err: any) {
    toast.error(err?.message || 'Erro ao gerar PDF')
  } finally {
    isExportingPdf.value = false
  }
}

const shareDailyProductsPdf = async () => {
  isExportingPdf.value = true
  try {
    const blob = await reportsService.getDailyProductsPdf(getDailyProductsPdfOptions())
    const title =
      dailyProducts.value?.range_label ||
      `Produtos vendidos - ${productsDateFilter.value ? formatDate(productsDateFilter.value) : 'hoje'}`
    await shareFile(blob, getDailyProductsPdfFilename(), title, 'Relatório de produtos vendidos')
  } catch (err: any) {
    if (err?.name !== 'AbortError') toast.error(err?.message || 'Erro ao compartilhar PDF')
  } finally {
    isExportingPdf.value = false
  }
}

onMounted(() => {
  loadDailyProducts()
})
</script>

<style lang="scss" scoped>
.daily-products-section {
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
  .filters-card {
    margin-bottom: var(--spacing-6);
  }
  .products-filters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: var(--spacing-4);
    height: max-content;
    align-items: end;
  }
  .range-grid {
    grid-template-columns: 1fr 1fr auto;
  }
  .products-filters-actions {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    align-items: center;
  }
  .error-card {
    margin-bottom: var(--spacing-6);
  }
  .error-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    .error-icon {
      font-size: var(--font-size-2xl);
    }
    h3 {
      margin: 0 0 var(--spacing-2) 0;
      color: var(--danger);
    }
    p {
      margin: 0 0 var(--spacing-3) 0;
      color: var(--gray-600);
    }
  }
  .summary-card {
    margin-bottom: var(--spacing-6);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-4);
  }
  .summary-item.full {
    grid-column: 1 / -1;
  }
  .summary-label {
    font-size: var(--font-size-sm);
    color: var(--gray-600);
  }
  .summary-value {
    font-weight: 600;
    &.highlight {
      color: var(--primary);
      font-size: var(--font-size-lg);
    }
  }
  .products-list-title {
    margin: 0 0 var(--spacing-4) 0;
  }
  .empty-state {
    text-align: center;
    padding: var(--spacing-8);
  }
  .products-table-header,
  .products-table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 0.8fr 1fr 1fr;
    gap: var(--spacing-2);
    padding: var(--spacing-2) 0;
    align-items: center;
  }
  .products-table-header {
    font-weight: 600;
    border-bottom: 2px solid var(--gray-200);
    font-size: var(--font-size-sm);
  }
  .products-table-row {
    border-bottom: 1px solid var(--gray-100);
  }
  .quantity-badge {
    background: var(--primary-light);
    color: white;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
  }
  @media (max-width: 768px) {
    .products-filters-grid,
    .range-grid {
      grid-template-columns: 1fr;
    }
    .products-table-header,
    .products-table-row {
      grid-template-columns: 1fr;
      gap: var(--spacing-1);
    }
  }
}
</style>
