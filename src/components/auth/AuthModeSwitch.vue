<script setup lang="ts">
import type { Mode } from '../../types/auth'

defineProps<{
  mode: Mode
}>()

const emit = defineEmits<{
  select: [mode: Mode]
}>()
</script>

<template>
  <div class="auth-switch" role="tablist" aria-label="Alternar formulário">
    <button type="button" :aria-selected="mode === 'login'" class="auth-switch__button"
      :class="{ 'auth-switch__button--active': mode === 'login' }" @click="emit('select', 'login')">
      Login
    </button>
    <button type="button" :aria-selected="mode === 'register'" class="auth-switch__button"
      :class="{ 'auth-switch__button--active': mode === 'register' }" @click="emit('select', 'register')">
      Cadastro
    </button>
  </div>
</template>

<style scoped>
.auth-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.375rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
}

.auth-switch__button {
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: rgb(199 210 254);
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.auth-switch__button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.auth-switch__button--active {
  background: linear-gradient(135deg, #2D006B, #3E6B00);
  color: #ffffff;
}
</style>
