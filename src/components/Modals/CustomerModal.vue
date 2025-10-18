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
            type="tel"
            placeholder="(11) 99999-9999"
            :error="errors.phone"
            @input="formatPhone"
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

      <!-- Informações de Classe -->
      <div class="form-section">
        <h4 class="form-section-title">Informações de Classe</h4>
        <div class="form-grid">
          <!-- Classe -->
          <div class="form-group">
            <label for="class" class="form-label">Classe</label>
            <BaseInput
              id="class"
              v-model="classInfo.class"
              placeholder="Ex: 3º A, 5º B, etc."
              :error="errors.class"
            />
          </div>

          <!-- Responsável -->
          <div class="form-group">
            <label for="guardian" class="form-label">Responsável</label>
            <BaseInput
              id="guardian"
              v-model="classInfo.guardian"
              placeholder="Nome do responsável"
              :error="errors.guardian"
            />
          </div>

          <!-- Telefone do Responsável -->
          <div class="form-group">
            <label for="guardian_phone" class="form-label">Telefone do Responsável</label>
            <BaseInput
              id="guardian_phone"
              v-model="classInfo.guardian_phone"
              type="tel"
              placeholder="(11) 99999-9999"
              :error="errors.guardian_phone"
              @input="formatGuardianPhone"
            />
          </div>

          <!-- Observações -->
          <div class="form-group full-width">
            <label for="notes" class="form-label">Observações</label>
            <textarea
              id="notes"
              v-model="classInfo.notes"
              class="form-textarea"
              placeholder="Observações adicionais sobre o aluno..."
              rows="3"
              :class="{ 'error': errors.notes }"
            ></textarea>
            <span v-if="errors.notes" class="form-error">{{ errors.notes }}</span>
          </div>
        </div>
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

// Class info state
const classInfo = ref({
  class: '',
  guardian: '',
  guardian_phone: '',
  notes: ''
})

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
  classInfo.value = {
    class: '',
    guardian: '',
    guardian_phone: '',
    notes: ''
  }
  errors.value = {}
}

const formatPhone = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // Remove non-digits
  
  if (value.length <= 11) {
    if (value.length >= 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    }
    if (value.length >= 10) {
      value = value.slice(0, 10) + '-' + value.slice(10)
    }
  }
  
  form.value.phone = value
}

const formatGuardianPhone = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // Remove non-digits
  
  if (value.length <= 11) {
    if (value.length >= 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    }
    if (value.length >= 10) {
      value = value.slice(0, 10) + '-' + value.slice(10)
    }
  }
  
  classInfo.value.guardian_phone = value
}

// Watch for modal show/hide
watch(() => props.show, (show) => {
  if (show) {
    // Load customer data if editing
    if (props.customer) {
      form.value = {
        name: props.customer.name,
        email: props.customer.email || '',
        phone: props.customer.phone || '',
        is_active: props.customer.is_active,
        preferences: props.customer.preferences || {}
      }
      
      // Load class_info from preferences
      const classInfoData = props.customer.preferences?.class_info || {}
      classInfo.value = {
        class: classInfoData.class || '',
        guardian: classInfoData.guardian || '',
        guardian_phone: classInfoData.guardian_phone || '',
        notes: classInfoData.notes || ''
      }
    }
  } else {
    // Clear form when modal closes
    resetForm()
  }
})

// No longer needed - we use structured classInfo instead

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
    // Build preferences with class_info structure
    form.value.preferences = {
      class_info: {
        class: classInfo.value.class,
        guardian: classInfo.value.guardian,
        guardian_phone: classInfo.value.guardian_phone,
        notes: classInfo.value.notes
      }
    }

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

  .form-section {
    margin-top: var(--spacing-6);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--gray-200);
  }

  .form-section-title {
    margin: 0 0 var(--spacing-4) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-dark);
  }

  .form-group.full-width {
    grid-column: 1 / -1;
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
      background: var(--primary);
      border-color: var(--primary);

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
