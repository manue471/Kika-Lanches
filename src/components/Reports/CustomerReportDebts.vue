<template>
  <div class="customer-report-debts">
    <!-- Balance Summary -->
    <div class="balance-card">
      <div class="balance-info">
        <div class="balance-label">Débito Atual</div>
        <div class="balance-value" :class="{ 'has-debt': currentBalance > 0, 'no-debt': currentBalance === 0 }">
          {{ formatCurrency(currentBalance) }}
        </div>
      </div>
      <BaseButton
        v-if="currentBalance > 0"
        variant="primary"
        @click="$emit('open-pay-debt')"
        :disabled="!customer"
      >
        💰 Quitar Débito
      </BaseButton>
      <div v-else class="no-debt-badge">
        ✓ Sem débitos
      </div>
    </div>

    <!-- Debt History -->
    <div class="debt-history-section">
      <div class="section-header">
        <h3>Histórico de Débitos e Pagamentos</h3>
        <BaseSelect
          v-model="debtTypeFilter"
          :options="debtTypeOptions"
          class="filter-select"
        />
      </div>

      <!-- Loading State -->
      <BaseLoading 
        v-if="isLoading" 
        :show="isLoading"
        message="Carregando histórico..."
      />

      <!-- Debt History List -->
      <div v-else class="debt-history-list">
        <div v-if="debts.length === 0" class="empty-debts">
          <div class="empty-icon">📋</div>
          <p>Nenhum registro de débito ou pagamento encontrado.</p>
        </div>
        <div v-else class="debt-items">
          <div 
            v-for="debt in debts" 
            :key="debt.id"
            class="debt-item"
            :class="debt.type"
          >
            <div class="debt-icon">
              <span v-if="debt.type === 'debit'">📋</span>
              <span v-else>💰</span>
            </div>
            <div class="debt-content">
              <div class="debt-header">
                <div class="debt-type-label">
                  <span v-if="debt.type === 'debit'" class="type-badge debit">Débito</span>
                  <span v-else class="type-badge payment">Pagamento</span>
                  <span class="debt-date">{{ formatDate(debt.created_at) }}</span>
                </div>
                <div class="debt-amount" :class="debt.type">
                  <span v-if="debt.type === 'debit'" class="amount-debit">+ {{ formatCurrency(debt.amount) }}</span>
                  <span v-else class="amount-payment">- {{ formatCurrency(debt.amount) }}</span>
                </div>
              </div>
              <div v-if="debt.description" class="debt-description">
                {{ debt.description }}
              </div>
              <div class="debt-balance-info">
                <span class="balance-before">Saldo anterior: {{ formatCurrency(debt.balance_before ?? 0) }}</span>
                <span class="arrow">→</span>
                <span class="balance-after">Saldo atual: {{ formatCurrency(debt.balance_after ?? 0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="debt-pagination">
          <BaseButton
            variant="secondary"
            size="sm"
            @click="$emit('previous-page')"
            :disabled="currentPage === 1 || isLoading"
          >
            ← Anterior
          </BaseButton>
          <span class="page-info">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="$emit('next-page')"
            :disabled="currentPage >= totalPages || isLoading"
          >
            Próxima →
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFormatter } from '@/composables/useUtils'
import BaseButton from '@/components/Base/Button.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import type { CustomerDebt } from '@/types/api'

// Partial customer type for component props (only what we need)
interface CustomerBasic {
  id: number
  name: string
  balance?: number
}

interface Props {
  customer: CustomerBasic | null
  currentBalance: number
  debts: CustomerDebt[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  debtTypeFilter?: 'debit' | 'payment'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'open-pay-debt': []
  'filter-change': [value: 'debit' | 'payment' | undefined]
  'previous-page': []
  'next-page': []
}>()

const { currency, date } = useFormatter()

const formatCurrency = (value: number) => currency(value)
const formatDate = (dateValue: string | Date) => date(dateValue)

// Debt type filter options
const debtTypeOptions = [
  { value: '', label: 'Todos' },
  { value: 'debit', label: 'Apenas Débitos' },
  { value: 'payment', label: 'Apenas Pagamentos' }
]

// Local reactive filter - use empty string for "all"
const debtTypeFilter = ref<string>(props.debtTypeFilter || '')
const isMounted = ref(false)

// Watch prop changes (sync from parent)
watch(() => props.debtTypeFilter, (newValue) => {
  const stringValue = newValue || ''
  if (debtTypeFilter.value !== stringValue) {
    debtTypeFilter.value = stringValue
  }
}, { immediate: true })

// Watch for local filter changes to emit to parent (only after mount)
watch(debtTypeFilter, (newValue, oldValue) => {
  // Only emit if component is mounted and value actually changed
  if (isMounted.value && newValue !== oldValue && oldValue !== undefined) {
    // Convert empty string back to undefined for the emit
    emit('filter-change', newValue === '' ? undefined : newValue as 'debit' | 'payment')
  }
}, { immediate: false })

onMounted(() => {
  isMounted.value = true
})
</script>

<style lang="scss" scoped>
.customer-report-debts {
  padding: var(--spacing-6);
}

.balance-card {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  .balance-info {
    flex: 1;
    
    .balance-label {
      font-size: var(--font-size-sm);
      opacity: 0.9;
      margin-bottom: var(--spacing-2);
      font-weight: 500;
    }
    
    .balance-value {
      font-size: var(--font-size-3xl);
      font-weight: 700;
      line-height: 1;
      
      &.has-debt {
        color: var(--warning-light, #fee2e2);
      }
      
      &.no-debt {
        color: var(--success-light, #d1fae5);
      }
    }
  }
  
  .no-debt-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: var(--spacing-3) var(--spacing-5);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: var(--font-size-base);
  }
}

.debt-history-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
    flex-wrap: wrap;
    gap: var(--spacing-4);
    
    h3 {
      margin: 0;
      color: var(--gray-900);
      font-size: var(--font-size-xl);
      font-weight: 700;
    }
    
    .filter-select {
      min-width: 180px;
    }
  }
  
  .empty-debts {
    text-align: center;
    padding: var(--spacing-8);
    
    .empty-icon {
      font-size: 3rem;
      margin-bottom: var(--spacing-3);
      opacity: 0.5;
    }
    
    p {
      color: var(--gray-600);
      margin: 0;
      font-size: var(--font-size-base);
    }
  }
  
  .debt-history-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  
  .debt-items {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .debt-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    background: var(--gray-50);
    border-radius: var(--radius-md);
    border-left: 4px solid transparent;
    transition: all var(--transition-fast);
    
    &:hover {
      background: var(--gray-100);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &.debit {
      border-left-color: var(--warning);
    }
    
    &.payment {
      border-left-color: var(--success);
    }
    
    .debt-icon {
      font-size: var(--font-size-xl);
      line-height: 1;
      margin-top: var(--spacing-1);
    }
    
    .debt-content {
      flex: 1;
      
      .debt-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-2);
        flex-wrap: wrap;
        gap: var(--spacing-2);
        
        .debt-type-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          flex-wrap: wrap;
          
          .type-badge {
            padding: var(--spacing-1) var(--spacing-2);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-xs);
            font-weight: 600;
            text-transform: uppercase;
            
            &.debit {
              background: var(--warning-light, #fef3c7);
              color: var(--warning-dark, #92400e);
            }
            
            &.payment {
              background: var(--success-light, #d1fae5);
              color: var(--success-dark, #065f46);
            }
          }
          
          .debt-date {
            font-size: var(--font-size-sm);
            color: var(--gray-600);
          }
        }
        
        .debt-amount {
          font-weight: 700;
          font-size: var(--font-size-lg);
          
          &.debit {
            color: var(--warning-dark, #92400e);
          }
          
          &.payment {
            color: var(--success-dark, #065f46);
          }
          
          .amount-debit::before {
            content: '+ ';
          }
          
          .amount-payment::before {
            content: '- ';
          }
        }
      }
      
      .debt-description {
        font-size: var(--font-size-sm);
        color: var(--gray-700);
        margin-bottom: var(--spacing-2);
        font-style: italic;
      }
      
      .debt-balance-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        font-size: var(--font-size-xs);
        color: var(--gray-600);
        flex-wrap: wrap;
        
        .balance-before,
        .balance-after {
          font-weight: 500;
        }
        
        .arrow {
          color: var(--gray-400);
        }
        
        .balance-after {
          color: var(--primary);
          font-weight: 600;
        }
      }
    }
  }
  
  .debt-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-4);
    margin-top: var(--spacing-6);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--gray-200);
    
    .page-info {
      font-size: var(--font-size-sm);
      color: var(--gray-600);
      font-weight: 500;
    }
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .balance-card {
    flex-direction: column;
    gap: var(--spacing-4);
    text-align: center;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch !important;
    
    h3 {
      margin-bottom: var(--spacing-2);
    }
    
    .filter-select {
      width: 100%;
    }
  }
  
  .debt-header {
    flex-direction: column;
    align-items: stretch !important;
  }
}
</style>

