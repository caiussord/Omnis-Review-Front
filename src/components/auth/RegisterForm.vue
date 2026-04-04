<script setup lang="ts">
import { reactive } from 'vue'
import type { RegisterPayload } from '../../types/auth'

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  submit: [payload: RegisterPayload]
}>()

const form = reactive<RegisterPayload>({
  name: '',
  email: '',
  userName: '',
  birth_Date: '',
  password: '',
})

function handleSubmit() {
  if (form.name && form.email && form.userName && form.birth_Date && form.password) {
    emit('submit', {
      name: form.name.trim(),
      email: form.email.trim(),
      userName: form.userName.trim(),
      birth_Date: form.birth_Date,
      password: form.password,
    })
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <div class="auth-field">
      <label for="name" class="auth-label">Nome</label>
      <input id="name" v-model="form.name" type="text" required autocomplete="name" placeholder="Seu nome"
        class="auth-input" />
    </div>

    <div class="auth-field">
      <label for="username" class="auth-label">Usuário</label>
      <input id="username" v-model="form.userName" type="text" required autocomplete="username"
        placeholder="Seu usuário" class="auth-input" />
    </div>

    <div class="auth-field">
      <label for="register-email" class="auth-label">Email</label>
      <input id="register-email" v-model="form.email" type="email" required autocomplete="email"
        placeholder="voce@email.com" class="auth-input" />
    </div>

    <div class="auth-field">
      <label for="birthdate" class="auth-label">Data de nascimento</label>
      <input id="birthdate" v-model="form.birth_Date" type="date" required class="auth-input" />
    </div>

    <div class="auth-field">
      <label for="register-password" class="auth-label">Senha</label>
      <input id="register-password" v-model="form.password" type="password" required autocomplete="new-password"
        placeholder="Crie uma senha" class="auth-input" />
    </div>

    <button class="auth-submit" type="submit" :disabled="isLoading">
      <span v-if="isLoading" class="auth-submit__loading">
        Criando conta...
      </span>
      <span v-else>Criar conta</span>
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
</style>
