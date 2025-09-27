<template>
  <div class="dashboard">
    <!-- Loading State -->
    <BaseLoading 
      :show="isLoading" 
      message="Carregando dados do dashboard..."
      variant="overlay"
    />

    <!-- Error State -->
    <BaseCard v-if="hasError" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao carregar dashboard</h3>
          <p>Não foi possível carregar os dados. Tente novamente.</p>
          <BaseButton @click="refreshData" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Dashboard Content -->
    <div v-else>
      <div class="dashboard-header">
        <h2>Dashboard - Visão Geral</h2>
        <div class="date-info">
          {{ currentDate }}
        </div>
      </div>

      <div class="stats-grid">
        <StatCard
          title="Faturamento Hoje"
          :value="todayRevenue"
          format="currency"
          icon="💰"
        />
        <StatCard
          title="Vendas Hoje"
          :value="todaySales"
          format="number"
          icon="📊"
        />
        <StatCard
          title="Clientes Atendidos"
          :value="todayCustomers"
          format="number"
          icon="👥"
        />
        <StatCard
          title="Faturamento Mensal"
          :value="monthlyRevenue"
          format="currency"
          icon="📅"
        />
      </div>

      <div class="dashboard-grid">
        <BaseCard title="Produtos Mais Vendidos" class="dashboard-card">
          <div class="top-products">
            <div v-if="topProducts.length === 0" class="no-data">
              Nenhuma venda registrada
            </div>
            <div
              v-for="(product, index) in topProducts"
              :key="product.productId"
              class="product-rank"
            >
              <div class="product-rank-info">
                <div class="rank-number">{{ index + 1 }}</div>
                <div>
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-sales">{{ product.quantity }} vendidos</div>
                </div>
              </div>
              <div class="product-revenue">{{ formattedCurrency(product.revenue) }}</div>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Vendas por Período" class="dashboard-card">
          <div class="period-selector">
            <button
              :class="['period-btn', { active: selectedPeriod === 'week' }]"
              @click="selectedPeriod = 'week'"
            >
              Semana
            </button>
            <button
              :class="['period-btn', { active: selectedPeriod === 'month' }]"
              @click="selectedPeriod = 'month'"
            >
              Mês
            </button>
          </div>
          <div class="chart-container">
            <canvas ref="chartCanvas" width="400" height="200"></canvas>
          </div>
        </BaseCard>
      </div>

      <BaseCard title="Ações Rápidas" class="quick-actions">
        <div class="action-buttons">
          <button class="action-btn" @click="$emit('navigate', 'sales')">
            <span class="action-icon">🛒</span>
            Nova Venda
          </button>
          <button class="action-btn" @click="$emit('showModal', 'product')">
            <span class="action-icon">➕</span>
            Adicionar Produto
          </button>
          <button class="action-btn" @click="$emit('showModal', 'customer')">
            <span class="action-icon">👤</span>
            Novo Cliente
          </button>
          <button class="action-btn" @click="$emit('navigate', 'reports')">
            <span class="action-icon">📈</span>
            Ver Relatórios
          </button>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFormatter } from '@/composables/useUtils'
import { useApi } from '@/composables/useApi'
import { reportsService, productsService, customersService, ordersService } from '@/services/api'
import StatCard from '@/components/Business/StatCard.vue'
import BaseCard from '@/components/Base/Card.vue'
import BaseLoading from '@/components/Base/Loading.vue'

// Emits are used in template but not in script
defineEmits<{
  navigate: [route: string]
  showModal: [type: string]
}>()

const { currency } = useFormatter()
// const { startOfMonth } = useDateUtils() // Removido pois não está sendo usado

const selectedPeriod = ref<'week' | 'month'>('week')
const chartCanvas = ref<HTMLCanvasElement>()

// API data
const salesReport = useApi(() => {
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  return reportsService.getSalesReport({
    from: weekAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  })
}, { autoLoad: true })

const productsApi = useApi(() => productsService.getActive(), { autoLoad: true })
const customersApi = useApi(() => customersService.getActive(), { autoLoad: true })
const ordersApi = useApi(() => ordersService.getByDateRange(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
), { autoLoad: true })

const currentDate = computed(() => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  return now.toLocaleDateString('pt-BR', options)
})

// Computed properties using real API data
const todaySales = computed(() => {
  return salesReport.data.value?.summary?.total_orders || 0
})

const todayRevenue = computed(() => {
  return salesReport.data.value?.summary?.total_revenue || 0
})

const todayCustomers = computed(() => {
  return customersApi.data.value?.length || 0
})

const monthlyRevenue = computed(() => {
  return salesReport.data.value?.summary?.total_revenue || 0
})

const topProducts = computed(() => {
  const reportData = salesReport.data.value
  if (!reportData?.top_products) return []
  
  return reportData.top_products.map((product: any) => ({
    productId: product.product_id,
    name: product.product_name,
    quantity: product.quantity_sold,
    revenue: product.revenue
  }))
})

const isLoading = computed(() => {
  return salesReport.isLoading.value || 
         productsApi.isLoading.value || 
         customersApi.isLoading.value || 
         ordersApi.isLoading.value
})

const hasError = computed(() => {
  return salesReport.error.value || 
         productsApi.error.value || 
         customersApi.error.value || 
         ordersApi.error.value
})

const formattedCurrency = currency

// Methods
const refreshData = async () => {
  await Promise.all([
    salesReport.refresh(),
    productsApi.refresh(),
    customersApi.refresh(),
    ordersApi.refresh()
  ])
}

const updateChart = async () => {
  if (!chartCanvas.value) return

  await nextTick()
  
  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const chartData = getChartData()
  
  if (chartData.length === 0) {
    ctx.fillStyle = '#6c757d'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Nenhum dado disponível', canvas.width / 2, canvas.height / 2)
    return
  }

  drawChart(ctx, canvas, chartData)
}

const getChartData = () => {
  const reportData = salesReport.data.value
  if (!reportData) return []
  
  if (selectedPeriod.value === 'week') {
    // Use daily sales from API
    return reportData.daily_sales?.map((day: any) => ({
      label: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      value: day.revenue
    })) || []
  } else {
    // For monthly view, we would need to call a different API endpoint
    // For now, return empty array
    return []
  }
}

const drawChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: { label: string; value: number }[]) => {
  const isMobile = window.innerWidth <= 768
  const padding = isMobile ? 20 : 40
  const chartWidth = canvas.width - (padding * 2)
  const chartHeight = canvas.height - (padding * 2)
  
  const maxValue = Math.max(...data.map(d => d.value))
  const barWidth = chartWidth / data.length
  
  // Clear background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw bars
  data.forEach((item, index) => {
    const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0
    const x = padding + (index * barWidth) + (barWidth * 0.1)
    const y = padding + chartHeight - barHeight
    const width = barWidth * 0.8
    
    // Bar gradient
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
    gradient.addColorStop(0, '#5CDB95')
    gradient.addColorStop(1, '#379683')
    
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, width, barHeight)
    
    // Bar border
    ctx.strokeStyle = '#05386B'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, width, barHeight)
    
    // Value label
    if (item.value > 0) {
      ctx.fillStyle = '#05386B'
      ctx.font = isMobile ? '10px Arial' : '12px Arial'
      ctx.textAlign = 'center'
      const labelY = y - (isMobile ? 3 : 5)
      ctx.fillText(
        currency(item.value), 
        x + width / 2, 
        labelY
      )
    }
    
    // X-axis label
    ctx.fillStyle = '#6c757d'
    ctx.font = isMobile ? '10px Arial' : '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(
      item.label, 
      x + width / 2, 
      canvas.height - (isMobile ? 5 : 10)
    )
  })
  
  // Draw grid lines for better readability
  if (!isMobile) {
    ctx.strokeStyle = '#e9ecef'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    
    for (let i = 1; i <= 4; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()
    }
    
    ctx.setLineDash([])
  }
}

onMounted(() => {
  updateChart()
  
  // Add resize listener for responsive chart
  const handleResize = () => {
    updateChart()
  }
  
  window.addEventListener('resize', handleResize)
  
  // Cleanup listener on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

watch(selectedPeriod, async () => {
  // Reload sales report with new period
  const today = new Date()
  let fromDate: Date
  
  if (selectedPeriod.value === 'week') {
    fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  await salesReport.execute(() => reportsService.getSalesReport({
    from: fromDate.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  }))
  
  updateChart()
})

watch(() => salesReport.data.value, () => {
  updateChart()
}, { deep: true })
</script>

<style lang="scss" scoped>
.dashboard {
  padding: var(--spacing-4);
  max-width: 100%;
  overflow-x: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-4);

  h2 {
    font-size: var(--font-size-3xl);
    color: var(--primary-dark);
    margin: 0;
    line-height: 1.2;
  }
}

.date-info {
  color: var(--gray-600);
  font-size: var(--font-size-lg);
  text-align: right;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.dashboard-card {
  height: 100%;
  min-height: 300px;
}

.period-selector {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
  flex-wrap: wrap;
}

.period-btn {
  background: var(--gray-200);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: 500;
  min-width: 80px;
  text-align: center;

  &.active {
    background: var(--primary-light);
    color: var(--white);
  }

  &:hover:not(.active) {
    background: var(--gray-300);
  }

  &:focus {
    outline: 2px solid var(--primary-light);
    outline-offset: 2px;
  }
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.top-products {
  max-height: 250px;
  overflow-y: auto;
  padding-right: var(--spacing-2);
  
  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--gray-100);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--gray-400);
    border-radius: 3px;
    
    &:hover {
      background: var(--gray-500);
    }
  }
}

.product-rank {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  margin-bottom: var(--spacing-2);
  background: var(--gray-100);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  min-height: 60px;

  &:hover {
    background: var(--gray-200);
    transform: translateX(2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.product-rank-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  min-width: 0;
}

.rank-number {
  background: var(--primary-medium);
  color: var(--white);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: bold;
  flex-shrink: 0;
}

.product-name {
  font-weight: 500;
  color: var(--gray-800);
  font-size: var(--font-size-sm);
  line-height: 1.3;
  word-break: break-word;
}

.product-sales {
  color: var(--gray-600);
  font-size: var(--font-size-xs);
  margin-top: 2px;
}

.product-revenue {
  font-weight: bold;
  color: var(--primary-dark);
  font-size: var(--font-size-sm);
  text-align: right;
  flex-shrink: 0;
}

.quick-actions {
  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-4);
  }

  .action-btn {
    background: linear-gradient(135deg, var(--primary-medium) 0%, var(--primary-light) 100%);
    border: none;
    padding: var(--spacing-4) var(--spacing-5);
    border-radius: var(--radius-lg);
    color: var(--white);
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    font-size: var(--font-size-sm);
    font-weight: 500;
    text-align: left;
    min-height: 60px;
    box-shadow: var(--shadow-sm);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    &:active {
      transform: translateY(0);
    }

    &:focus {
      outline: 2px solid var(--white);
      outline-offset: 2px;
    }
  }

  .action-icon {
    font-size: var(--font-size-lg);
    flex-shrink: 0;
  }
}

.no-data {
  text-align: center;
  color: var(--gray-500);
  font-style: italic;
  padding: var(--spacing-8);
  font-size: var(--font-size-sm);
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

// Tablet styles
@media (max-width: 1024px) {
  .dashboard {
    padding: var(--spacing-3);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-3);
  }

  .dashboard-header h2 {
    font-size: var(--font-size-2xl);
  }

  .date-info {
    font-size: var(--font-size-base);
  }
}

// Mobile styles
@media (max-width: 768px) {
  .dashboard {
    padding: var(--spacing-2);
  }

  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    margin-bottom: var(--spacing-4);
    gap: var(--spacing-2);

    h2 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--spacing-2);
    }
  }

  .date-info {
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--gray-500);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-6);
  }

  .dashboard-grid {
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-6);
  }

  .dashboard-card {
    min-height: 250px;
  }

  .period-selector {
    justify-content: center;
    gap: var(--spacing-2);
  }

  .period-btn {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-xs);
    min-width: 70px;
  }

  .chart-container {
    height: 180px;
  }

  .top-products {
    max-height: 200px;
  }

  .product-rank {
    padding: var(--spacing-2);
    min-height: 50px;
  }

  .product-rank-info {
    gap: var(--spacing-2);
  }

  .rank-number {
    width: 24px;
    height: 24px;
    font-size: var(--font-size-xs);
  }

  .product-name {
    font-size: var(--font-size-xs);
  }

  .product-sales {
    font-size: 10px;
  }

  .product-revenue {
    font-size: var(--font-size-xs);
  }

  .quick-actions {
    .action-buttons {
      grid-template-columns: 1fr;
      gap: var(--spacing-3);
    }

    .action-btn {
      padding: var(--spacing-3) var(--spacing-4);
      font-size: var(--font-size-sm);
      min-height: 50px;
      justify-content: center;
      text-align: center;
    }

    .action-icon {
      font-size: var(--font-size-base);
    }
  }
}

// Small mobile styles
@media (max-width: 480px) {
  .dashboard {
    padding: var(--spacing-1);
  }

  .dashboard-header h2 {
    font-size: var(--font-size-lg);
  }

  .stats-grid {
    gap: var(--spacing-2);
  }

  .dashboard-grid {
    gap: var(--spacing-3);
  }

  .dashboard-card {
    min-height: 200px;
  }

  .chart-container {
    height: 160px;
  }

  .top-products {
    max-height: 180px;
  }

  .product-rank {
    padding: var(--spacing-1) var(--spacing-2);
    min-height: 45px;
  }

  .product-name {
    font-size: 11px;
  }

  .product-sales {
    font-size: 9px;
  }

  .product-revenue {
    font-size: 11px;
  }

  .quick-actions {
    .action-btn {
      padding: var(--spacing-2) var(--spacing-3);
      font-size: var(--font-size-xs);
      min-height: 45px;
    }
  }
}

// Landscape mobile optimization
@media (max-width: 768px) and (orientation: landscape) {
  .dashboard-header {
    flex-direction: row;
    text-align: left;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-container {
    height: 150px;
  }
}
</style>
