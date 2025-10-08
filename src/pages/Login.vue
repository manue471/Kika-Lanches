<template>
  <div class="login-container">
    <!-- Background Gradient -->
    <div class="login-background"></div>
    

    <!-- Logo -->
    
    <!-- Login Form -->
    <div class="logo-container">
      <img src="/icons/login-logo.png" alt="Kika Lanches" class="logo" />
    </div>
    <div class="login-form">
      <form @submit.prevent="handleLogin" class="form">
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

        <!-- Login Button -->
        <button
          type="submit"
          class="login-button"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Entrando...' : 'Entrar' }}
        </button>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const { login, isLoading } = useAuth()
const { showNotification } = useNotifications()

// Form data
const form = ref({
  email: '',
  password: ''
})

// Computed
const isFormValid = computed(() => {
  return form.value.email.trim() !== '' && form.value.password.trim() !== ''
})

// Methods
const handleLogin = async () => {
  if (!isFormValid.value) return

  try {
    const result = await login({
      email: form.value.email,
      password: form.value.password
    })

    if (result) {
      showNotification('Login realizado com sucesso!', 'success')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Login error:', error)
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, #5a6bb8 100%);
  z-index: -1;
}


.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  margin-bottom: 20px;

  .logo {
    max-width: 200px;
    max-height: 200px;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.login-form {
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
  gap: 24px;
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

.login-button {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
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

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
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

.create-account-link {
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
    padding: 40px 20px 30px;
    margin-top: 40px;

    .logo {
      width: 100px;
      height: 100px;
    }
  }

  .login-form {
    padding: 20px 16px;
  }

  .form {
    gap: 20px;
  }

  .input-field,
  .login-button {
    padding: 14px 18px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .logo-container {
    padding: 30px 20px 20px;
    margin-top: 30px;

    .logo {
      width: 80px;
      height: 80px;
    }
  }

  .login-form {
    padding: 16px;
  }

  .form {
    gap: 18px;
  }

  .input-field,
  .login-button {
    padding: 12px 16px;
    font-size: 14px;
  }
}
</style>
