<template>
  <BaseModal
    :show="show"
    :title="isEditing ? 'Editar Usuário' : 'Novo Usuário'"
    size="md"
    @update:show="$emit('update:show', $event)"
  >
    <form @submit.prevent="submitUser" class="user-form">
      <!-- Name Field -->
      <div class="form-group">
        <label for="name" class="form-label">Nome Completo</label>
        <BaseInput
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Digite o nome completo"
          :error="errors.name"
          :disabled="isSubmitting"
          required
        />
      </div>

      <!-- Email Field -->
      <div class="form-group">
        <label for="email" class="form-label">E-mail</label>
        <BaseInput
          id="email"
          v-model="form.email"
          type="email"
          placeholder="Digite o e-mail"
          :error="errors.email"
          :disabled="isSubmitting"
          required
        />
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password" class="form-label">
          {{ isEditing ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha' }}
        </label>
        <div class="password-input-container">
          <BaseInput
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="isEditing ? 'Digite a nova senha' : 'Digite a senha'"
            :error="errors.password"
            :disabled="isSubmitting"
            :required="!isEditing"
            class="password-input"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showPassword = !showPassword"
            :disabled="isSubmitting"
          >
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <!-- Role Field -->
      <div class="form-group">
        <label for="role" class="form-label">Função</label>
        <BaseSelect
          id="role"
          v-model="form.role"
          :options="roleOptions"
          :error="errors.role"
          :disabled="isSubmitting"
          required
        />
      </div>

      <!-- Phone Field (Optional) -->
      <div class="form-group">
        <label for="phone" class="form-label">Telefone (Opcional)</label>
        <BaseInput
          id="phone"
          v-model="form.phone"
          type="tel"
          placeholder="Digite o telefone"
          :error="errors.phone"
          :disabled="isSubmitting"
        />
      </div>

      <!-- Active Status -->
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="status-toggle">
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="form.is_active"
              :disabled="isSubmitting"
              class="toggle-input"
            />
            <span class="toggle-slider"></span>
            <span class="toggle-text">
              {{ form.is_active ? 'Usuário Ativo' : 'Usuário Inativo' }}
            </span>
          </label>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <BaseButton
          type="button"
          variant="secondary"
          @click="$emit('update:show', false)"
          :disabled="isSubmitting"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :loading="isSubmitting"
          :disabled="!isFormValid"
        >
          {{ isEditing ? 'Atualizar' : 'Criar' }} Usuário
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUsers } from '../../composables/useUsers'
import { useAuth } from '@/composables/useAuth'
// import { useNotifications } from '@/composables/useNotifications'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseButton from '@/components/Base/Button.vue'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/api'

interface Props {
  show: boolean
  user?: User | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': [user: User]
}>()

const { createUser, updateUser, isCreating, isUpdating } = useUsers()
const { user: currentUser } = useAuth()
// const { showNotification } = useNotifications()

// Debug logs
console.log('UserModal mounted, props:', props)

// Form state
const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'staff' as User['role'],
  phone: '',
  is_active: true
})

const errors = ref<Record<string, string>>({})
const showPassword = ref(false)

// Computed
const isSubmitting = computed(() => isCreating.value || isUpdating.value)
const isEditing = computed(() => !!props.user)

const isFormValid = computed(() => {
  return form.value.name.trim() !== '' &&
         form.value.email.trim() !== '' &&
         (isEditing.value || form.value.password.trim() !== '') &&
         form.value.role
})

// Role options
const roleOptions = [
  { value: 'staff', label: 'Atendente' },
  { value: 'admin', label: 'Administrador' }
]

// Form reset function
const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    is_active: true
  }
  errors.value = {}
}

// Watch for modal show/hide
watch(() => props.show, (show) => {
  if (show) {
    // Load user data if editing
    if (props.user) {
      form.value = {
        name: props.user.name,
        email: props.user.email,
        password: '', // Don't populate password for security
        role: props.user.role,
        phone: props.user.phone || '',
        is_active: props.user.is_active
      }
    }
  } else {
    // Clear form when modal closes
    resetForm()
  }
})

const validateForm = () => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Nome é obrigatório'
  }

  if (!form.value.email.trim()) {
    errors.value.email = 'E-mail é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'E-mail inválido'
  }

  if (!isEditing.value && !form.value.password.trim()) {
    errors.value.password = 'Senha é obrigatória'
  } else if (form.value.password.trim() && form.value.password.length < 6) {
    errors.value.password = 'Senha deve ter pelo menos 6 caracteres'
  }

  if (!form.value.role) {
    errors.value.role = 'Função é obrigatória'
  }

  return Object.keys(errors.value).length === 0
}

const submitUser = async () => {
  console.log('Submit user called, form:', form.value)
  console.log('Is editing:', isEditing.value)
  
  if (!validateForm()) {
    console.log('Form validation failed')
    return
  }

  try {
    let result: User | null = null

    if (isEditing.value && props.user) {
      const updateData: UpdateUserRequest = {
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        phone: form.value.phone || undefined,
        is_active: form.value.is_active
      }

      // Only include password if it's provided
      if (form.value.password.trim()) {
        updateData.password = form.value.password
      }

      result = await updateUser(props.user.id, updateData)
    } else {
      // Get tenant_id from current logged user
      const tenantId = currentUser.value?.tenant_id
      
      if (!tenantId) {
        console.error('No tenant_id found for current user')
        errors.value.general = 'Erro ao obter informações do usuário logado'
        return
      }

      const createData: CreateUserRequest = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        role: form.value.role,
        tenant_id: tenantId,
        phone: form.value.phone || undefined,
        is_active: form.value.is_active
      }

      console.log('Creating user with data:', createData)
      result = await createUser(createData)
      console.log('User creation result:', result)
    }

    if (result) {
      emit('success', result)
      emit('update:show', false)
    }
  } catch (error) {
    console.error('Error submitting user:', error)
  }
}
</script>

<style lang="scss" scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-weight: 600;
  color: var(--gray-700);
  font-size: var(--font-size-sm);
}

.password-input-container {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
}

.password-input {
  padding-right: 48px !important;
  width: 100%;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 33%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-size: 18px;
  color: var(--gray-500);
  transition: color var(--transition-fast);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  &:hover {
    color: var(--gray-700);
    background: var(--gray-100);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.status-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 24px;
  background: var(--gray-300);
  border-radius: 12px;
  transition: background-color var(--transition-fast);

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform var(--transition-fast);
  }
}

.toggle-input:checked + .toggle-slider {
  background: var(--primary);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(26px);
}

.toggle-text {
  font-size: var(--font-size-sm);
  color: var(--gray-700);
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--gray-200);
  margin-top: var(--spacing-2);
}

// Mobile optimizations
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>
