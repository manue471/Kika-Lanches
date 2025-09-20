<template>
  <div class="reports">
    <div class="reports-header">
      <h2>Relatórios e Análises</h2>
      <div class="report-actions">
        <BaseButton variant="secondary" @click="exportToCSV">Exportar CSV</BaseButton>
        <BaseButton variant="secondary" @click="exportToPDF">Exportar PDF</BaseButton>
      </div>
    </div>

    <div class="report-filters">
      <div class="filter-group">
        <label>Período:</label>
        <BaseInput
          v-model="startDate"
          type="date"
          @input="generateReport"
        />
        <BaseInput
          v-model="endDate"
          type="date"
          @input="generateReport"
        />
        <BaseButton variant="info" size="sm" @click="generateReport">Aplicar</BaseButton>
      </div>
      <div class="filter-group">
        <label>Tipo de Relatório:</label>
        <BaseSelect
          v-model="reportType"
          :options="reportTypeOptions"
          @change="generateReport"
        />
      </div>
    </div>

    <div class="reports-grid">
      <BaseCard title="Resumo do Período" class="report-card">
        <div class="report-summary">
          <div class="summary-item">
            <span class="summary-label">Total de Vendas:</span>
            <span class="summary-value">{{ filteredSales.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Faturamento Total:</span>
            <span class="summary-value">{{ formattedCurrency(totalRevenue) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ticket Médio:</span>
            <span class="summary-value">{{ formattedCurrency(averageTicket) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Clientes Únicos:</span>
            <span class="summary-value">{{ uniqueCustomers }}</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Produtos Mais Vendidos" class="report-card">
        <div class="top-products-report">
          <div v-if="topProducts.length === 0" class="no-data">
            Nenhuma venda no período
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

      <BaseCard title="Detalhamento de Vendas" class="report-card full-width">
        <div class="sales-table-container">
          <table class="sales-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Produtos</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredSales.length === 0">
                <td colspan="5" class="no-data">Nenhuma venda encontrada</td>
              </tr>
              <tr v-for="sale in filteredSales" :key="sale.id">
                <td>{{ sale.date }}</td>
                <td>{{ sale.customerName }}</td>
                <td>
                  {{ sale.items.map(item => `${item.quantity}x ${item.productName}`).join(', ') }}
                </td>
                <td>{{ formattedCurrency(sale.total) }}</td>
                <td>
                  <BaseButton variant="secondary" size="sm" @click="viewSaleDetail(sale)">
                    Ver Detalhes
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppData } from '@/composables/useStorage'
import { useFormatter, useArrayUtils } from '@/composables/useUtils'
import { useNotifications } from '@/composables/useNotifications'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'

const { currency } = useFormatter()
const { sumBy } = useArrayUtils()
const { showNotification } = useNotifications()
const appData = useAppData()

// Reactive data
const startDate = ref('')
const endDate = ref('')
const reportType = ref('sales')

const reportTypeOptions = [
  { value: 'sales', label: 'Vendas Gerais' },
  { value: 'products', label: 'Por Produto' },
  { value: 'customers', label: 'Por Cliente' },
  { value: 'daily', label: 'Resumo Diário' }
]

// Computed properties
const formattedCurrency = currency

const filteredSales = computed(() => {
  if (!startDate.value || !endDate.value) return appData.value.sales
  
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  end.setHours(23, 59, 59, 999)
  
  return appData.value.sales.filter(sale => {
    const saleDate = new Date(sale.timestamp)
    return saleDate >= start && saleDate <= end
  })
})

const totalRevenue = computed(() => {
  return sumBy(filteredSales.value, 'total')
})

const averageTicket = computed(() => {
  if (filteredSales.value.length === 0) return 0
  return totalRevenue.value / filteredSales.value.length
})

const uniqueCustomers = computed(() => {
  const customerIds = new Set(filteredSales.value.map(sale => sale.customerId))
  return customerIds.size
})

const topProducts = computed(() => {
  const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {}
  
  filteredSales.value.forEach(sale => {
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
    .slice(0, 10)
})

// Methods
const generateReport = () => {
  // Report generation is handled by computed properties
  showNotification('Relatório atualizado', 'success')
}

const viewSaleDetail = (sale: any) => {
  showNotification(`Detalhes da venda #${sale.id} serão implementados em breve`, 'info')
}

const exportToCSV = () => {
  showNotification('Exportação CSV será implementada em breve', 'info')
}

const exportToPDF = () => {
  showNotification('Exportação PDF será implementada em breve', 'info')
}

// Initialize default dates (last 30 days)
onMounted(() => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  startDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
})
</script>

<style lang="scss" scoped>
.reports-header {
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

.report-actions {
  display: flex;
  gap: var(--spacing-3);
}

.report-filters {
  background: var(--white);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-6);
  display: flex;
  gap: var(--spacing-4);
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  min-width: 150px;

  label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--gray-700);
  }
}

.reports-grid {
  display: grid;
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
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--gray-100);
  border-radius: var(--radius-md);
}

.summary-label {
  font-weight: 500;
  color: var(--gray-700);
}

.summary-value {
  font-weight: bold;
  color: var(--primary-dark);
  font-size: var(--font-size-lg);
}

.top-products-report {
  max-height: 300px;
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

.sales-table-container {
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th,
  td {
    padding: var(--spacing-3);
    text-align: left;
    border-bottom: 1px solid var(--gray-200);
  }

  th {
    background: var(--gray-100);
    font-weight: 500;
    color: var(--gray-700);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tr:hover {
    background: var(--gray-50);
  }
}

@media (max-width: 768px) {
  .reports-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .report-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .report-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .report-summary {
    grid-template-columns: 1fr;
  }
}
</style>
