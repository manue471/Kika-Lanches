<template>
  <div class="dashboard">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAppData } from '@/composables/useStorage'
import { useFormatter, useDateUtils, useArrayUtils } from '@/composables/useUtils'
import StatCard from '@/components/Business/StatCard.vue'
import BaseCard from '@/components/Base/Card.vue'

const emit = defineEmits<{
  navigate: [route: string]
  showModal: [type: string]
}>()

const { currency, date } = useFormatter()
const { startOfDay, startOfMonth, isToday } = useDateUtils()
const { sumBy } = useArrayUtils()
const appData = useAppData()

const selectedPeriod = ref<'week' | 'month'>('week')
const chartCanvas = ref<HTMLCanvasElement>()

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

const todaySales = computed(() => {
  const today = startOfDay()
  return appData.value.sales.filter(sale => isToday(new Date(sale.timestamp))).length
})

const todayRevenue = computed(() => {
  const today = startOfDay()
  const todaySales = appData.value.sales.filter(sale => isToday(new Date(sale.timestamp)))
  return sumBy(todaySales, 'total')
})

const todayCustomers = computed(() => {
  const today = startOfDay()
  const todaySales = appData.value.sales.filter(sale => isToday(new Date(sale.timestamp)))
  const uniqueCustomers = new Set(todaySales.map(sale => sale.customerId))
  return uniqueCustomers.size
})

const monthlyRevenue = computed(() => {
  const monthStart = startOfMonth()
  const monthlySales = appData.value.sales.filter(sale => 
    new Date(sale.timestamp) >= monthStart
  )
  return sumBy(monthlySales, 'total')
})

const topProducts = computed(() => {
  const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {}
  
  appData.value.sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0
        }
      }
      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.price * item.quantity
    })
  })

  return Object.entries(productSales)
    .map(([productId, data]) => ({ productId: Number(productId), ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
})

const formattedCurrency = currency

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
  const now = new Date()
  const data: { label: string; value: number }[] = []
  
  if (selectedPeriod.value === 'week') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayStart = startOfDay(date)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      
      const daySales = appData.value.sales.filter(sale => {
        const saleDate = new Date(sale.timestamp)
        return saleDate >= dayStart && saleDate < dayEnd
      })
      
      const revenue = sumBy(daySales, 'total')
      
      data.push({
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        value: revenue
      })
    }
  } else {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      
      const monthSales = appData.value.sales.filter(sale => {
        const saleDate = new Date(sale.timestamp)
        return saleDate >= monthStart && saleDate < monthEnd
      })
      
      const revenue = sumBy(monthSales, 'total')
      
      data.push({
        label: date.toLocaleDateString('pt-BR', { month: 'short' }),
        value: revenue
      })
    }
  }
  
  return data
}

const drawChart = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: { label: string; value: number }[]) => {
  const padding = 40
  const chartWidth = canvas.width - (padding * 2)
  const chartHeight = canvas.height - (padding * 2)
  
  const maxValue = Math.max(...data.map(d => d.value))
  const barWidth = chartWidth / data.length
  
  // Draw bars
  data.forEach((item, index) => {
    const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0
    const x = padding + (index * barWidth) + (barWidth * 0.1)
    const y = padding + chartHeight - barHeight
    const width = barWidth * 0.8
    
    // Bar
    ctx.fillStyle = '#5CDB95'
    ctx.fillRect(x, y, width, barHeight)
    
    // Value label
    if (item.value > 0) {
      ctx.fillStyle = '#05386B'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        currency(item.value), 
        x + width / 2, 
        y - 5
      )
    }
    
    // X-axis label
    ctx.fillStyle = '#6c757d'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(
      item.label, 
      x + width / 2, 
      canvas.height - 10
    )
  })
}

onMounted(() => {
  updateChart()
})

watch(selectedPeriod, () => {
  updateChart()
})

watch(() => appData.value.sales, () => {
  updateChart()
}, { deep: true })
</script>

<style lang="scss" scoped>
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
  }
}

.date-info {
  color: var(--gray-600);
  font-size: var(--font-size-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
}

.dashboard-card {
  height: 100%;
}

.period-selector {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.period-btn {
  background: var(--gray-200);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);

  &.active {
    background: var(--primary-light);
    color: var(--white);
  }

  &:hover:not(.active) {
    background: var(--gray-300);
  }
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-products {
  max-height: 200px;
  overflow-y: auto;
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

  &:hover {
    background: var(--gray-200);
  }
}

.product-rank-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.rank-number {
  background: var(--primary-medium);
  color: var(--white);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: bold;
}

.product-name {
  font-weight: 500;
  color: var(--gray-800);
}

.product-sales {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
}

.product-revenue {
  font-weight: bold;
  color: var(--primary-dark);
}

.quick-actions {
  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }

  .action-btn {
    background: linear-gradient(135deg, var(--primary-medium) 0%, var(--primary-light) 100%);
    border: none;
    padding: var(--spacing-4) var(--spacing-6);
    border-radius: var(--radius-lg);
    color: var(--white);
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    font-size: var(--font-size-base);
    font-weight: 500;
    text-align: left;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }

  .action-icon {
    font-size: var(--font-size-xl);
  }
}

.no-data {
  text-align: center;
  color: var(--gray-500);
  font-style: italic;
  padding: var(--spacing-8);
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
