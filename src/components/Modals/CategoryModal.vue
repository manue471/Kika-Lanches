<template>
  <BaseModal :show="props.show" :title="modalTitle" @close="closeModal">
    <form @submit.prevent="handleSubmit" class="category-form">
      <div class="form-grid">
        <BaseInput
          v-model="form.name"
          label="Nome da Categoria"
          placeholder="Ex: Lanches, Bebidas, Sobremesas"
          :error="errors.name"
          required
        />

        <BaseInput
          v-model="form.description"
          label="Descrição"
          placeholder="Descreva a categoria..."
          :error="errors.description"
        />

        <div class="form-row">
          <BaseInput
            v-model="form.image"
            label="URL da Imagem"
            placeholder="https://exemplo.com/imagem.jpg"
            :error="errors.image"
          />
        </div>

        <div class="form-row">
          <label class="checkbox-label">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">Categoria ativa</span>
          </label>
        </div>
      </div>

      <div class="modal-actions">
        <BaseButton type="button" variant="secondary" @click="closeModal" :disabled="isSubmitting">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" variant="primary" :loading="isSubmitting">
          {{ isEditMode ? 'Salvar Alterações' : 'Criar Categoria' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseButton from '@/components/Base/Button.vue'
import { useCategories } from '@/composables/useCategories'
import { useNotifications } from '@/composables/useNotifications'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/api'

interface Props {
  show: boolean
  category?: Category | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const { createCategory, updateCategory, isCreating, isUpdating } = useCategories()
const notifications = useNotifications()

const form = ref<CreateCategoryRequest>({
  name: '',
  description: '',
  image: '',
  is_active: true
})

const errors = ref<Record<string, string>>({})

const isEditMode = computed(() => !!props.category)
const modalTitle = computed(() => isEditMode.value ? 'Editar Categoria' : 'Nova Categoria')
const isSubmitting = computed(() => isCreating.value || isUpdating.value)

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    image: '',
    is_active: true
  }
  errors.value = {}
}

// Watch for category changes
watch(() => props.category, (category) => {
  if (category) {
    form.value = {
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      is_active: category.is_active
    }
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

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Nome da categoria é obrigatório'
  }

  if (form.value.name.length < 2) {
    errors.value.name = 'Nome deve ter pelo menos 2 caracteres'
  }

  if (form.value.name.length > 100) {
    errors.value.name = 'Nome deve ter no máximo 100 caracteres'
  }

  if (form.value.description && form.value.description.length > 500) {
    errors.value.description = 'Descrição deve ter no máximo 500 caracteres'
  }

  if (form.value.image && !isValidUrl(form.value.image)) {
    errors.value.image = 'URL da imagem deve ser válida'
  }

  return Object.keys(errors.value).length === 0
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    notifications.error('Por favor, corrija os erros do formulário')
    return
  }

  try {
    if (isEditMode.value && props.category) {
      await updateCategory(props.category.id, form.value as UpdateCategoryRequest)
    } else {
      await createCategory(form.value)
    }
    emit('success')
    closeModal()
  } catch (err: any) {
    // Errors are handled by useCategories composable
  }
}

const closeModal = () => {
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
.category-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-color);
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
}

.checkbox-text {
  font-weight: var(--font-weight-medium);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--gray-200);
}

@media (max-width: 768px) {
  .modal-actions {
    flex-direction: column;
    
    > * {
      width: 100%;
    }
  }
}
</style>
