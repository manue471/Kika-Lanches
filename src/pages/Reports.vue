<template>
  <div class="reports">
    <!-- Header -->
    <div class="reports-header">
      <h2>Relatórios e Análises</h2>
      <div class="report-actions">
        <BaseButton 
          variant="secondary" 
          @click="handleExportCSV"
          :loading="isExporting"
        >
          Exportar CSV
        </BaseButton>
        <BaseButton 
          variant="secondary" 
          @click="generateReport"
          :loading="isLoading"
        >
          Gerar Relatório
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard class="filters-card">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">Período:</label>
          <div class="date-inputs">
            <BaseInput
              v-model="startDate"
              type="date"
              label="Data Inicial"
              @change="handleDateChange"
            />
            <BaseInput
              v-model="endDate"
              type="date"
              label="Data Final"
              @change="handleDateChange"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Tipo de Relatório:</label>
          <BaseSelect
            v-model="reportType"
            :options="reportTypeOptions"
            @change="handleReportTypeChange"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Loading State -->
    <BaseLoading 
      :show="isLoading" 
      message="Gerando relatório..."
      variant="overlay"
    />

    <!-- Error State -->
    <BaseCard v-if="error" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao gerar relatório</h3>
          <p>{{ error }}</p>
          <BaseButton @click="generateReport" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Empty State -->
    <div v-else-if="!salesReport && !financialReport" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>Nenhum relatório disponível</h3>
      <p>Selecione um tipo de relatório e clique em "Gerar Relatório" para visualizar os dados</p>
      <BaseButton 
        variant="primary" 
        @click="generateReport"
        :loading="isLoading"
      >
        <span class="btn-icon">📊</span>
        Gerar Relatório
      </BaseButton>
    </div>

    <!-- Sales Report -->
    <div v-else-if="reportType === 'sales' && salesReport" class="reports-grid">
      <BaseCard title="Resumo do Período" class="report-card">
        <div class="report-summary">
          <div class="summary-item">
            <span class="summary-label">Total de Vendas:</span>
            <span class="summary-value">{{ salesReport.summary.total_orders }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Faturamento Total:</span>
            <span class="summary-value">{{ formatCurrency(salesReport.summary.total_sales) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ticket Médio:</span>
            <span class="summary-value">{{ formatCurrency(salesReport.summary.average_order_value) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Período:</span>
            <span class="summary-value">
              {{ formatDate(salesReport.period.start_date) }} - {{ formatDate(salesReport.period.end_date) }}
            </span>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Vendas por Status" class="report-card">
        <div class="status-grid">
          <div 
            v-for="(data, status) in salesReport.orders_by_status" 
            :key="status"
            class="status-item"
          >
            <span class="status-label">{{ getStatusLabel(String(status)) }}:</span>
            <span class="status-value">{{ data.count }} ({{ formatCurrency(data.total) }})</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Produtos Mais Vendidos" class="report-card full-width">
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
                {{ product.total_quantity }} vendidos • {{ formatCurrency(product.total_revenue) }}
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Vendas Diárias" class="report-card full-width">
        <div class="chart-container">
          <canvas ref="chartCanvas" width="800" height="400"></canvas>
        </div>
      </BaseCard>
    </div>

    <!-- Financial Report -->
    <div v-else-if="reportType === 'financial' && financialReport" class="reports-grid">
      <BaseCard title="Resumo Financeiro" class="report-card">
        <div class="financial-summary">
          <div class="summary-item">
            <span class="summary-label">Receita Total:</span>
            <span class="summary-value positive">{{ formatCurrency(financialReport.summary.total_revenue) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Custos Totais:</span>
            <span class="summary-value negative">{{ formatCurrency(financialReport.summary.total_costs) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Lucro:</span>
            <span class="summary-value" :class="financialReport.summary.profit >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(financialReport.summary.profit) }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Margem de Lucro:</span>
            <span class="summary-value">{{ ((financialReport.summary.profit_margin || 0) * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <BaseCard v-if="!isLoading && !salesReport && !financialReport" class="empty-state">
      <div class="empty-content">
        <span class="empty-icon">📊</span>
        <h3>Nenhum relatório gerado</h3>
        <p>Selecione um período e tipo de relatório para começar.</p>
        <BaseButton variant="primary" @click="generateReport">
          Gerar Relatório
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useReports } from '../composables/useReports'
import { useFormatter } from '@/composables/useUtils'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'

const {
  // State
  salesReport,
  financialReport,
  isLoading,
  error,
  
  // Methods
  getSalesReport,
  getFinancialReport
} = useReports()

const { currency, date } = useFormatter()

// UI State
const startDate = ref('')
const endDate = ref('')
const reportType = ref('sales')
const isExporting = ref(false)
const chartCanvas = ref<HTMLCanvasElement>()

// Initialize dates
const today = new Date()
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
startDate.value = weekAgo.toISOString().split('T')[0]
endDate.value = today.toISOString().split('T')[0]

// Computed
const formatCurrency = currency
const formatDate = (dateString: string) => {
  return date(new Date(dateString))
}

const reportTypeOptions = [
  { value: 'sales', label: 'Relatório de Vendas' },
  { value: 'financial', label: 'Relatório Financeiro' },
  { value: 'customers', label: 'Relatório de Clientes' },
  { value: 'products', label: 'Relatório de Produtos' }
]

// Methods
const handleDateChange = () => {
  if (startDate.value && endDate.value) {
    generateReport()
  }
}

const handleReportTypeChange = () => {
  generateReport()
}

const generateReport = async () => {
  if (!startDate.value || !endDate.value) return

  try {
    if (reportType.value === 'sales') {
      await getSalesReport({
        from: startDate.value,
        to: endDate.value
      })
      await nextTick()
      drawChart()
    } else if (reportType.value === 'financial') {
      await getFinancialReport({
        from: startDate.value,
        to: endDate.value
      })
    }
  } catch (error) {
    console.error('Error generating report:', error)
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  }
  return labels[status] || status
}

const drawChart = () => {
  if (!chartCanvas.value || !salesReport.value) return

  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const dailySales = salesReport.value.daily_sales
  if (!dailySales || dailySales.length === 0) return

  const padding = 40
  const chartWidth = canvas.width - (padding * 2)
  const chartHeight = canvas.height - (padding * 2)
  
  const maxRevenue = Math.max(...dailySales.map((day: any) => day.revenue))
  const barWidth = chartWidth / dailySales.length
  
  // Draw bars
  dailySales.forEach((day: any, index: number) => {
    const barHeight = (day.revenue / maxRevenue) * chartHeight
    const x = padding + (index * barWidth) + (barWidth * 0.1)
    const y = padding + chartHeight - barHeight
    const width = barWidth * 0.8
    
    // Bar
    ctx.fillStyle = '#5CDB95'
    ctx.fillRect(x, y, width, barHeight)
    
    // Value label
    if (day.revenue > 0) {
      ctx.fillStyle = '#05386B'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        formatCurrency(day.revenue), 
        x + width / 2, 
        y - 5
      )
    }
    
    // Date label
    ctx.fillStyle = '#6c757d'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(
      new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
      x + width / 2, 
      canvas.height - 10
    )
  })
}

const handleExportCSV = async () => {
  isExporting.value = true
  try {
    // TODO: Implement CSV export functionality
    console.log('CSV export not implemented yet')
  } finally {
    isExporting.value = false
  }
}

// Load initial report
onMounted(() => {
  generateReport()
})
</script>

<style lang="scss" scoped>
.reports {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  
  h2 {
    margin: 0;
    color: var(--primary-dark);
  }
}

.report-actions {
  display: flex;
  gap: var(--spacing-3);
}

.filters-card {
  margin-bottom: var(--spacing-6);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-6);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.filter-label {
  font-weight: 500;
  color: var(--gray-700);
  font-size: var(--font-size-sm);
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
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

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-6);
}

.report-card {
  &.full-width {
    grid-column: 1 / -1;
  }
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  
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
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-3);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--gray-100);
  border-radius: var(--radius-md);
  
  .status-label {
    font-size: var(--font-size-sm);
    color: var(--gray-600);
  }
  
  .status-value {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-dark);
  }
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
  
  .product-rank {
    width: 32px;
    height: 32px;
    background: var(--primary-medium);
    color: var(--white);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: var(--font-size-sm);
  }
  
  .product-info {
    flex: 1;
    
    .product-name {
      font-weight: 500;
      color: var(--gray-800);
      margin-bottom: var(--spacing-1);
    }
    
    .product-stats {
      font-size: var(--font-size-sm);
      color: var(--gray-600);
    }
  }
}

.chart-container {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-50);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-12);
}

.empty-content {
  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-4);
  }
  
  h3 {
    margin: 0 0 var(--spacing-2) 0;
    color: var(--gray-700);
  }
  
  p {
    margin: 0 0 var(--spacing-6) 0;
    color: var(--gray-500);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .reports {
    padding: var(--spacing-4);
  }
  
  .reports-header {
    flex-direction: column;
    gap: var(--spacing-4);
    align-items: stretch;
  }
  
  .report-actions {
    flex-direction: column;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
  
  .date-inputs {
    grid-template-columns: 1fr;
  }
  
  .reports-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
  
  .report-summary {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
}

// Empty State Styles
.empty-state {
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-4);
  opacity: 0.6;
}

.empty-state h3 {
  color: var(--gray-700);
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-lg);
}

.empty-state p {
  color: var(--gray-500);
  margin-bottom: var(--spacing-6);
  font-size: var(--font-size-sm);
}

@media (max-width: 480px) {
  .reports {
    padding: var(--spacing-2);
  }
}
</style>
