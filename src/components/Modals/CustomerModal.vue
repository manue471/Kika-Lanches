<template>
  <BaseModal
    :show="show"
    :title="isEditing ? 'Editar Cliente' : 'Novo Cliente'"
    size="md"
    @update:show="$emit('update:show', $event)"
  >
    <form @submit.prevent="handleSubmit" class="customer-form">
      <div class="form-grid">
        <!-- Nome do Cliente -->
        <div class="form-group">
          <label for="name" class="form-label">Nome do Cliente *</label>
          <BaseInput
            id="name"
            v-model="form.name"
            placeholder="Ex: João Silva"
            :error="errors.name"
            required
          />
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <BaseInput
            id="email"
            v-model="form.email"
            type="email"
            placeholder="joao@exemplo.com"
            :error="errors.email"
          />
        </div>

        <!-- Telefone -->
        <div class="form-group">
          <label for="phone" class="form-label">Telefone</label>
          <BaseInput
            id="phone"
            v-model="form.phone"
            placeholder="(11) 99999-9999"
            :error="errors.phone"
          />
        </div>

        <!-- Status -->
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="form-checkbox-group">
            <label class="form-checkbox">
              <input
                v-model="form.is_active"
                type="checkbox"
              />
              <span class="checkmark"></span>
              Cliente ativo
            </label>
          </div>
        </div>
      </div>

      <!-- Preferências -->
      <div class="form-group">
        <label for="preferences" class="form-label">Preferências</label>
        <textarea
          id="preferences"
          v-model="preferencesText"
          class="form-textarea"
          placeholder="Ex: Vegetariano, sem cebola, etc."
          rows="3"
          :class="{ 'error': errors.preferences }"
        ></textarea>
        <span v-if="errors.preferences" class="form-error">{{ errors.preferences }}</span>
      </div>
    </form>

    <template #footer>
      <div class="modal-actions">
        <BaseButton
          type="button"
          variant="secondary"
          @click="$emit('update:show', false)"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Atualizar' : 'Criar' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCustomers } from '@/composables/useCustomers'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseButton from '@/components/Base/Button.vue'
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/api'

interface Props {
  show: boolean
  customer?: Customer | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': [customer: Customer]
}>()

const { createCustomer, updateCustomer, isCreating, isUpdating } = useCustomers()

// Form state
const form = ref<CreateCustomerRequest & UpdateCustomerRequest>({
  name: '',
  email: '',
  phone: '',
  is_active: true,
  preferences: {}
})

const preferencesText = ref('')
const errors = ref<Record<string, string>>({})
const isSubmitting = computed(() => isCreating.value || isUpdating.value)
const isEditing = computed(() => !!props.customer)

const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    phone: '',
    is_active: true,
    preferences: {}
  }
  preferencesText.value = ''
  errors.value = {}
}

// Watch for customer changes
watch(() => props.customer, (customer) => {
  if (customer) {
    form.value = {
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      is_active: customer.is_active,
      preferences: customer.preferences || {}
    }
    preferencesText.value = customer.preferences ? 
      Object.entries(customer.preferences).map(([key, value]) => `${key}: ${value}`).join('\n') : ''
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal show/hide
watch(() => props.show, (show) => {
  if (!show) {
    resetForm()
  }
})

const parsePreferences = (text: string): Record<string, any> => {
  if (!text.trim()) return {}
  
  const preferences: Record<string, any> = {}
  const lines = text.split('\n').filter(line => line.trim())
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      preferences[key.trim()] = valueParts.join(':').trim()
    }
  })
  
  return preferences
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Nome é obrigatório'
  }

  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Email inválido'
  }

  if (form.value.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(form.value.phone)) {
    errors.value.phone = 'Telefone deve estar no formato (11) 99999-9999'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    // Parse preferences
    form.value.preferences = parsePreferences(preferencesText.value)

    let result: Customer | null = null

    if (isEditing.value && props.customer) {
      result = await updateCustomer(props.customer.id, form.value)
    } else {
      result = await createCustomer(form.value)
    }

    if (result) {
      emit('success', result)
      emit('update:show', false)
    }
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}
</script>

<style lang="scss" scoped>
.customer-form {
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-6);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .form-label {
    font-weight: 500;
    color: var(--gray-700);
    font-size: var(--font-size-sm);
  }

  .form-textarea {
    width: 100%;
    padding: var(--spacing-3);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-family: inherit;
    resize: vertical;
    transition: border-color var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--primary-light);
      box-shadow: 0 0 0 3px rgba(92, 219, 149, 0.1);
    }

    &.error {
      border-color: var(--danger);
    }
  }

  .form-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .form-checkbox {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--gray-700);

    input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid var(--gray-300);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      position: relative;

      &::after {
        content: '✓';
        color: var(--white);
        font-size: 12px;
        opacity: 0;
        transition: opacity var(--transition-fast);
      }
    }

    input[type="checkbox"]:checked + .checkmark {
      background: var(--primary-medium);
      border-color: var(--primary-medium);

      &::after {
        opacity: 1;
      }
    }
  }

  .form-error {
    color: var(--danger);
    font-size: var(--font-size-xs);
    margin-top: var(--spacing-1);
  }
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

// Mobile optimizations
@media (max-width: 768px) {
  .customer-form {
    .form-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-3);
    }
  }

  .modal-actions {
    flex-direction: column;
    
    > * {
      width: 100%;
    }
  }
}
</style>
