<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import type { RegisterFormPayload } from '../../types/auth'

const props = defineProps<{
  isLoading: boolean
  backendBaseUrl: string
}>()

type UsernameCheckState = 'idle' | 'checking' | 'available' | 'taken' | 'error'

const emit = defineEmits<{
  submit: [payload: RegisterFormPayload]
}>()

const form = reactive<RegisterFormPayload>({
  name: '',
  email: '',
  userName: '',
  birth_Date: '',
  password: '',
  confirmPassword: '',
})

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const usernameCheckState = ref<UsernameCheckState>('idle')
const usernameCheckMessage = ref('')
const isUsernameDirty = ref(false)

let usernameCheckTimeout: number | null = null
let usernameAbortController: AbortController | null = null

const passwordRules = computed(() => {
  const password = typeof form.password === 'string' ? form.password : ''

  return [
    {
      label: 'Mínimo de 8 caracteres',
      passed: password.length >= 8,
    },
    {
      label: 'Uma letra minúscula',
      passed: /[a-z]/.test(password),
    },
    {
      label: 'Uma letra maiúscula',
      passed: /[A-Z]/.test(password),
    },
    {
      label: 'Um número',
      passed: /\d/.test(password),
    },
    {
      label: 'Um símbolo',
      passed: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: 'As senhas conferem',
      passed: !!password && !!form.confirmPassword && password === form.confirmPassword,
    },
  ]
})

const isPasswordValid = computed(() => passwordRules.value.slice(0, 5).every((rule) => rule.passed))
const doPasswordsMatch = computed(() => {
  const password = typeof form.password === 'string' ? form.password : ''
  const confirmPassword = typeof form.confirmPassword === 'string' ? form.confirmPassword : ''

  return password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
})

async function checkUsernameAvailability(username: string) {
  const normalizedUsername = username.trim()

  if (!normalizedUsername) {
    usernameCheckState.value = 'idle'
    usernameCheckMessage.value = ''
    return
  }

  usernameAbortController?.abort()
  usernameAbortController = new AbortController()

  usernameCheckState.value = 'checking'
  usernameCheckMessage.value = 'Verificando disponibilidade...'

  try {
    const response = await fetch(`${props.backendBaseUrl}/username-exists?userName=${encodeURIComponent(normalizedUsername)}`, {
      method: 'GET',
      signal: usernameAbortController.signal,
    })

    if (!response.ok) {
      if (response.status === 400) {
        usernameCheckState.value = 'error'
        usernameCheckMessage.value = 'Informe um nome de usuario.'
        return
      }

      throw new Error('Falha ao verificar o nome de usuario.')
    }

    const data = (await response.json()) as { exists?: boolean; message?: string; Message?: string }
    const available = !(data.exists ?? false)

    if (available) {
      usernameCheckState.value = 'available'
      usernameCheckMessage.value = 'Nome de usuario disponivel.'
    } else {
      usernameCheckState.value = 'taken'
      usernameCheckMessage.value = data.message || data.Message || 'Nome de usuario ja esta em uso.'
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    usernameCheckState.value = 'error'
    usernameCheckMessage.value = 'Nao foi possivel verificar o nome de usuario.'
  }
}

watch(
  () => form.userName,
  (newValue) => {
    isUsernameDirty.value = true
    usernameCheckState.value = 'idle'
    usernameCheckMessage.value = ''

    if (usernameCheckTimeout) {
      window.clearTimeout(usernameCheckTimeout)
    }

    if (!newValue.trim()) {
      return
    }

    usernameCheckTimeout = window.setTimeout(() => {
      void checkUsernameAvailability(newValue)
    }, 450)
  },
)

onBeforeUnmount(() => {
  if (usernameCheckTimeout) {
    window.clearTimeout(usernameCheckTimeout)
  }

  usernameAbortController?.abort()
})

function handleSubmit() {
  if (form.name && form.email && form.userName && form.birth_Date && form.password && form.confirmPassword) {
    if (!isPasswordValid.value || !doPasswordsMatch.value) {
      return
    }

    emit('submit', {
      name: form.name.trim(),
      email: form.email.trim(),
      userName: form.userName.trim(),
      birth_Date: form.birth_Date,
      password: form.password,
      confirmPassword: form.confirmPassword,
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
      <p v-if="isUsernameDirty && usernameCheckMessage" class="username-status" :class="{
        'username-status--checking': usernameCheckState === 'checking',
        'username-status--available': usernameCheckState === 'available',
        'username-status--taken': usernameCheckState === 'taken',
        'username-status--error': usernameCheckState === 'error',
      }">
        {{ usernameCheckMessage }}
      </p>
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
      <div class="auth-password-field">
        <input id="register-password" v-model="form.password" :type="isPasswordVisible ? 'text' : 'password'" required
          autocomplete="new-password" placeholder="Crie uma senha" class="auth-input auth-input--password" />
        <button type="button" class="auth-password-toggle" :aria-pressed="isPasswordVisible"
          @click="isPasswordVisible = !isPasswordVisible">
          {{ isPasswordVisible ? 'Ocultar' : 'Ver senha' }}
        </button>
      </div>
    </div>

    <ul class="password-rules" aria-label="Requisitos de senha">
      <li v-for="rule in passwordRules" :key="rule.label" class="password-rule"
        :class="rule.passed ? 'password-rule--passed' : 'password-rule--pending'">
        <span class="password-rule__icon">{{ rule.passed ? '✓' : '•' }}</span>
        <span>{{ rule.label }}</span>
      </li>
    </ul>

    <div class="auth-field">
      <label for="confirm-password" class="auth-label">Confirmar senha</label>
      <div class="auth-password-field">
        <input id="confirm-password" v-model="form.confirmPassword"
          :type="isConfirmPasswordVisible ? 'text' : 'password'" required autocomplete="new-password"
          placeholder="Repita a senha" class="auth-input auth-input--password" />
        <button type="button" class="auth-password-toggle" :aria-pressed="isConfirmPasswordVisible"
          @click="isConfirmPasswordVisible = !isConfirmPasswordVisible">
          {{ isConfirmPasswordVisible ? 'Ocultar' : 'Ver senha' }}
        </button>
      </div>
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

.password-rules {
  list-style: none;
  margin: -0.25rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.password-rule {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  transition: color 0.15s ease, opacity 0.15s ease;
}

.password-rule__icon {
  width: 1rem;
  flex: 0 0 1rem;
  text-align: center;
  font-weight: 900;
}

.password-rule--passed {
  color: #86efac;
}

.password-rule--pending {
  color: rgba(199, 210, 254, 0.75);
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

.username-status {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
}

.username-status--checking {
  color: rgba(199, 210, 254, 0.8);
}

.username-status--available {
  color: #86efac;
}

.username-status--taken {
  color: #fca5a5;
}

.username-status--error {
  color: #fcd34d;
}
</style>
