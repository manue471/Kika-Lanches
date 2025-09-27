<template>
  <div class="register-container">
    <!-- Background Gradient -->
    <div class="register-background"></div>
    

    <!-- Logo -->
    <div class="logo-container">
      <img src="/icons/login-logo.png" alt="Kika Lanches" class="logo" />
    </div>

    <!-- Register Form -->
    <div class="register-form">
      <form @submit.prevent="handleRegister" class="form">
        <!-- Name Field -->
        <div class="input-group">
          <label for="name" class="input-label">Nome</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="input-field"
            placeholder="Digite seu nome completo"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Email Field -->
        <div class="input-group">
          <label for="email" class="input-label">E-mail</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="input-field"
            placeholder="Digite seu e-mail"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Password Field -->
        <div class="input-group">
          <label for="password" class="input-label">Senha</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="input-field"
            placeholder="Digite sua senha"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Confirm Password Field -->
        <div class="input-group">
          <label for="confirmPassword" class="input-label">Confirmar Senha</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="input-field"
            placeholder="Confirme sua senha"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Phone Field -->
        <div class="input-group">
          <label for="phone" class="input-label">Celular</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="input-field"
            placeholder="Digite seu celular"
            :disabled="isLoading"
          />
        </div>

        <!-- Register Button -->
        <button
          type="submit"
          class="register-button"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Cadastrando...' : 'Cadastrar' }}
        </button>

        <!-- Login Link -->
        <router-link to="/login" class="login-link">
          Já tem uma conta? Entrar
        </router-link>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const { register, isLoading } = useAuth()
const { showNotification } = useNotifications()

// Form data
const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

// Computed
const isFormValid = computed(() => {
  return (
    form.value.name.trim() !== '' &&
    form.value.email.trim() !== '' &&
    form.value.password.trim() !== '' &&
    form.value.confirmPassword.trim() !== '' &&
    form.value.password === form.value.confirmPassword
  )
})

// Methods
const handleRegister = async () => {
  if (!isFormValid.value) {
    showNotification('Por favor, preencha todos os campos corretamente', 'warning')
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    showNotification('As senhas não coincidem', 'error')
    return
  }

  try {
    const result = await register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      password_confirmation: form.value.confirmPassword,
      phone: form.value.phone
    })

    if (result) {
      showNotification('Cadastro realizado com sucesso!', 'success')
      router.push('/login')
    }
  } catch (error) {
    console.error('Register error:', error)
  }
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.register-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8a50 0%, #ff7043 50%, #ffab40 100%);
  z-index: -1;
}


.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px 30px;
  margin-top: 40px;

  .logo {
    width: 100px;
    height: 100px;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.register-form {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  margin-left: 4px;
}

.input-field {
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  outline: none;

  &:focus {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    background: white;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #999;
  }
}

.register-button {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  margin-top: 10px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-link {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: white;
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .logo-container {
    padding: 30px 20px 20px;
    margin-top: 30px;

    .logo {
      width: 80px;
      height: 80px;
    }
  }

  .register-form {
    padding: 20px 16px;
  }

  .form {
    gap: 18px;
  }

  .input-field,
  .register-button {
    padding: 14px 18px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .logo-container {
    padding: 20px 20px 15px;
    margin-top: 20px;

    .logo {
      width: 70px;
      height: 70px;
    }
  }

  .register-form {
    padding: 16px;
  }

  .form {
    gap: 16px;
  }

  .input-field,
  .register-button {
    padding: 12px 16px;
    font-size: 14px;
  }
}
</style>
