<template>
  <div class="customer-report-overview">
    <!-- Receipt Header -->
    <div class="receipt-header">
      <div class="company-info">
        <h2>🍔 Kika Lanches</h2>
        <p>Relatório de Cliente</p>
      </div>
      <div class="report-info">
        <p><strong>Período:</strong> {{ customerReport.period_info.period_label }}</p>
        <p><strong>Data:</strong> {{ formatDate(new Date()) }}</p>
      </div>
    </div>

    <!-- Customer Info -->
    <div class="customer-info">
      <h3>📋 Dados do Cliente</h3>
      <div class="customer-details">
        <div class="detail-row">
          <span class="label">Nome:</span>
          <span class="value">{{ customerReport.customer.name }}</span>
        </div>
        <div v-if="customerReport.customer.email" class="detail-row">
          <span class="label">Email:</span>
          <span class="value">{{ customerReport.customer.email }}</span>
        </div>
        <div v-if="customerReport.customer.phone" class="detail-row">
          <span class="label">Telefone:</span>
          <span class="value">{{ customerReport.customer.phone }}</span>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      <h3>📊 Resumo</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Total de Pedidos</span>
          <span class="summary-value">{{ customerReport.summary.total_orders }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Valor Total Gasto</span>
          <span class="summary-value">{{ formatCurrency(customerReport.summary.total_spent) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Ticket Médio</span>
          <span class="summary-value">{{ formatCurrency(customerReport.summary.average_order_value) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Último Pedido</span>
          <span class="summary-value">{{ formatDate(customerReport.summary.last_order_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="orders-section">
      <h3>🛒 Pedidos Recentes</h3>
      <div v-if="customerReport.recent_orders.length === 0" class="no-orders">
        <p>Nenhum pedido encontrado no período selecionado.</p>
      </div>
      <div v-else class="orders-list">
        <div 
          v-for="order in customerReport.recent_orders" 
          :key="order.id"
          class="order-item"
        >
          <div class="order-header">
            <div class="order-info">
              <span class="order-number">{{ order.order_number }}</span>
              <span class="order-date">{{ formatDate(order.created_at) }}</span>
            </div>
            <div class="order-payment">
              <span class="payment-icon">{{ getPaymentIcon(order.payment_method) }}</span>
              <span class="payment-label">{{ getPaymentLabel(order.payment_method) }}</span>
            </div>
            <div class="order-status">
              <StatusBadge :status="order.status" />
            </div>
            <div class="order-total">
              {{ formatCurrency(order.total_amount) }}
            </div>
          </div>
          
          <!-- Order Products -->
          <div class="order-products">
            <div 
              v-for="product in order.products" 
              :key="product.id"
              class="product-item"
            >
              <span class="product-name">{{ product.name }} - Qtd: {{ product.quantity }} - {{ formatCurrency((product as any).unit_price) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Footer -->
    <div class="receipt-footer">
      <div class="footer-line"></div>
      <p class="footer-text">
        Relatório gerado em {{ formatDate(new Date()) }}<br>
        Período: {{ customerReport.period_info.date_range.from }} a {{ customerReport.period_info.date_range.to }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormatter } from '@/composables/useUtils'
import StatusBadge from '@/components/Business/StatusBadge.vue'
import type { CustomerReportResponse } from '@/types/api'

interface Props {
  customerReport: CustomerReportResponse
}

defineProps<Props>()

const { currency, date } = useFormatter()

const formatCurrency = (value: number) => currency(value)
const formatDate = (dateValue: string | Date) => date(dateValue)

// Payment method helpers
const getPaymentIcon = (paymentMethod: string) => {
  const icons: Record<string, string> = {
    cartao_credito: '💳',
    pix: '🔑',
    dinheiro: '💵',
    a_prazo: '📋'
  }
  return icons[paymentMethod] || '💰'
}

const getPaymentLabel = (paymentMethod: string) => {
  const labels: Record<string, string> = {
    cartao_credito: 'Cartão de Crédito',
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    a_prazo: 'À Prazo'
  }
  return labels[paymentMethod] || paymentMethod
}
</script>

<style lang="scss" scoped>
.customer-report-overview {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.receipt-header {
  background: var(--gray-50);
  color: black;
  padding: var(--spacing-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .company-info {
    h2 {
      margin: 0;
      font-size: var(--font-size-2xl);
      color: black;
      font-weight: 700;
    }
    
    p {
      margin: var(--spacing-1) 0 0 0;
      opacity: 0.9;
    }
  }
  
  .report-info {
    text-align: right;
    
    p {
      margin: var(--spacing-1) 0;
      font-size: var(--font-size-sm);
    }
  }
}

.customer-info {
  padding: var(--spacing-6);
  background: white;
  border-bottom: 1px solid var(--gray-200);
  
  h3 {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--gray-900);
    font-size: var(--font-size-lg);
    font-weight: 700;
  }
  
  .customer-details {
    display: grid;
    gap: var(--spacing-3);
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--gray-200);
    
    .label {
      font-weight: 600;
      color: var(--gray-800);
    }
    
    .value {
      color: var(--gray-900);
      font-weight: 500;
    }
  }
}

.summary-section {
  padding: var(--spacing-6);
  background: var(--gray-100);
  border-bottom: 1px solid var(--gray-200);
  
  h3 {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--gray-900);
    font-size: var(--font-size-lg);
    font-weight: 700;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }
  
  .summary-item {
    background: white;
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    text-align: center;
    border: 1px solid var(--gray-300);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    .summary-label {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--gray-700);
      margin-bottom: var(--spacing-2);
      font-weight: 500;
    }
    
    .summary-value {
      display: block;
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--primary);
    }
  }
}

.orders-section {
  padding: var(--spacing-6);
  background: white;
  
  h3 {
    margin: 0 0 var(--spacing-4) 0;
    color: var(--gray-900);
    font-size: var(--font-size-lg);
    font-weight: 700;
  }
  
  .no-orders {
    text-align: center;
    padding: var(--spacing-8);
    color: var(--gray-600);
    font-weight: 500;
  }
  
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  
  .order-item {
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--gray-50);
    
    .order-header {
      background: var(--gray-100);
      padding: var(--spacing-4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-2);
      
      .order-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-1);
        
        .order-number {
          font-weight: 700;
          color: var(--gray-900);
          font-size: var(--font-size-base);
        }
        
        .order-date {
          font-size: var(--font-size-sm);
          color: var(--gray-700);
          font-weight: 500;
        }
      }
      
      .order-payment {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-2) var(--spacing-3);
        background: var(--gray-50);
        border-radius: var(--radius-md);
        border: 1px solid var(--gray-200);
        
        .payment-icon {
          font-size: var(--font-size-lg);
        }
        
        .payment-label {
          font-size: var(--font-size-sm);
          color: var(--gray-700);
          font-weight: 500;
        }
      }
      
      .order-total {
        font-weight: 700;
        font-size: var(--font-size-lg);
        color: var(--primary);
      }
    }
    
    .order-products {
      padding: var(--spacing-4);
      background: white;
      
      .product-item {
        padding: var(--spacing-2) 0;
        border-bottom: 1px solid var(--gray-200);
        
        &:last-child {
          border-bottom: none;
        }
        
        .product-name {
          font-weight: 600;
          color: var(--gray-900);
          font-size: var(--font-size-sm);
        }
      }
    }
  }
}

.receipt-footer {
  background: var(--gray-100);
  padding: var(--spacing-6);
  text-align: center;
  
  .footer-line {
    height: 1px;
    background: var(--gray-300);
    margin-bottom: var(--spacing-4);
  }
  
  .footer-text {
    font-size: var(--font-size-sm);
    color: var(--gray-700);
    margin: 0;
    line-height: 1.5;
    font-weight: 500;
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .receipt-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-4);
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .order-header {
    flex-direction: column;
    align-items: stretch !important;
    gap: var(--spacing-3) !important;
  }
}
</style>

