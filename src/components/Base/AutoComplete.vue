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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
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
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Digite para buscar...',
  emptyMessage: 'Nenhum resultado encontrado',
  labelKey: 'name',
  valueKey: 'id',
  secondaryKey: '',
  minSearchLength: 1,
  debounceMs: 300,
  isLoading: false,
  clearable: true
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
  if (!props.options) return []
  
  if (!searchTerm.value || searchTerm.value.length < props.minSearchLength) {
    return []
  }
  
  return props.options.filter(option => {
    const label = getOptionLabel(option).toLowerCase()
    const secondary = getOptionSecondary(option)?.toLowerCase() || ''
    const term = searchTerm.value.toLowerCase()
    
    return label.includes(term) || secondary.includes(term)
  })
})

// Methods
const getOptionKey = (option: Option): string | number => {
  return option[props.valueKey] || option.id || option
}

const getOptionLabel = (option: Option): string => {
  return option[props.labelKey] || option.name || String(option)
}

const getOptionSecondary = (option: Option): string => {
  if (!props.secondaryKey) return ''
  return option[props.secondaryKey] || ''
}

const isHighlighted = (option: Option): boolean => {
  if (!searchTerm.value) return false
  
  const label = getOptionLabel(option).toLowerCase()
  const term = searchTerm.value.toLowerCase()
  
  return label.includes(term)
}

const handleInput = () => {
  emit('update:searchTerm', searchTerm.value)
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    if (searchTerm.value.length >= props.minSearchLength) {
      emit('search', searchTerm.value)
    }
  }, props.debounceMs)
  
  // Clear selection if search term doesn't match
  if (props.modelValue && getOptionLabel(props.modelValue) !== searchTerm.value) {
    emit('update:modelValue', null)
  }
  
  selectedIndex.value = -1
  isOpen.value = true
}

const handleFocus = () => {
  if (!props.disabled) {
    isOpen.value = true
  }
}

const handleBlur = () => {
  // Delay to allow click events to fire
  setTimeout(() => {
    isOpen.value = false
    selectedIndex.value = -1
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredOptions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && filteredOptions.value[selectedIndex.value]) {
        selectOption(filteredOptions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
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
  if (newValue) {
    searchTerm.value = getOptionLabel(newValue)
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
  if (props.modelValue) {
    searchTerm.value = getOptionLabel(props.modelValue)
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
