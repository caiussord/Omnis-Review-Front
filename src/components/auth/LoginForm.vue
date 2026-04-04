<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { LoginPayload } from '../../types/auth'

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  submit: [payload: LoginPayload]
  forgotPassword: []
}>()

const form = reactive<LoginPayload>({
  email: '',
  password: '',
})

const isPasswordVisible = ref(false)

function handleSubmit() {
  // Uma validação simples antes de emitir
  if (form.email && form.password) {
    emit('submit', {
      email: form.email.trim(),
      password: form.password,
    })
  }
}
</script>
<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <div class="auth-field">
      <label for="email" class="auth-label">Email ou usuário</label>
      <input id="email" v-model="form.email" type="text" required autocomplete="username"
        placeholder="voce@email.com ou seu usuario" class="auth-input" />
    </div>

    <div class="auth-field">
      <label for="password" class="auth-label">Senha</label>
      <div class="auth-password-field">
        <input id="password" v-model="form.password" :type="isPasswordVisible ? 'text' : 'password'" required
          autocomplete="current-password" placeholder="Sua senha" class="auth-input auth-input--password" />
        <button type="button" class="auth-password-toggle" :aria-pressed="isPasswordVisible"
          @click="isPasswordVisible = !isPasswordVisible">
          {{ isPasswordVisible ? 'Ocultar' : 'Ver senha' }}
        </button>
      </div>
    </div>

    <button class="auth-submit" type="submit" :disabled="isLoading">
      <span v-if="isLoading" class="auth-submit__loading">
        Entrando...
      </span>
      <span v-else>Entrar</span>
    </button>

    <button class="auth-forgot-password" type="button" @click="emit('forgotPassword')">
      Esqueci minha senha
    </button>
  </form>
</template>

<style scoped>
.auth-form {
  display: grid;
  gap: 1rem;
}

.auth-field {
  display: grid;
  gap: 0.375rem;
}

.auth-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(199 210 254);
}

.auth-input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #ffffff;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.auth-password-field {
  position: relative;
}

.auth-input--password {
  padding-right: 6rem;
}

.auth-password-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  border-radius: 9999px;
  background: rgba(99, 102, 241, 0.15);
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #dbeafe;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.auth-password-toggle:hover {
  background: rgba(99, 102, 241, 0.28);
}

.auth-input::placeholder {
  color: rgba(165, 180, 252, 0.5);
}

.auth-input:focus {
  border-color: rgb(96 165 250);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.auth-submit {
  margin-top: 0.5rem;
  border: 0;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  padding: 0.75rem 1rem;
  font-weight: 700;
  color: #ffffff;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
}

.auth-submit:hover:enabled {
  transform: scale(1.02);
  filter: brightness(1.1);
}

.auth-submit:active:enabled {
  transform: scale(0.98);
}

.auth-submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.auth-submit__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.auth-forgot-password {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #bfdbfe;
  text-align: center;
  cursor: pointer;
  transition: color 0.15s ease, opacity 0.15s ease;
}

.auth-forgot-password:hover {
  color: #ffffff;
}
</style>