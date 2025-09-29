<template>
  <div class="users">
    <!-- Loading State -->
    <BaseLoading 
      :show="isLoading" 
      message="Carregando usuários..."
      variant="overlay"
    />

    <!-- Error State -->
    <BaseCard v-if="hasError" class="error-card">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div>
          <h3>Erro ao carregar usuários</h3>
          <p>Não foi possível carregar os usuários. Tente novamente.</p>
          <BaseButton @click="refreshData" variant="secondary">
            Tentar novamente
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Users Content -->
    <div v-else>
      <div class="users-header">
        <h2>Gerenciar Usuários</h2>
        <BaseButton @click="openNewUserModal" variant="primary">
          <span class="button-icon">➕</span>
          Novo Usuário
        </BaseButton>
      </div>

      <div class="users-list">
        <!-- Empty State -->
        <div v-if="!users || users.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>Nenhum usuário encontrado</h3>
          <p>Comece adicionando um novo usuário ao sistema.</p>
          <BaseButton @click="openNewUserModal" variant="primary">
            Adicionar Primeiro Usuário
          </BaseButton>
        </div>

        <!-- Users List -->
        <div v-else>
          <BaseCard
            v-for="user in users"
            :key="user.id"
            class="user-card"
            :class="`role-${user.role}`"
          >
            <div class="user-header">
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div class="user-role">
                  <span class="role-badge" :class="`role-${user.role}`">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </div>
              </div>
              <div class="user-actions">
                <BaseButton 
                  @click="editUser(user)" 
                  variant="secondary" 
                  size="sm"
                >
                  Editar
                </BaseButton>
                <BaseButton 
                  @click="deleteUser(user)" 
                  variant="danger" 
                  size="sm"
                  v-if="user.role !== 'admin'"
                >
                  Excluir
                </BaseButton>
              </div>
            </div>
            <div class="user-details">
              <div class="user-status">
                <span class="status-indicator" :class="{ active: user.is_active }"></span>
                {{ user.is_active ? 'Ativo' : 'Inativo' }}
              </div>
              <div class="user-date">
                Criado em {{ user.created_at ? formatDate(user.created_at) : 'N/A' }}
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <UserModal
      :show="showUserModal"
      :user="selectedUser"
      @update:show="showUserModal = $event"
      @success="handleUserSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUsers } from '../composables/useUsers'
import { useFormatter } from '@/composables/useUtils'
import BaseCard from '@/components/Base/Card.vue'
import BaseButton from '@/components/Base/Button.vue'
import BaseLoading from '@/components/Base/Loading.vue'
import UserModal from '../components/Modals/UserModal.vue'
import type { User } from '@/types/api'

const { users, isLoading, error, loadUsers, deleteUser: removeUser } = useUsers()
const { date: formatDate } = useFormatter()

// State
const showUserModal = ref(false)
const selectedUser = ref<User | null>(null)

// Computed
const hasError = computed(() => !!error.value)

// Methods
const refreshData = async () => {
  await loadUsers()
}

const openNewUserModal = () => {
  console.log('New user button clicked')
  selectedUser.value = null
  showUserModal.value = true
  console.log('Modal should be open:', showUserModal.value)
}

const editUser = (user: User) => {
  console.log('Edit user clicked:', user)
  selectedUser.value = user
  showUserModal.value = true
  console.log('Modal should be open:', showUserModal.value)
}

const deleteUser = async (user: User) => {
  if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
    try {
      await removeUser(user.id)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }
}

const handleUserSuccess = () => {
  showUserModal.value = false
  selectedUser.value = null
  refreshData()
}

const getRoleLabel = (role: User['role']) => {
  const labels: Record<User['role'], string> = {
    admin: 'Administrador',
    tenant_owner: 'Proprietário',
    staff: 'Atendente',
    client: 'Cliente'
  }
  return labels[role] || role
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>

<style lang="scss" scoped>
.users {
  padding: var(--spacing-4);
  max-width: 100%;
  overflow-x: hidden;
}

.users-header {
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
    font-weight: 700;
    line-height: 1.2;
  }
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.user-card {
  transition: all var(--transition-fast);
  border: 1px solid var(--gray-200);
  margin: 8px 0;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-3);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--spacing-1);
}

.user-email {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-bottom: var(--spacing-2);
}

.user-role {
  display: flex;
  align-items: center;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.role-admin {
    background: #fee2e2;
    color: #991b1b;
  }

  &.role-tenant_owner {
    background: #dbeafe;
    color: #1e40af;
  }

  &.role-staff {
    background: #d1fae5;
    color: #065f46;
  }

  &.role-client {
    background: #f3f4f6;
    color: #374151;
  }
}

.user-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.user-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--gray-100);
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.user-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gray-400);

  &.active {
    background: var(--success);
  }
}

.user-date {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-8);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--gray-300);

  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-4);
  }

  h3 {
    font-size: var(--font-size-xl);
    color: var(--gray-700);
    margin-bottom: var(--spacing-2);
  }

  p {
    color: var(--gray-600);
    margin-bottom: var(--spacing-6);
  }
}

.error-card {
  margin-bottom: var(--spacing-6);
}

.error-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);

  .error-icon {
    font-size: 2rem;
  }

  h3 {
    color: var(--danger);
    margin-bottom: var(--spacing-1);
  }

  p {
    color: var(--gray-600);
    margin-bottom: var(--spacing-3);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .users-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;

    h2 {
      font-size: var(--font-size-2xl);
    }
  }

  .user-header {
    flex-direction: column;
    align-items: stretch;
  }

  .user-actions {
    justify-content: center;
  }

  .user-details {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
