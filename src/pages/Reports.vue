<template>
  <div class="reports-hub">
    <div class="reports-header">
      <div>
        <h2>Relatórios</h2>
        <p class="reports-subtitle">Central de análises e exportações</p>
      </div>
      <div class="header-links">
        <router-link class="link-btn" to="/customer-reports">Relatório por cliente</router-link>
      </div>
    </div>

    <div class="hub-tabs">
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeSection === 'sales' }"
        @click="setSection('sales')"
      >
        Vendas
      </button>
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeSection === 'products' }"
        @click="setSection('products')"
      >
        Produtos vendidos
      </button>
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeSection === 'credit' }"
        @click="setSection('credit')"
      >
        Crédito à prazo
      </button>
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeSection === 'cashbook' }"
        @click="setSection('cashbook')"
      >
        Livro-caixa
      </button>
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeSection === 'more' }"
        @click="setSection('more')"
      >
        Outros relatórios
      </button>
    </div>

    <!-- Vendas -->
    <div v-show="activeSection === 'sales'" class="section-panel">
      <BaseCard class="filters-card">
        <div class="sales-filter-mode">
          <label class="radio-label">
            <input v-model="salesFilterMode" type="radio" value="preset" />
            Período pré-definido
          </label>
          <label class="radio-label">
            <input v-model="salesFilterMode" type="radio" value="dates" />
            Datas personalizadas
          </label>
        </div>
        <div v-if="salesFilterMode === 'preset'" class="filters-row sales-filters-row">
          <BaseSelect v-model="salesPeriodPreset" :options="salesPresetOptions" label="Período" />
          <BaseSelect
            v-model="salesStatusFilter"
            :options="salesStatusFilterOptions"
            label="Status do pedido"
            placeholder="Todos os status"
          />
        </div>
        <div v-else class="filters-row date-row sales-filters-row">
          <BaseInput v-model="salesStartDate" type="date" label="Data inicial" />
          <BaseInput v-model="salesEndDate" type="date" label="Data final" />
          <BaseSelect
            v-model="salesStatusFilter"
            :options="salesStatusFilterOptions"
            label="Status do pedido"
            placeholder="Todos os status"
          />
        </div>
        <div v-if="canPickSeller" class="sales-seller-block">
          <div class="filters-row sales-seller-row">
            <BaseSelect
              v-model="salesSellerSelection"
              :options="salesSellerSelectOptions"
              label="Vendedor"
              placeholder="Todos os vendedores"
            />
          </div>
          <p class="sales-seller-hint">
            Restringe aos pedidos do vendedor escolhido ou às suas próprias vendas. Somente administrador e
            proprietário veem este filtro.
          </p>
        </div>
        <div class="filters-row sales-actions-row">
          <BaseButton variant="primary" :loading="isLoading" @click="generateSales">Gerar relatório</BaseButton>
          <BaseButton
            variant="secondary"
            :loading="salesPdfLoading"
            :disabled="isLoading || isSharing"
            @click="exportSalesPdf(false)"
          >
            Abrir PDF
          </BaseButton>
          <BaseButton
            variant="secondary"
            :loading="salesPdfLoading"
            :disabled="isLoading || isSharing"
            @click="exportSalesPdf(true)"
          >
            Baixar PDF
          </BaseButton>
          <BaseButton
            v-if="isShareSupported"
            variant="success"
            :disabled="isLoading || salesPdfLoading || isSharing"
            :loading="isSharing"
            @click="shareSalesPdf"
          >
            <span v-if="!isSharing" class="share-icon">📤</span>
            {{ salesPdfLoading || isSharing ? 'Gerando...' : 'Compartilhar' }}
          </BaseButton>
        </div>
      </BaseCard>

      <BaseLoading :show="isLoading" message="Gerando relatório..." variant="overlay" />

      <BaseCard v-if="error" class="error-card">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <div>
            <h3>Erro</h3>
            <p>{{ error }}</p>
            <BaseButton variant="secondary" @click="generateSales">Tentar novamente</BaseButton>
          </div>
        </div>
      </BaseCard>

      <div v-else-if="salesReport" class="reports-grid">
        <BaseCard v-if="salesReport.period_preset_label" class="report-card full-width">
          <p class="preset-banner">{{ salesReport.period_preset_label }}</p>
        </BaseCard>
        <BaseCard v-if="salesReport.seller_filter" class="report-card full-width seller-filter-card">
          <p class="seller-filter-banner">
            <span class="seller-filter-label">Vendedor</span>
            <strong class="seller-filter-name">{{ salesReport.seller_filter.name }}</strong>
            <span v-if="salesReport.seller_filter.self" class="seller-self-pill">Você</span>
          </p>
        </BaseCard>
        <BaseCard title="Resumo do período" class="report-card">
          <div class="report-summary">
            <div class="summary-item">
              <span class="summary-label">Total de pedidos</span>
              <span class="summary-value">{{ salesReport.summary.total_orders }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Faturamento total</span>
              <span class="summary-value">{{ formatCurrency(salesReport.summary.total_sales) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Ticket médio</span>
              <span class="summary-value">{{ formatCurrency(salesReport.summary.average_order_value) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Intervalo</span>
              <span class="summary-value">
                {{ formatDate(salesReport.period.start_date) }} – {{ formatDate(salesReport.period.end_date) }}
              </span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Vendas por status" class="report-card">
          <div class="status-grid">
            <div
              v-for="(data, status) in salesReport.orders_by_status"
              :key="String(status)"
              class="status-item"
            >
              <span class="status-label">{{ getStatusLabel(String(status)) }}</span>
              <span class="status-value">{{ data.count }} ({{ formatCurrency(data.total) }})</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Produtos mais vendidos" class="report-card full-width">
          <div class="top-products">
            <div
              v-for="(product, index) in salesReport.top_products"
              :key="product.id"
              class="product-item"
            >
              <div class="product-rank">{{ index + 1 }}</div>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-stats">
                  {{ product.total_quantity }} vendidos · {{ formatCurrency(product.total_revenue) }}
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard
          v-if="salesReport.sales?.length"
          title="Detalhe por item vendido"
          class="report-card full-width"
        >
          <p class="sales-lines-hint">
            Uma linha por item de pedido (cliente, produto, valor da linha, data/hora do pedido).
          </p>
          <div class="sales-lines-scroll">
            <div class="sales-lines-table">
              <div class="sales-lines-head">
                <span>Cliente</span>
                <span>Produto</span>
                <span>Valor</span>
                <span>Data da venda</span>
              </div>
              <div v-for="(row, i) in salesReport.sales" :key="i" class="sales-lines-row">
                <span>{{ row.customer_name }}</span>
                <span class="sales-line-product" :title="row.product_name">{{ row.product_name }}</span>
                <span>{{ formatCurrency(Number(row.amount) || 0) }}</span>
                <span>{{ formatShortDate(row.sold_at) }}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="salesReport.daily_sales?.length" title="Vendas diárias" class="report-card full-width">
          <div class="chart-container">
            <canvas ref="chartCanvas" width="800" height="400"></canvas>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Produtos vendidos -->
    <div v-show="activeSection === 'products'" class="section-panel">
      <ReportsDailyProductsSection />
    </div>

    <!-- Livro-caixa -->
    <div v-show="activeSection === 'cashbook'" class="section-panel">
      <ReportsCashbookSection
        :active="activeSection === 'cashbook'"
        :can-pick-seller="canPickSeller"
        :seller-users="sellerUsers"
      />
    </div>

    <!-- Crédito à prazo -->
    <div v-show="activeSection === 'credit'" class="section-panel">
      <BaseCard class="filters-card credit-pdf-card">
        <h3 class="section-title">PDF — Clientes com saldo em aberto</h3>
        <p class="hint credit-pdf-hint">
          Clientes ativos com saldo na conta à prazo (cadastro): nome, contato, saldo e último débito no histórico.
          Independe do período abaixo.
        </p>
        <div class="filters-row sales-actions-row">
          <BaseButton
            variant="secondary"
            :loading="creditDelinquentPdfLoading"
            :disabled="creditLoading || isSharing"
            @click="exportCreditDelinquentPdf(false)"
          >
            Abrir PDF
          </BaseButton>
          <BaseButton
            variant="secondary"
            :loading="creditDelinquentPdfLoading"
            :disabled="creditLoading || isSharing"
            @click="exportCreditDelinquentPdf(true)"
          >
            Baixar PDF
          </BaseButton>
          <BaseButton
            v-if="isShareSupported"
            variant="success"
            :disabled="creditLoading || creditDelinquentPdfLoading || isSharing"
            :loading="isSharing"
            @click="shareCreditDelinquentPdf"
          >
            <span v-if="!isSharing" class="share-icon">📤</span>
            {{ creditDelinquentPdfLoading || isSharing ? 'Gerando...' : 'Compartilhar' }}
          </BaseButton>
        </div>
      </BaseCard>

      <BaseCard class="filters-card">
        <h3 class="section-title">Pedidos à prazo no período</h3>
        <p class="hint">Lista pedidos com débito em aberto no intervalo (crédito à prazo).</p>
        <div class="filters-row date-row">
          <BaseInput v-model="creditStart" type="datetime-local" label="Início" />
          <BaseInput v-model="creditEnd" type="datetime-local" label="Fim" />
          <BaseButton
            variant="primary"
            :loading="creditLoading"
            :disabled="creditDelinquentPdfLoading"
            @click="loadCreditSales(1)"
          >
            Buscar
          </BaseButton>
        </div>
      </BaseCard>

      <BaseLoading :show="creditLoading" message="Carregando..." variant="overlay" />

      <BaseCard v-if="creditError" class="error-card">
        <p>{{ creditError }}</p>
        <BaseButton variant="secondary" @click="loadCreditSales(creditPage)">Tentar novamente</BaseButton>
      </BaseCard>

      <template v-else-if="creditData">
        <BaseCard class="report-card full-width">
          <div class="report-summary">
            <div class="summary-item">
              <span class="summary-label">Pedidos com saldo</span>
              <span class="summary-value">{{ creditData.summary.orders_count }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total em aberto</span>
              <span class="summary-value">{{ formatCurrency(Number(creditData.summary.total_debt_amount) || 0) }}</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Pedidos" class="report-card full-width">
          <div v-if="!creditOrders.length" class="empty-inline">Nenhum pedido no período.</div>
          <div v-else class="credit-table">
            <div class="credit-table-head">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Débito</span>
              <span>Data</span>
            </div>
            <div v-for="order in creditOrders" :key="order.id" class="credit-table-row">
              <span>{{ order.order_number }}</span>
              <span>{{ order.customer?.name || '—' }}</span>
              <span>{{ formatCurrency(Number(order.debt_amount) || 0) }}</span>
              <span>{{ formatShortDate(order.created_at) }}</span>
            </div>
          </div>
          <div v-if="creditLastPage > 1" class="pagination-bar">
            <BaseButton
              variant="secondary"
              size="sm"
              :disabled="creditPage <= 1 || creditLoading"
              @click="loadCreditSales(creditPage - 1)"
            >
              Anterior
            </BaseButton>
            <span class="page-info">Página {{ creditPage }} de {{ creditLastPage }}</span>
            <BaseButton
              variant="secondary"
              size="sm"
              :disabled="creditPage >= creditLastPage || creditLoading"
              @click="loadCreditSales(creditPage + 1)"
            >
              Próxima
            </BaseButton>
          </div>
        </BaseCard>
      </template>
    </div>

    <!-- Outros -->
    <div v-show="activeSection === 'more'" class="section-panel">
      <BaseCard class="filters-card">
        <h3 class="section-title">Relatórios agregados</h3>
        <p class="hint">Escolha o tipo e o período (quando aplicável).</p>
        <div class="filters-row">
          <BaseSelect v-model="moreReportType" :options="moreTypeOptions" label="Tipo" />
        </div>
        <div v-if="moreReportType === 'financial'" class="filters-row date-row">
          <BaseInput v-model="moreStart" type="date" label="Início" />
          <BaseInput v-model="moreEnd" type="date" label="Fim" />
        </div>
        <BaseButton variant="primary" :loading="moreLoading" @click="generateMoreReport">Gerar</BaseButton>
      </BaseCard>

      <BaseLoading :show="moreLoading" message="Carregando..." variant="overlay" />

      <div v-if="financialReport && moreReportType === 'financial'" class="reports-grid">
        <BaseCard title="Resumo financeiro" class="report-card full-width">
          <div class="report-summary">
            <div class="summary-item">
              <span class="summary-label">Receita</span>
              <span class="summary-value positive">{{ formatCurrency(financialReport.summary.total_revenue) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Custos</span>
              <span class="summary-value negative">{{ formatCurrency(financialReport.summary.total_costs) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Lucro</span>
              <span class="summary-value" :class="financialReport.summary.profit >= 0 ? 'positive' : 'negative'">
                {{ formatCurrency(financialReport.summary.profit) }}
              </span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-if="customersReport && moreReportType === 'customers'" class="reports-grid">
        <BaseCard title="Clientes" class="report-card full-width">
          <div class="report-summary">
            <div class="summary-item">
              <span class="summary-label">Total</span>
              <span class="summary-value">{{ customersReport.summary.total_customers }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Ativos</span>
              <span class="summary-value">{{ customersReport.summary.active_customers }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-if="productsReport && moreReportType === 'products'" class="reports-grid">
        <BaseCard title="Produtos (estoque)" class="report-card full-width">
          <div class="report-summary">
            <div class="summary-item">
              <span class="summary-label">Total de produtos</span>
              <span class="summary-value">{{ productsReport.summary.total_products }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Ativos</span>
              <span class="summary-value">{{ productsReport.summary.active_products }}</span>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useReports } from '@/composables/useReports'
import { useAuth } from '@/composables/useAuth'
import { useFormatter } from '@/composables/useUtils'
import { useWebShare } from '@/composables/useWebShare'
import { reportsService } from '@/services/api/reports'
import { usersService } from '@/services/api/users'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import ReportsDailyProductsSection from '@/components/Reports/ReportsDailyProductsSection.vue'
import ReportsCashbookSection from '@/components/Reports/ReportsCashbookSection.vue'
import type { SalesReportPeriodPreset, CreditSalesResponse, Order, ReportFilters, User } from '@/types/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user: authUser } = useAuth()

const {
  salesReport,
  financialReport,
  customersReport,
  productsReport,
  isLoading,
  error,
  getSalesReport,
  getFinancialReport,
  getCustomersReport,
  getProductsReport
} = useReports()

const { currency, date } = useFormatter()
const { shareFile, isSupported: isShareSupported, isSharing } = useWebShare()
const formatCurrency = currency
const formatDate = (dateString: string) => date(new Date(dateString))
const formatShortDate = (s: string) => {
  try {
    return new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return s
  }
}

type HubSection = 'sales' | 'products' | 'credit' | 'cashbook' | 'more'
const activeSection = ref<HubSection>('sales')

const salesFilterMode = ref<'preset' | 'dates'>('preset')
const salesPeriodPreset = ref<SalesReportPeriodPreset>('last_week')
const salesPresetOptions = [
  { value: 'last_week', label: 'Última semana' },
  { value: 'last_15_days', label: 'Últimos 15 dias' },
  { value: 'last_month', label: 'Último mês' },
  { value: 'last_quarter', label: 'Último trimestre' }
]

const today = new Date()
const salesStartDate = ref(
  new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]
)
const salesEndDate = ref(today.toISOString().split('T')[0])

const salesStatusFilter = ref<string>('')
const salesStatusFilterOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Processando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
]

const salesPdfLoading = ref(false)

/** Admin e proprietário: podem filtrar relatório por vendedor (seller_id / my_sales) */
const canPickSeller = computed(() => {
  const r =
    authUser.value?.role ??
    (typeof localStorage !== 'undefined' ? localStorage.getItem('user_role') : null)
  return r === 'admin' || r === 'tenant_owner'
})

const sellerUsers = ref<User[]>([])
const salesSellerSelection = ref<string>('')

const salesSellerSelectOptions = computed(() => {
  const opts: { value: string; label: string }[] = [
    { value: '', label: 'Todos os vendedores' },
    { value: '__me__', label: 'Minhas vendas (eu)' }
  ]
  for (const u of sellerUsers.value) {
    opts.push({ value: String(u.id), label: u.name })
  }
  return opts
})

async function loadSellerUsersForReports() {
  if (!canPickSeller.value) return
  try {
    const res = await usersService.list({ per_page: 200, page: 1 })
    const data = res.data ?? []
    sellerUsers.value = data.filter((u) => u.is_active !== false && u.role !== 'client')
  } catch {
    sellerUsers.value = []
  }
}

const chartCanvas = ref<HTMLCanvasElement>()

function defaultCreditRange() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return {
    start: `${y}-${m}-${day}T00:00`,
    end: `${y}-${m}-${day}T23:59`
  }
}
const cr = defaultCreditRange()
const creditStart = ref(cr.start)
const creditEnd = ref(cr.end)
const creditData = ref<CreditSalesResponse | null>(null)
const creditLoading = ref(false)
const creditError = ref<string | null>(null)
const creditPage = ref(1)
const creditDelinquentPdfLoading = ref(false)

const creditOrders = computed<Order[]>(() => {
  const o = creditData.value?.orders
  if (!o) return []
  return Array.isArray(o) ? o : (o as any).data || []
})

const creditLastPage = computed(() => {
  const o = creditData.value?.orders as any
  if (!o) return 1
  return o.last_page ?? 1
})

function toApiDateTime(local: string): string {
  if (!local) return ''
  const s = local.length === 16 ? `${local}:00` : local
  return s.includes('T') ? s.replace('T', ' ') : s
}

const loadCreditSales = async (page: number) => {
  creditPage.value = page
  creditLoading.value = true
  creditError.value = null
  try {
    creditData.value = await reportsService.getCreditSales({
      start_at: toApiDateTime(creditStart.value),
      end_at: toApiDateTime(creditEnd.value),
      page,
      per_page: 20
    })
  } catch (e: any) {
    creditError.value = e?.message || 'Erro ao carregar crédito à prazo'
    creditData.value = null
  } finally {
    creditLoading.value = false
  }
}

function creditDelinquentPdfFilename() {
  return `clientes-saldo-conta-a-prazo-${new Date().toISOString().split('T')[0]}.pdf`
}

const exportCreditDelinquentPdf = async (download: boolean) => {
  creditDelinquentPdfLoading.value = true
  try {
    const blob = await reportsService.getCreditDelinquentCustomersPdf({ download })
    const url = URL.createObjectURL(blob)
    if (download) {
      const link = document.createElement('a')
      link.href = url
      link.download = creditDelinquentPdfFilename()
      link.click()
      toast.success('PDF baixado com sucesso')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    URL.revokeObjectURL(url)
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao gerar PDF de clientes com saldo')
  } finally {
    creditDelinquentPdfLoading.value = false
  }
}

const shareCreditDelinquentPdf = async () => {
  creditDelinquentPdfLoading.value = true
  try {
    const blob = await reportsService.getCreditDelinquentCustomersPdf({ download: false })
    await shareFile(
      blob,
      creditDelinquentPdfFilename(),
      'Clientes com saldo em aberto',
      'Conta à prazo — saldos em aberto (PDF)'
    )
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      toast.error(e?.message || 'Erro ao gerar PDF para compartilhar')
    }
  } finally {
    creditDelinquentPdfLoading.value = false
  }
}

const moreReportType = ref<'financial' | 'customers' | 'products'>('financial')
const moreTypeOptions = [
  { value: 'financial', label: 'Financeiro' },
  { value: 'customers', label: 'Clientes (resumo)' },
  { value: 'products', label: 'Produtos (resumo)' }
]
const moreStart = ref(salesStartDate.value)
const moreEnd = ref(salesEndDate.value)
const moreLoading = ref(false)

const generateMoreReport = async () => {
  moreLoading.value = true
  try {
    if (moreReportType.value === 'financial') {
      await getFinancialReport({ start_date: moreStart.value, end_date: moreEnd.value })
    } else if (moreReportType.value === 'customers') {
      await getCustomersReport({})
    } else {
      await getProductsReport({})
    }
  } finally {
    moreLoading.value = false
  }
}

function setSection(s: HubSection) {
  activeSection.value = s
  router.replace({ query: { ...route.query, section: s } })
}

function currentSalesReportFilters(): ReportFilters {
  const f: ReportFilters = {}
  if (salesStatusFilter.value) {
    f.status = salesStatusFilter.value as Order['status']
  }
  if (salesFilterMode.value === 'preset') {
    f.period = salesPeriodPreset.value
  } else {
    f.start_date = salesStartDate.value
    f.end_date = salesEndDate.value
  }
  if (canPickSeller.value) {
    if (salesSellerSelection.value === '__me__') {
      f.my_sales = true
    } else if (salesSellerSelection.value && /^\d+$/.test(salesSellerSelection.value)) {
      f.seller_id = Number(salesSellerSelection.value)
    }
  }
  return f
}

function salesPdfFilename() {
  const f = currentSalesReportFilters()
  if (f.start_date && f.end_date) return `vendas-${f.start_date}-${f.end_date}.pdf`
  if (f.period) return `vendas-${f.period}.pdf`
  return 'vendas.pdf'
}

function salesShareTitle(): string {
  const f = currentSalesReportFilters()
  if (f.period) {
    const opt = salesPresetOptions.find((o) => o.value === f.period)
    return opt ? `Vendas — ${opt.label}` : 'Relatório de vendas'
  }
  if (f.start_date && f.end_date) {
    return `Vendas — ${f.start_date} a ${f.end_date}`
  }
  return 'Relatório de vendas'
}

const shareSalesPdf = async () => {
  salesPdfLoading.value = true
  try {
    const blob = await reportsService.getSalesReportPdf(currentSalesReportFilters(), { download: false })
    await shareFile(blob, salesPdfFilename(), salesShareTitle(), 'Relatório de vendas (PDF)')
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      toast.error(e?.message || 'Erro ao gerar PDF para compartilhar')
    }
  } finally {
    salesPdfLoading.value = false
  }
}

const exportSalesPdf = async (download: boolean) => {
  salesPdfLoading.value = true
  try {
    const blob = await reportsService.getSalesReportPdf(currentSalesReportFilters(), { download })
    const url = URL.createObjectURL(blob)
    if (download) {
      const link = document.createElement('a')
      link.href = url
      link.download = salesPdfFilename()
      link.click()
      toast.success('PDF baixado com sucesso')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    URL.revokeObjectURL(url)
  } catch (e: any) {
    toast.error(e?.message || 'Erro ao gerar PDF de vendas')
  } finally {
    salesPdfLoading.value = false
  }
}

const generateSales = async () => {
  try {
    await getSalesReport(currentSalesReportFilters())
    await nextTick()
    drawChart()
  } catch (e) {
    console.error(e)
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    paid: 'Pago'
  }
  return labels[status] || status
}

const drawChart = () => {
  if (!chartCanvas.value || !salesReport.value?.daily_sales?.length) return
  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const dailySales = salesReport.value.daily_sales!
  const padding = 40
  const chartWidth = canvas.width - padding * 2
  const chartHeight = canvas.height - padding * 2
  const maxRevenue = Math.max(...dailySales.map((day: { revenue: number }) => day.revenue), 1)
  const barWidth = chartWidth / dailySales.length
  dailySales.forEach((day: { date: string; revenue: number }, index: number) => {
    const barHeight = (day.revenue / maxRevenue) * chartHeight
    const x = padding + index * barWidth + barWidth * 0.1
    const y = padding + chartHeight - barHeight
    const width = barWidth * 0.8
    ctx.fillStyle = '#5CDB95'
    ctx.fillRect(x, y, width, barHeight)
    if (day.revenue > 0) {
      ctx.fillStyle = '#05386B'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(formatCurrency(day.revenue), x + width / 2, y - 5)
    }
    ctx.fillStyle = '#6c757d'
    ctx.font = '10px Arial'
    ctx.fillText(
      new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      x + width / 2,
      canvas.height - 10
    )
  })
}

watch(
  () => route.query.section,
  (s) => {
    const v = String(s || '')
    if (['sales', 'products', 'credit', 'cashbook', 'more'].includes(v)) {
      activeSection.value = v as HubSection
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (!route.query.section) {
    router.replace({ query: { ...route.query, section: 'sales' } })
  }
  nextTick(() => {
    if (activeSection.value === 'sales') {
      generateSales()
    } else if (activeSection.value === 'credit') {
      loadCreditSales(1)
    }
  })
})

watch(activeSection, (s) => {
  if (s === 'credit' && !creditData.value && !creditLoading.value) {
    loadCreditSales(1)
  }
  if ((s === 'sales' || s === 'cashbook') && canPickSeller.value && sellerUsers.value.length === 0) {
    loadSellerUsersForReports()
  }
})

watch(
  canPickSeller,
  (ok) => {
    if (
      ok &&
      (activeSection.value === 'sales' || activeSection.value === 'cashbook') &&
      sellerUsers.value.length === 0
    ) {
      loadSellerUsersForReports()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.reports-hub {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);

  h2 {
    margin: 0;
    color: var(--primary-dark);
  }
}

.reports-subtitle {
  margin: var(--spacing-1) 0 0;
  color: var(--gray-600);
  font-size: var(--font-size-sm);
}

.link-btn {
  display: inline-block;
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--gray-100);
  border-radius: var(--radius-md);
  color: var(--primary-dark);
  text-decoration: none;
  font-weight: 600;
  &:hover {
    background: var(--gray-200);
  }
}

.hub-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-6);
  border-bottom: 1px solid var(--gray-200);
}

.hub-tab {
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  color: var(--gray-600);
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
  &.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
  &:hover {
    color: var(--gray-800);
  }
}

.section-panel {
  min-height: 200px;
}

.filters-card {
  margin-bottom: var(--spacing-6);
}

.credit-pdf-card .section-title {
  margin-bottom: var(--spacing-2);
}

.credit-pdf-hint {
  margin-top: 0;
  margin-bottom: var(--spacing-4);
}

.sales-filter-mode {
  display: flex;
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
  gap: var(--spacing-4);
  align-items: flex-end;
}

.date-row {
  align-items: flex-end;
}

.sales-filters-row {
  margin-bottom: var(--spacing-2);
}

.sales-seller-block {
  margin-top: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.sales-seller-row {
  align-items: flex-end;
}

.sales-seller-hint {
  margin: var(--spacing-2) 0 0;
  font-size: var(--font-size-xs);
  color: var(--gray-600);
  max-width: 42rem;
  line-height: 1.4;
}

.seller-filter-card .seller-filter-banner {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-base);
}

.seller-filter-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.seller-filter-name {
  color: var(--primary-dark);
}

.seller-self-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: var(--primary-light, #d1fae5);
  color: var(--primary-dark);
}

.sales-actions-row {
  margin-top: var(--spacing-2);
  flex-wrap: wrap;
}

.sales-lines-hint {
  margin: 0 0 var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.sales-lines-scroll {
  max-height: min(480px, 55vh);
  overflow: auto;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}

.sales-lines-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 520px;
}

.sales-lines-head,
.sales-lines-row {
  display: grid;
  grid-template-columns: 1.1fr 1.4fr 0.85fr 1fr;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  align-items: start;
}

.sales-lines-head {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: 600;
  background: var(--gray-50);
  border-bottom: 2px solid var(--gray-200);
}

.sales-lines-row {
  border-bottom: 1px solid var(--gray-100);
}

.sales-line-product {
  word-break: break-word;
}

.section-title {
  margin: 0 0 var(--spacing-2);
}

.hint {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.preset-banner {
  margin: 0;
  font-weight: 600;
  color: var(--primary-dark);
}

.error-card {
  margin-bottom: var(--spacing-6);
}

.error-content {
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-6);
}

.report-card.full-width {
  grid-column: 1 / -1;
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

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.summary-value {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--primary-dark);
  &.positive {
    color: var(--success);
  }
  &.negative {
    color: var(--danger);
  }
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--spacing-3);
}

.status-item {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-3);
  background: var(--gray-100);
  border-radius: var(--radius-md);
}

.status-label {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.status-value {
  font-weight: 600;
}

.top-products {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.product-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--gray-100);
  border-radius: var(--radius-md);
}

.product-rank {
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: var(--font-size-sm);
}

.product-name {
  font-weight: 500;
}

.product-stats {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.chart-container {
  width: 100%;
  overflow: auto;
}

.credit-table {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.credit-table-head,
.credit-table-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1fr;
  gap: var(--spacing-2);
  padding: var(--spacing-2) 0;
  font-size: var(--font-size-sm);
}

.credit-table-head {
  font-weight: 600;
  border-bottom: 2px solid var(--gray-200);
}

.credit-table-row {
  border-bottom: 1px solid var(--gray-100);
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-4);
}

.page-info {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.empty-inline {
  padding: var(--spacing-4);
  color: var(--gray-600);
}

@media (max-width: 768px) {
  .credit-table-head,
  .credit-table-row {
    grid-template-columns: 1fr;
  }

  .sales-lines-head,
  .sales-lines-row {
    grid-template-columns: 1fr;
  }

  .sales-lines-table {
    min-width: 0;
  }
}
</style>
