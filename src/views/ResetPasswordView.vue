<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type ResetPasswordResponse = {
    message?: string
    Message?: string
}

const router = useRouter()
const route = useRoute()
const apiBase = '/api/auth'

const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | ''>('')

const userId = computed(() => {
    const value = route.query.userId
    return typeof value === 'string' ? value : ''
})

const token = computed(() => {
    const value = route.query.token
    return typeof value === 'string' ? value : ''
})

const passwordRules = computed(() => {
    const password = newPassword.value

    return [
        {
            label: 'Minimo de 8 caracteres',
            passed: password.length >= 8,
        },
        {
            label: 'Uma letra minuscula',
            passed: /[a-z]/.test(password),
        },
        {
            label: 'Uma letra maiuscula',
            passed: /[A-Z]/.test(password),
        },
        {
            label: 'Um numero',
            passed: /\d/.test(password),
        },
        {
            label: 'Um simbolo',
            passed: /[^A-Za-z0-9]/.test(password),
        },
    ]
})

const isPasswordValid = computed(() => passwordRules.value.every((rule) => rule.passed))
const doPasswordsMatch = computed(
    () => newPassword.value.length > 0 && confirmPassword.value.length > 0 && newPassword.value === confirmPassword.value,
)

function translateMessage(message: string): string {
    const normalizedMessage = message.trim()

    if (normalizedMessage.includes('Invalid token')) {
        return 'O link de redefinicao e invalido ou expirou.'
    }

    if (normalizedMessage.includes('Password reset successful')) {
        return 'Senha redefinida com sucesso.'
    }

    return normalizedMessage
}

async function handleSubmit() {
    if (!userId.value || !token.value) {
        statusType.value = 'error'
        statusMessage.value = 'Link invalido. Abra novamente o link recebido por email.'
        return
    }

    if (!isPasswordValid.value) {
        statusType.value = 'error'
        statusMessage.value = 'A senha nao atende aos requisitos minimos.'
        return
    }

    if (!doPasswordsMatch.value) {
        statusType.value = 'error'
        statusMessage.value = 'As senhas nao conferem.'
        return
    }

    isLoading.value = true
    statusMessage.value = ''

    try {
        const response = await fetch(`${apiBase}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId.value,
                token: token.value,
                newPassword: newPassword.value,
            }),
        })

        let data: ResetPasswordResponse | null = null

        try {
            data = (await response.json()) as ResetPasswordResponse
        } catch {
            data = null
        }

        if (!response.ok) {
            const errorMessage = data?.message || data?.Message || 'Nao foi possivel redefinir a senha.'
            throw new Error(translateMessage(errorMessage))
        }

        statusType.value = 'success'
        statusMessage.value = translateMessage(data?.message || data?.Message || 'Senha redefinida com sucesso.')
        newPassword.value = ''
        confirmPassword.value = ''
    } catch (error) {
        statusType.value = 'error'
        statusMessage.value = error instanceof Error ? error.message : 'Erro inesperado ao redefinir a senha.'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <main class="reset-page">
        <section class="reset-page__glow reset-page__glow--left" aria-hidden="true"></section>
        <section class="reset-page__glow reset-page__glow--right" aria-hidden="true"></section>

        <div class="reset-card">
            <p class="reset-card__brand">Omnis Review</p>
            <h1 class="reset-card__title">Redefinir senha</h1>
            <p class="reset-card__subtitle">Digite sua nova senha para concluir a redefinicao.</p>

            <p v-if="!userId || !token" class="reset-status reset-status--error">
                Link invalido. Abra novamente o link recebido por email.
            </p>

            <form class="reset-form" @submit.prevent="handleSubmit">
                <div class="reset-field">
                    <label for="new-password" class="reset-label">Nova senha</label>
                    <div class="reset-password-field">
                        <input id="new-password" v-model="newPassword"
                            :type="isNewPasswordVisible ? 'text' : 'password'" required autocomplete="new-password"
                            placeholder="Digite sua nova senha" class="reset-input reset-input--password" />
                        <button type="button" class="reset-password-toggle" :aria-pressed="isNewPasswordVisible"
                            @click="isNewPasswordVisible = !isNewPasswordVisible">
                            {{ isNewPasswordVisible ? 'Ocultar' : 'Ver senha' }}
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

                <div class="reset-field">
                    <label for="confirm-password" class="reset-label">Confirmar senha</label>
                    <div class="reset-password-field">
                        <input id="confirm-password" v-model="confirmPassword"
                            :type="isConfirmPasswordVisible ? 'text' : 'password'" required autocomplete="new-password"
                            placeholder="Repita sua nova senha" class="reset-input reset-input--password" />
                        <button type="button" class="reset-password-toggle" :aria-pressed="isConfirmPasswordVisible"
                            @click="isConfirmPasswordVisible = !isConfirmPasswordVisible">
                            {{ isConfirmPasswordVisible ? 'Ocultar' : 'Ver senha' }}
                        </button>
                    </div>
                </div>

                <button class="reset-submit" type="submit" :disabled="isLoading || !userId || !token">
                    <span v-if="isLoading">Redefinindo...</span>
                    <span v-else>Salvar nova senha</span>
                </button>
            </form>

            <button class="reset-back" type="button" @click="router.push('/')">
                Voltar para o login
            </button>

            <p v-if="statusMessage" class="reset-status"
                :class="statusType === 'success' ? 'reset-status--success' : 'reset-status--error'">
                {{ statusMessage }}
            </p>
        </div>
    </main>
</template>

<style scoped>
.reset-page {
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

.reset-page__glow {
    position: absolute;
    border-radius: 9999px;
    opacity: 0.65;
    filter: blur(70px);
}

.reset-page__glow--left {
    left: -2.5rem;
    top: -2.5rem;
    width: 260px;
    height: 260px;
    background: #6f67ff;
}

.reset-page__glow--right {
    right: -5rem;
    bottom: -5rem;
    width: 340px;
    height: 340px;
    background: #32a0ff;
}

.reset-card {
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

.reset-card__brand {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9dd3ff;
}

.reset-card__title {
    margin: 0.5rem 0;
    font-size: clamp(1.45rem, 3vw, 2rem);
    font-weight: 700;
    line-height: 1.2;
}

.reset-card__subtitle {
    margin: 0 0 18px;
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba(226, 232, 240, 0.8);
}

.reset-form {
    display: grid;
    gap: 1rem;
}

.reset-field {
    display: grid;
    gap: 0.375rem;
}

.reset-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(199 210 254);
}

.reset-input {
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

.reset-password-field {
    position: relative;
}

.reset-input--password {
    padding-right: 6rem;
}

.reset-password-toggle {
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

.reset-password-toggle:hover {
    background: rgba(99, 102, 241, 0.28);
}

.reset-input::placeholder {
    color: rgba(165, 180, 252, 0.5);
}

.reset-input:focus {
    border-color: rgb(96 165 250);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
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
    text-align: center;
}

.password-rule--pending {
    color: rgba(191, 219, 254, 0.75);
}

.password-rule--passed {
    color: #86efac;
}

.reset-submit {
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

.reset-submit:hover:enabled {
    transform: scale(1.02);
    filter: brightness(1.1);
}

.reset-submit:active:enabled {
    transform: scale(0.98);
}

.reset-submit:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.reset-back {
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

.reset-back:hover {
    color: #ffffff;
}

.reset-status {
    margin: 0.95rem 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
}

.reset-status--success {
    color: #86efac;
}

.reset-status--error {
    color: #fca5a5;
}
</style>
