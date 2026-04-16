<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../services/authApi'
import { ApiError } from '../services/apiClient'

const router = useRouter()
const identifier = ref('')
const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | ''>('')

function translateMessage(message: string): string {
    const normalizedMessage = message.trim()

    if (normalizedMessage.includes('Email not found')) {
        return 'Nao encontramos um usuario com esse email.'
    }

    if (normalizedMessage.includes('User not found')) {
        return 'Nao encontramos um usuario com esses dados.'
    }

    if (normalizedMessage.includes('If the account exists, a reset link was sent.')) {
        return 'Caso seu dado esteja correto foi enviado um link de redefinicao de senha para seu email.'
    }

    return normalizedMessage
}

async function handleSubmit() {
    const normalizedIdentifier = identifier.value.trim()

    if (!normalizedIdentifier) {
        statusType.value = 'error'
        statusMessage.value = 'Informe seu email ou usuario.'
        return
    }

    isLoading.value = true
    statusMessage.value = ''

    try {
        const data = await authApi.forgotPassword({
            userNameOrEmail: normalizedIdentifier,
        })

        statusType.value = 'success'
        statusMessage.value = translateMessage(data?.message || data?.Message || 'Caso seu dado esteja correto foi enviado um link de redefinição de senha para seu e-mail.')
    } catch (error) {
        statusType.value = 'error'
        if (error instanceof ApiError || error instanceof Error) {
            statusMessage.value = translateMessage(error.message)
        } else {
            statusMessage.value = 'Erro inesperado ao solicitar a redefinicao.'
        }
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <main class="forgot-page">
        <section class="forgot-page__glow forgot-page__glow--left" aria-hidden="true"></section>
        <section class="forgot-page__glow forgot-page__glow--right" aria-hidden="true"></section>

        <div class="forgot-card">
            <p class="forgot-card__brand">Omnis Review</p>
            <h1 class="forgot-card__title">Esqueci minha senha</h1>
            <p class="forgot-card__subtitle">Informe seu email ou usuario para receber o link de redefinicao.</p>

            <form class="forgot-form" @submit.prevent="handleSubmit">
                <div class="forgot-field">
                    <label for="identifier" class="forgot-label">Email ou usuário</label>
                    <input id="identifier" v-model="identifier" type="text" autocomplete="username"
                        placeholder="voce@email.com ou seu usuario" class="forgot-input" />
                </div>

                <button class="forgot-submit" type="submit" :disabled="isLoading">
                    <span v-if="isLoading">Enviando...</span>
                    <span v-else>Enviar link de recuperação</span>
                </button>
            </form>

            <button class="forgot-back" type="button" @click="router.push('/')">
                Voltar para o login
            </button>

            <p v-if="statusMessage" class="forgot-status"
                :class="statusType === 'success' ? 'forgot-status--success' : 'forgot-status--error'">
                {{ statusMessage }}
            </p>
        </div>
    </main>
</template>

<style scoped>
.forgot-page {
    position: relative;
    display: grid;
    min-height: 100vh;
    place-items: center;
    overflow: hidden;
    padding: 1.5rem;
    color: #f8fafc;
    background:
        radial-gradient(circle at 15% 15%, #2D006B 0%, rgba(45, 0, 107, 0) 35%),
        radial-gradient(circle at 80% 15%, #3E6B00 0%, rgba(62, 107, 0, 0) 40%),
        linear-gradient(140deg, #1a0d4a 0%, #2d006b 34%, #2b3650 56%, #3e6b00 100%);
}

.forgot-page__glow {
    position: absolute;
    border-radius: 9999px;
    opacity: 0.65;
    filter: blur(70px);
}

.forgot-page__glow--left {
    left: -2.5rem;
    top: -2.5rem;
    width: 260px;
    height: 260px;
    background: #2D006B;
}

.forgot-page__glow--right {
    right: -5rem;
    bottom: -5rem;
    width: 340px;
    height: 340px;
    background: #3E6B00;
}

.forgot-card {
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

.forgot-card__brand {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9dd3ff;
}

.forgot-card__title {
    margin: 0.5rem 0;
    font-size: clamp(1.45rem, 3vw, 2rem);
    font-weight: 700;
    line-height: 1.2;
}

.forgot-card__subtitle {
    margin: 0 0 18px;
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba(226, 232, 240, 0.8);
}

.forgot-form {
    display: grid;
    gap: 1rem;
}

.forgot-field {
    display: grid;
    gap: 0.375rem;
}

.forgot-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(199 210 254);
}

.forgot-input {
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

.forgot-input::placeholder {
    color: rgba(165, 180, 252, 0.5);
}

.forgot-input:focus {
    border-color: rgb(62, 107, 0);
    box-shadow: 0 0 0 4px rgba(62, 107, 0, 0.2);
}

.forgot-submit {
    margin-top: 0.5rem;
    border: 0;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #2D006B, #3E6B00);
    padding: 0.75rem 1rem;
    font-weight: 700;
    color: #ffffff;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
}

.forgot-submit:hover:enabled {
    transform: scale(1.02);
    filter: brightness(1.1);
}

.forgot-submit:active:enabled {
    transform: scale(0.98);
}

.forgot-submit:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.forgot-back {
    margin-top: 0.85rem;
    border: 0;
    background: transparent;
    padding: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #bfdbfe;
    cursor: pointer;
    transition: color 0.15s ease;
}

.forgot-back:hover {
    color: #ffffff;
}

.forgot-link {
    margin-top: 0.65rem;
    border: 0;
    background: transparent;
    padding: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #93c5fd;
    cursor: pointer;
    transition: color 0.15s ease;
}

.forgot-link:hover {
    color: #ffffff;
}

.forgot-status {
    margin: 0.95rem 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
}

.forgot-status--success {
    color: #86efac;
}

.forgot-status--error {
    color: #fca5a5;
}
</style>