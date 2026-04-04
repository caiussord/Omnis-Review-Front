<script setup lang="ts">
import { ref } from 'vue'
import { AuthModeSwitch, LoginForm, RegisterForm } from '../components/auth'
import type { LoginPayload, Mode, RegisterPayload } from '../types/auth'

type AuthResponse = {
  token?: string
  expiration?: string
  message?: string
  Message?: string
}

const mode = ref<Mode>('login')
const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | ''>('')

const apiBase = '/api/auth'

function selectMode(nextMode: Mode) {
  mode.value = nextMode
  statusMessage.value = ''
  statusType.value = ''
}

function setStatus(type: 'success' | 'error', message: string) {
  statusType.value = type
  statusMessage.value = message
}

async function postAuth<TPayload extends Record<string, string>>(endpoint: 'login' | 'register', payload: TPayload) {
  const response = await fetch(`${apiBase}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let data: AuthResponse | null = null

  try {
    data = (await response.json()) as AuthResponse
  } catch {
    data = null
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.Message || 'Nao foi possivel concluir a requisicao.'
    throw new Error(errorMessage)
  }

  return data
}

async function submitLogin(payload: LoginPayload) {
  if (!payload.email || !payload.password) {
    setStatus('error', 'Preencha email e senha para entrar.')
    return
  }

  isLoading.value = true
  statusMessage.value = ''

  try {
    const data = await postAuth('login', payload)

    if (data?.token) {
      localStorage.setItem('omnis_token', data.token)
    }

    if (data?.expiration) {
      localStorage.setItem('omnis_token_expiration', data.expiration)
    }

    setStatus('success', 'Login realizado com sucesso.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao fazer login.'
    setStatus('error', message)
  } finally {
    isLoading.value = false
  }
}

async function submitRegister(payload: RegisterPayload) {
  if (!payload.name || !payload.email || !payload.userName || !payload.birth_Date || !payload.password) {
    setStatus('error', 'Preencha todos os campos do cadastro.')
    return
  }

  isLoading.value = true
  statusMessage.value = ''

  try {
    const data = await postAuth('register', payload)
    const okMessage = data?.message || data?.Message || 'Cadastro concluido com sucesso.'

    setStatus('success', okMessage)
    mode.value = 'login'
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao cadastrar.'
    setStatus('error', message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-page__glow auth-page__glow--left" aria-hidden="true"></section>
    <section class="auth-page__glow auth-page__glow--right" aria-hidden="true"></section>

    <div class="auth-card">
      <p class="auth-card__brand">Omnis Review</p>
      <h1 class="auth-card__title">Seu universo de reviews em um unico lugar</h1>
      <p class="auth-card__subtitle">Series, livros, jogos e muito mais. Entre agora ou crie sua conta.</p>

      <AuthModeSwitch :mode="mode" @select="selectMode" />

      <LoginForm v-if="mode === 'login'" :is-loading="isLoading" @submit="submitLogin" />
      <RegisterForm v-else :is-loading="isLoading" @submit="submitRegister" />

      <p v-if="statusMessage" class="auth-status"
        :class="statusType === 'success' ? 'auth-status--success' : 'auth-status--error'">
        {{ statusMessage }}
      </p>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  overflow: hidden;
  padding: 1.5rem;
  color: #f8fafc;
  background:
    radial-gradient(circle at 15% 15%, #504bd5 0%, rgba(80, 75, 213, 0) 35%),
    radial-gradient(circle at 80% 15%, #2835bd 0%, rgba(40, 53, 189, 0) 40%),
    linear-gradient(135deg, #130f40 0%, #1c2f73 45%, #202c92 100%);
}

.auth-page__glow {
  position: absolute;
  border-radius: 9999px;
  opacity: 0.65;
  filter: blur(70px);
}

.auth-page__glow--left {
  left: -2.5rem;
  top: -2.5rem;
  width: 260px;
  height: 260px;
  background: #6f67ff;
}

.auth-page__glow--right {
  right: -5rem;
  bottom: -5rem;
  width: 340px;
  height: 340px;
  background: #32a0ff;
}

.auth-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  background: rgba(19, 18, 64, 0.7);
  box-shadow:
    0 30px 70px rgba(12, 8, 40, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.auth-card__brand {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9dd3ff;
}

.auth-card__title {
  margin: 0.5rem 0;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
}

.auth-card__subtitle {
  margin: 0 0 18px;
  font-size: 0.95rem;
  color: #c6ceff;
}

.auth-status {
  margin-top: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 0.9rem;
}

.auth-status--success {
  border-color: rgba(46, 194, 138, 0.4);
  background: rgba(46, 194, 138, 0.18);
  color: #90ffd5;
}

.auth-status--error {
  border-color: rgba(255, 104, 144, 0.4);
  background: rgba(255, 104, 144, 0.16);
  color: #ffc7d6;
}
</style>