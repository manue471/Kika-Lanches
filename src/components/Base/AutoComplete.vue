<template>
  <div class="autocomplete" :class="{ 'is-open': isOpen }">
    <!-- Input Field -->
    <div class="autocomplete-input-wrapper">
      <BaseInput
        ref="inputRef"
        v-model="searchTerm"
        :placeholder="placeholder"
        :disabled="disabled"
        :error="error"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        class="autocomplete-input"
      />
      
      <!-- Loading Spinner -->
      <div v-if="isLoading" class="autocomplete-loading">
        <div class="spinner"></div>
      </div>
      
      <!-- Clear Button -->
      <button
        v-if="searchTerm && !disabled"
        @click="clearSelection"
        class="autocomplete-clear"
        type="button"
      >
        ✕
      </button>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen && !disabled" class="autocomplete-dropdown">
      <!-- Empty State -->
      <div v-if="!isLoading && filteredOptions.length === 0" class="autocomplete-empty">
        <div class="empty-icon">🔍</div>
        <p>{{ emptyMessage }}</p>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="autocomplete-loading-state">
        <div class="spinner"></div>
        <p>Buscando...</p>
      </div>

      <!-- Options List -->
      <ul v-else class="autocomplete-options">
        <li
          v-for="(option, index) in filteredOptions"
          :key="getOptionKey(option)"
          :class="{
            'autocomplete-option': true,
            'is-selected': index === selectedIndex,
            'is-highlighted': isHighlighted(option)
          }"
          @click="selectOption(option)"
          @mouseenter="selectedIndex = index"
        >
          <slot name="option" :option="option" :search-term="searchTerm">
            <div class="option-content">
              <div class="option-primary">
                {{ getOptionLabel(option) }}
              </div>
              <div v-if="getOptionSecondary(option)" class="option-secondary">
                {{ getOptionSecondary(option) }}
              </div>
            </div>
          </slot>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import BaseInput from './Input.vue'

interface Option {
  [key: string]: any
}

interface Props {
  modelValue?: Option | null
  options?: Option[]
  searchTerm?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  emptyMessage?: string
  labelKey?: string
  valueKey?: string
  secondaryKey?: string
  minSearchLength?: number
  debounceMs?: number
  isLoading?: boolean
  clearable?: boolean
  showInitialSuggestions?: boolean
  initialSuggestionsLimit?: number
  filterLocally?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Digite para buscar...',
  emptyMessage: 'Nenhum resultado encontrado',
  labelKey: 'name',
  valueKey: 'id',
  secondaryKey: '',
  minSearchLength: 1,
  debounceMs: 100,
  isLoading: false,
  clearable: true,
  showInitialSuggestions: true,
  initialSuggestionsLimit: 20,
  filterLocally: true
})

const emit = defineEmits<{
  'update:modelValue': [value: Option | null]
  'update:searchTerm': [value: string]
  'search': [term: string]
  'select': [option: Option]
  'clear': []
}>()

// Refs
const inputRef = ref<InstanceType<typeof BaseInput> | null>(null)
const searchTerm = ref(props.searchTerm || '')
const isOpen = ref(false)
const selectedIndex = ref(-1)
let searchTimeout: number | null = null

// Computed
const filteredOptions = computed(() => {
  if (!props.options || props.options.length === 0) return []
  
  // Filtra opções nulas ou inválidas
  const validOptions = props.options.filter(option => option != null && typeof option === 'object')
  
  if (validOptions.length === 0) return []
  
  const hasSearchTerm = searchTerm.value && searchTerm.value.length >= props.minSearchLength
  
  // Se não há termo de busca e showInitialSuggestions está ativo, mostra sugestões iniciais
  if (!hasSearchTerm && props.showInitialSuggestions) {
    return validOptions.slice(0, props.initialSuggestionsLimit)
  }
  
  // Se há termo de busca, filtra localmente
  if (hasSearchTerm && props.filterLocally) {
    return validOptions.filter(option => {
      if (!option) return false
      try {
        const label = getOptionLabel(option).toLowerCase()
        const secondary = getOptionSecondary(option)?.toLowerCase() || ''
        const term = searchTerm.value.toLowerCase()
        
        return label.includes(term) || secondary.includes(term)
      } catch (error) {
        console.warn('Error filtering option:', option, error)
        return false
      }
    })
  }
  
  // Se não está filtrando localmente, retorna vazio (aguarda busca na API)
  return []
})

// Methods
const getOptionKey = (option: Option): string | number => {
  if (!option || typeof option !== 'object') return String(option || '')
  return option[props.valueKey] || option.id || String(option)
}

const getOptionLabel = (option: Option): string => {
  if (!option || typeof option !== 'object') return String(option || '')
  return option[props.labelKey] || option.name || String(option)
}

const getOptionSecondary = (option: Option): string => {
  if (!props.secondaryKey || !option || typeof option !== 'object') return ''
  return option[props.secondaryKey] || ''
}

const isHighlighted = (option: Option): boolean => {
  if (!searchTerm.value || !option || typeof option !== 'object') return false
  
  try {
    const label = getOptionLabel(option).toLowerCase()
    const term = searchTerm.value.toLowerCase()
    
    return label.includes(term)
  } catch (error) {
    return false
  }
}

const handleInput = () => {
  emit('update:searchTerm', searchTerm.value)
  
  // Limpa timeout anterior se existir
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Sempre dispara o evento search com debounce, mesmo quando filtra localmente
  // Isso permite que o componente pai faça busca na API para complementar os resultados locais
  if (searchTerm.value.length >= props.minSearchLength) {
    searchTimeout = setTimeout(() => {
      emit('search', searchTerm.value)
    }, props.debounceMs)
  } else {
    // Se o termo é muito curto, emite evento vazio para limpar busca na API
    emit('search', '')
  }
  
  // Clear selection if search term doesn't match
  if (props.modelValue && typeof props.modelValue === 'object') {
    try {
      if (getOptionLabel(props.modelValue) !== searchTerm.value) {
        emit('update:modelValue', null)
      }
    } catch (error) {
      // Se houver erro ao obter o label, limpa a seleção
      emit('update:modelValue', null)
    }
  }
  
  selectedIndex.value = -1
  isOpen.value = true
}

const handleFocus = () => {
  if (!props.disabled) {
    isOpen.value = true
    // Se há opções disponíveis e showInitialSuggestions está ativo, 
    // as sugestões já aparecerão via computed filteredOptions
  }
}

const handleBlur = () => {
  // Delay to allow click events to fire
  setTimeout(() => {
    isOpen.value = false
    selectedIndex.value = -1
  }, 150)
}

const handleKeydown = (event: Event) => {
  if (!isOpen.value || !event) return
  
  const keyboardEvent = event as KeyboardEvent
  
  switch (keyboardEvent.key) {
    case 'ArrowDown':
      keyboardEvent.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredOptions.value.length - 1)
      break
    case 'ArrowUp':
      keyboardEvent.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      keyboardEvent.preventDefault()
      if (selectedIndex.value >= 0 && filteredOptions.value[selectedIndex.value]) {
        selectOption(filteredOptions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      keyboardEvent.preventDefault()
      isOpen.value = false
      selectedIndex.value = -1
      break
  }
}

const selectOption = (option: Option) => {
  emit('update:modelValue', option)
  emit('select', option)
  searchTerm.value = getOptionLabel(option)
  isOpen.value = false
  selectedIndex.value = -1
}

const clearSelection = () => {
  emit('update:modelValue', null)
  emit('clear')
  searchTerm.value = ''
  isOpen.value = false
  selectedIndex.value = -1
  inputRef.value?.$el?.focus()
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && typeof newValue === 'object') {
    try {
      searchTerm.value = getOptionLabel(newValue)
    } catch (error) {
      console.warn('Error getting label from modelValue:', newValue, error)
      searchTerm.value = ''
    }
  } else if (!searchTerm.value) {
    searchTerm.value = ''
  }
}, { immediate: true })

watch(() => props.searchTerm, (newValue) => {
  if (newValue !== undefined) {
    searchTerm.value = newValue
  }
})

// Lifecycle
onMounted(() => {
  if (props.modelValue && typeof props.modelValue === 'object') {
    try {
      searchTerm.value = getOptionLabel(props.modelValue)
    } catch (error) {
      console.warn('Error getting label from modelValue on mount:', props.modelValue, error)
    }
  }
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style lang="scss" scoped>
.autocomplete {
  position: relative;
  width: 100%;
}

.autocomplete-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.autocomplete-input {
  width: 100%;
}

.autocomplete-loading {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.autocomplete-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--gray-500);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 1;
  
  &:hover {
    background: var(--gray-100);
    color: var(--gray-700);
  }
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}

.autocomplete-empty {
  padding: var(--spacing-4);
  text-align: center;
  color: var(--gray-500);
  
  .empty-icon {
    font-size: 24px;
    margin-bottom: var(--spacing-2);
  }
  
  p {
    margin: 0;
    font-size: var(--font-size-sm);
  }
}

.autocomplete-loading-state {
  padding: var(--spacing-4);
  text-align: center;
  color: var(--gray-500);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  
  p {
    margin: 0;
    font-size: var(--font-size-sm);
  }
}

.autocomplete-options {
  list-style: none;
  margin: 0;
  padding: 0;
}

.autocomplete-option {
  padding: var(--spacing-3);
  cursor: pointer;
  border-bottom: 1px solid var(--gray-100);
  transition: background-color var(--transition-fast);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover,
  &.is-selected {
    background: var(--primary-50);
  }
  
  &.is-highlighted {
    .option-primary {
      font-weight: 600;
    }
  }
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-primary {
  font-size: var(--font-size-sm);
  color: var(--gray-900);
  font-weight: 500;
}

.option-secondary {
  font-size: var(--font-size-xs);
  color: var(--gray-600);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 768px) {
  .autocomplete-dropdown {
    max-height: 250px;
  }
  
  .autocomplete-option {
    padding: var(--spacing-2);
  }
}
</style>
