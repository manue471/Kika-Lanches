<template>
  <BaseModal
    :show="show"
    :title="isEditing ? 'Editar Produto' : 'Novo Produto'"
    size="lg"
    @update:show="$emit('update:show', $event)"
  >
    <form @submit.prevent="handleSubmit" class="product-form">
      <div class="form-grid">
        <!-- Nome do Produto -->
        <div class="form-group">
          <label for="name" class="form-label">Nome do Produto *</label>
          <BaseInput
            id="name"
            v-model="form.name"
            placeholder="Ex: X-Burger Clássico"
            :error="errors.name"
            required
          />
        </div>

        <!-- SKU -->
        <div class="form-group">
          <label for="sku" class="form-label">SKU</label>
          <BaseInput
            id="sku"
            v-model="form.sku"
            placeholder="Ex: XB001"
            :error="errors.sku"
          />
        </div>

        <!-- Categoria -->
        <div class="form-group">
          <label for="category" class="form-label">Categoria</label>
          <BaseSelect
            id="category"
            v-model="form.category_id"
            :options="categoryOptions"
            :placeholder="isLoadingCategories ? 'Carregando categorias...' : 'Selecione uma categoria'"
            :error="errors.category_id"
            :disabled="isLoadingCategories"
          />
        </div>

        <!-- Preço -->
        <div class="form-group">
          <label for="price" class="form-label">Preço *</label>
          <BaseInput
            id="price"
            v-model="form.price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            :error="errors.price"
            required
          />
        </div>

        <!-- Estoque -->
        <div class="form-group">
          <label for="stock_quantity" class="form-label">Estoque</label>
          <BaseInput
            id="stock_quantity"
            v-model="form.stock_quantity"
            type="number"
            min="0"
            placeholder="0"
            :error="errors.stock_quantity"
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
              Produto ativo
            </label>
          </div>
        </div>
      </div>

      <!-- Descrição -->
      <div class="form-group">
        <label for="description" class="form-label">Descrição</label>
        <textarea
          id="description"
          v-model="form.description"
          class="form-textarea"
          placeholder="Descreva o produto..."
          rows="3"
          :class="{ 'error': errors.description }"
        ></textarea>
        <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
      </div>

      <!-- Imagem -->
      <div class="form-group">
        <label for="image" class="form-label">Imagem</label>
        <BaseInput
          id="image"
          v-model="form.image"
          placeholder="URL da imagem"
          :error="errors.image"
        />
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
import { useProducts } from '@/composables/useProducts'
import { useCategories } from '@/composables/useCategories'
import BaseModal from '@/components/Base/Modal.vue'
import BaseInput from '@/components/Base/Input.vue'
import BaseSelect from '@/components/Base/Select.vue'
import BaseButton from '@/components/Base/Button.vue'
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/types/api'

interface Props {
  show: boolean
  product?: Product | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': [product: Product]
}>()

const { createProduct, updateProduct, isCreating, isUpdating } = useProducts()
const { categoryOptions, isLoading: isLoadingCategories } = useCategories()

// Form state
const form = ref<CreateProductRequest & UpdateProductRequest>({
  name: '',
  description: '',
  price: 0,
  sku: '',
  category_id: undefined,
  is_active: true,
  stock_quantity: 0,
  image: ''
})

const errors = ref<Record<string, string>>({})
const isSubmitting = computed(() => isCreating.value || isUpdating.value)
const isEditing = computed(() => !!props.product)

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    price: 0,
    sku: '',
    category_id: undefined,
    is_active: true,
    stock_quantity: 0,
    image: ''
  }
  errors.value = {}
}

// Watch for product changes
watch(() => props.product, (product) => {
  if (product) {
    form.value = {
      name: product.name,
      description: product.description || '',
      price: product.price,
      sku: product.sku || '',
      category_id: product.category_id,
      is_active: product.is_active,
      stock_quantity: product.stock_quantity || 0,
      image: product.image || ''
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
    errors.value.name = 'Nome é obrigatório'
  }

  if (!form.value.price || form.value.price <= 0) {
    errors.value.price = 'Preço deve ser maior que zero'
  }

  if (form.value.stock_quantity !== undefined && form.value.stock_quantity < 0) {
    errors.value.stock_quantity = 'Estoque não pode ser negativo'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    let result: Product | null = null

    if (isEditing.value && props.product) {
      result = await updateProduct(props.product.id, form.value)
    } else {
      result = await createProduct(form.value)
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
.product-form {
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
  .product-form {
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
