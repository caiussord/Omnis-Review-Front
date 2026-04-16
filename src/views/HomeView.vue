<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { HighlightCard } from '../components/home'
import { apiClient, ApiError } from '../services/apiClient'
import { authApi } from '../services/authApi'
import { getAuthToken, clearAuthSession } from '../services/authSession'
import type { CurrentUserResponse } from '../services/authApi'

// Type definitions
interface HighlightItem {
    id: string
    title: string
    imageUrl: string
    rating: number
    category: 'book' | 'movie' | 'game' | 'series'
    genre?: string
}

interface SectionData {
    title: string
    category: 'book' | 'movie' | 'game' | 'series'
    items: HighlightItem[]
}

type SectionKey = 'books' | 'movies' | 'games' | 'series'

interface BookCardApiItem {
    id: string
    title: string
    averageRating?: number
    categories?: string[]
    coverImage?: string
    type?: number
}

interface GameCardApiItem {
    id: number
    name: string
    backgroundImage?: string
    background_image?: string
    imageUrl?: string
    coverImage?: string
    posterPath?: string
    rating?: number
    voteAverage?: number
    genres?: Array<{ id: number; name: string }>
    type?: number
}

interface MovieCardApiItem {
    id: number
    posterPath?: string
    title: string
    voteAverage?: number
    genreIds?: number[]
    genre_ids?: number[]
    type?: number
}

interface SeriesCardApiItem {
    id: number
    posterPath?: string
    name: string
    voteAverage?: number
    genreIds?: number[]
    genre_ids?: number[]
    type?: number
}

interface PaginatedResults<T> {
    results: T[]
}

// Router
const router = useRouter()

// Auth state
const isAuthenticated = ref<boolean>(false)
const currentUser = ref<CurrentUserResponse | null>(null)
const userMenuOpen = ref<boolean>(false)
let userMenuCloseTimeout: number | null = null

// Search state
const searchQuery = ref<string>('')
const isLoading = ref<boolean>(false)
const quickLoginOpen = ref<boolean>(false)
const quickLoginIdentifier = ref<string>('')
const quickLoginPassword = ref<string>('')
const quickLoginPasswordVisible = ref<boolean>(false)
const quickLoginLoading = ref<boolean>(false)
const quickLoginMessage = ref<string>('')
const quickLoginMessageType = ref<'success' | 'error' | ''>('')
let quickLoginCloseTimeout: number | null = null

// Fluid background pointer state
const pointerX = ref<number>(0.5)
const pointerY = ref<number>(0.5)
const pointerTargetX = ref<number>(0.5)
const pointerTargetY = ref<number>(0.5)
let pointerAnimationFrame: number | null = null

// Carousel state
const carouselIndices = ref<Record<SectionKey, number>>({
    books: 0,
    movies: 0,
    games: 0,
    series: 0,
})

const sections = ref<Record<SectionKey, SectionData>>({
    books: {
        title: 'Livros',
        category: 'book',
        items: [],
    },
    movies: {
        title: 'Filmes Populares',
        category: 'movie',
        items: [],
    },
    games: {
        title: 'Jogos Populares',
        category: 'game',
        items: [],
    },
    series: {
        title: 'Séries Populares',
        category: 'series',
        items: [],
    },
})

const sectionKeys: SectionKey[] = ['books', 'movies', 'games', 'series']

const homeBackgroundStyle = computed<Record<string, string>>(() => {
    const flowX = (pointerX.value - 0.5) * 14
    const flowY = (pointerY.value - 0.5) * 14

    return {
        '--flow-x': `${flowX.toFixed(2)}%`,
        '--flow-y': `${flowY.toFixed(2)}%`,
        '--flow-x-inv': `${(-flowX).toFixed(2)}%`,
        '--flow-y-inv': `${(-flowY).toFixed(2)}%`,
    }
})

function animatePointer(): void {
    const smoothing = 0.065
    pointerX.value += (pointerTargetX.value - pointerX.value) * smoothing
    pointerY.value += (pointerTargetY.value - pointerY.value) * smoothing

    const deltaX = Math.abs(pointerTargetX.value - pointerX.value)
    const deltaY = Math.abs(pointerTargetY.value - pointerY.value)

    if (deltaX < 0.001 && deltaY < 0.001) {
        pointerAnimationFrame = null
        return
    }

    pointerAnimationFrame = requestAnimationFrame(animatePointer)
}

function startPointerAnimation(): void {
    if (pointerAnimationFrame !== null) {
        return
    }

    pointerAnimationFrame = requestAnimationFrame(animatePointer)
}

function handlePointerMove(event: PointerEvent | MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null
    if (!target) {
        return
    }

    const bounds = target.getBoundingClientRect()
    const relativeX = (event.clientX - bounds.left) / bounds.width
    const relativeY = (event.clientY - bounds.top) / bounds.height

    pointerTargetX.value = Math.min(1, Math.max(0, relativeX))
    pointerTargetY.value = Math.min(1, Math.max(0, relativeY))
    startPointerAnimation()
}

const tmdbGenreMap: Record<number, string> = {
    12: 'Aventura',
    14: 'Fantasia',
    16: 'Animacao',
    18: 'Drama',
    27: 'Terror',
    28: 'Acao',
    35: 'Comedia',
    36: 'Historia',
    37: 'Faroeste',
    53: 'Thriller',
    80: 'Crime',
    878: 'Ficcao Cientifica',
    9648: 'Misterio',
    99: 'Documentario',
    10749: 'Romance',
    10751: 'Familia',
    10752: 'Guerra',
    10759: 'Acao e Aventura',
    10762: 'Infantil',
    10763: 'Noticias',
    10764: 'Reality',
    10765: 'Sci-Fi e Fantasia',
    10766: 'Novela',
    10767: 'Talk Show',
    10768: 'Guerra e Politica',
    10770: 'Filme para TV',
}

function clampRating(value: number | undefined): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 0
    }
    return Math.max(0, Math.min(5, value))
}

function buildTmdbPosterUrl(path: string | undefined): string {
    if (!path) {
        return 'https://placehold.co/300x450?text=Sem+Imagem'
    }
    return `https://image.tmdb.org/t/p/w500${path}`
}

function normalizeImageUrl(url: string | undefined): string {
    if (!url) {
        return 'https://placehold.co/300x450?text=Sem+Imagem'
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }

    if (url.startsWith('/')) {
        return url
    }

    return `https://${url}`
}

function getGameImageUrl(item: GameCardApiItem): string {
    const directImage = item.backgroundImage ?? item.background_image ?? item.imageUrl ?? item.coverImage
    if (directImage) {
        return normalizeImageUrl(directImage)
    }

    if (item.posterPath) {
        return buildTmdbPosterUrl(item.posterPath)
    }

    return 'https://placehold.co/300x450?text=Sem+Imagem'
}

function getTmdbGenre(genreIds: number[] | undefined): string | undefined {
    if (!genreIds || genreIds.length === 0) {
        return undefined
    }

    const firstId = genreIds[0]
    if (firstId === undefined) {
        return undefined
    }

    return tmdbGenreMap[firstId] ?? `Genero ${firstId}`
}

async function fetchJson<T>(url: string): Promise<T> {
    return apiClient.get<T>(url)
}

async function fetchJsonWithFallback<T>(urls: string[]): Promise<T> {
    let lastError: Error | undefined

    for (const url of urls) {
        try {
            return await fetchJson<T>(url)
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
        }
    }

    throw lastError ?? new Error('Falha ao buscar endpoint com fallback')
}

async function loadHomeCards(): Promise<void> {
    isLoading.value = true

    try {
        const [booksResponse, moviesResponse, gamesResponse, seriesResponse] = await Promise.allSettled([
            fetchJsonWithFallback<BookCardApiItem[]>([
                '/api/google-books/search/card?query=Harry%20Potter&startIndex=0&maxResults=10',
                '/api/books/search/card?query=Harry%20Potter&startIndex=0&maxResults=10',
                '/api/googlebooks/search/card?query=Harry%20Potter&startIndex=0&maxResults=10',
            ]),
            fetchJson<PaginatedResults<MovieCardApiItem>>('/api/tmdb/movies/popular/card?page=1'),
            fetchJson<PaginatedResults<GameCardApiItem>>('/api/rawg/games/popular/card?page=1&pageSize=20'),
            fetchJsonWithFallback<PaginatedResults<SeriesCardApiItem>>([
                '/api/tmdb/series/popular/card?page=1',
                '/api/tmdb/tv/popular/card?page=1',
                '/api/tmdb/series/search/card?query=Breaking%20Bad&page=1',
                '/api/tmdb/tv/search/card?query=Breaking%20Bad&page=1',
            ]),
        ])

        if (booksResponse.status === 'fulfilled') {
            sections.value.books.items = booksResponse.value.map((item) => ({
                id: String(item.id),
                title: item.title,
                imageUrl: item.coverImage ?? 'https://placehold.co/300x450?text=Sem+Imagem',
                rating: clampRating(item.averageRating),
                category: 'book',
                genre: item.categories?.[0],
            }))
        } else {
            sections.value.books.items = []
            console.warn('Falha ao carregar livros da home:', booksResponse.reason)
        }

        if (moviesResponse.status === 'fulfilled') {
            sections.value.movies.items = (moviesResponse.value.results ?? []).map((item) => ({
                id: String(item.id),
                title: item.title,
                imageUrl: buildTmdbPosterUrl(item.posterPath),
                rating: clampRating(item.voteAverage),
                category: 'movie',
                genre: getTmdbGenre(item.genreIds ?? item.genre_ids),
            }))
        } else {
            sections.value.movies.items = []
            console.warn('Falha ao carregar filmes da home:', moviesResponse.reason)
        }

        if (gamesResponse.status === 'fulfilled') {
            sections.value.games.items = (gamesResponse.value.results ?? []).map((item) => ({
                id: String(item.id),
                title: item.name,
                imageUrl: getGameImageUrl(item),
                rating: clampRating(item.rating ?? item.voteAverage),
                category: 'game',
                genre: item.genres?.[0]?.name,
            }))
        } else {
            sections.value.games.items = []
            console.warn('Falha ao carregar jogos da home:', gamesResponse.reason)
        }

        if (seriesResponse.status === 'fulfilled') {
            sections.value.series.items = (seriesResponse.value.results ?? []).map((item) => ({
                id: String(item.id),
                title: item.name,
                imageUrl: buildTmdbPosterUrl(item.posterPath),
                rating: clampRating(item.voteAverage),
                category: 'series',
                genre: getTmdbGenre(item.genreIds ?? item.genre_ids),
            }))
        } else {
            sections.value.series.items = []
            console.warn('Falha ao carregar series da home:', seriesResponse.reason)
        }
    } catch (error) {
        console.error('Erro ao carregar cards da home:', error)
    } finally {
        isLoading.value = false
    }
}

// Computed properties for visible items
const visibleBooks = computed(() => {
    const index = carouselIndices.value.books
    return sections.value.books.items.slice(index, index + 4)
})

const visibleMovies = computed(() => {
    const index = carouselIndices.value.movies
    return sections.value.movies.items.slice(index, index + 4)
})

const visibleGames = computed(() => {
    const index = carouselIndices.value.games
    return sections.value.games.items.slice(index, index + 4)
})

const visibleSeries = computed(() => {
    const index = carouselIndices.value.series
    return sections.value.series.items.slice(index, index + 4)
})

// Carousel navigation
function nextCarousel(sectionKey: string): void {
    const key = sectionKey as SectionKey
    const maxIndex = Math.max(0, sections.value[key].items.length - 4)
    if (carouselIndices.value[key] < maxIndex) {
        carouselIndices.value[key]++
    }
}

function prevCarousel(sectionKey: string): void {
    const key = sectionKey as SectionKey
    if (carouselIndices.value[key] > 0) {
        carouselIndices.value[key]--
    }
}

// Navigation handlers
function goToLogin(): void {
    router.push({ name: 'auth', query: { mode: 'login' } })
}

function goToSignUp(): void {
    router.push({ name: 'auth', query: { mode: 'register' } })
}

function goToHome(): void {
    router.push({ name: 'home' })
}

function openQuickLogin(): void {
    if (quickLoginCloseTimeout !== null) {
        clearTimeout(quickLoginCloseTimeout)
        quickLoginCloseTimeout = null
    }

    quickLoginOpen.value = true
}

function scheduleQuickLoginClose(): void {
    if (quickLoginLoading.value) {
        return
    }

    if (quickLoginCloseTimeout !== null) {
        clearTimeout(quickLoginCloseTimeout)
    }

    quickLoginCloseTimeout = window.setTimeout(() => {
        quickLoginOpen.value = false
        quickLoginCloseTimeout = null
    }, 220)
}

function toggleQuickLogin(): void {
    if (quickLoginCloseTimeout !== null) {
        clearTimeout(quickLoginCloseTimeout)
        quickLoginCloseTimeout = null
    }

    quickLoginOpen.value = !quickLoginOpen.value
}

function setQuickLoginStatus(type: 'success' | 'error', message: string): void {
    quickLoginMessageType.value = type
    quickLoginMessage.value = message
}

function goToRegisterFromQuickLogin(): void {
    quickLoginOpen.value = false
    router.push({ name: 'auth', query: { mode: 'register' } })
}

function goToForgotPassword(): void {
    quickLoginOpen.value = false
    router.push({ name: 'forgot-password' })
}

async function submitQuickLogin(): Promise<void> {
    if (!quickLoginIdentifier.value.trim() || !quickLoginPassword.value) {
        setQuickLoginStatus('error', 'Preencha email/usuario e senha.')
        return
    }

    quickLoginLoading.value = true
    quickLoginMessage.value = ''
    quickLoginMessageType.value = ''

    try {
        await authApi.login({
            email: quickLoginIdentifier.value.trim(),
            password: quickLoginPassword.value,
        })

        // Sincroniza o estado reativo após o login
        await loadCurrentUser()
        setQuickLoginStatus('success', 'Login realizado com sucesso.')
        quickLoginOpen.value = false
        quickLoginIdentifier.value = ''
        quickLoginPassword.value = ''
    } catch (error) {
        const message =
            error instanceof ApiError || error instanceof Error
                ? error.message
                : 'Erro inesperado ao fazer login.'
        setQuickLoginStatus('error', message)
    } finally {
        quickLoginLoading.value = false
    }
}

function handleSearch(): void {
    if (searchQuery.value.trim()) {
        console.log('Searching for:', searchQuery.value)
        // Implement search navigation later
    }
}

function openUserMenu(): void {
    if (userMenuCloseTimeout !== null) {
        clearTimeout(userMenuCloseTimeout)
        userMenuCloseTimeout = null
    }
    userMenuOpen.value = true
}

function scheduleUserMenuClose(): void {
    if (userMenuCloseTimeout !== null) {
        clearTimeout(userMenuCloseTimeout)
    }
    userMenuCloseTimeout = window.setTimeout(() => {
        userMenuOpen.value = false
        userMenuCloseTimeout = null
    }, 220)
}

async function logout(): Promise<void> {
    const confirmed = window.confirm('Tem certeza que deseja sair?')
    if (!confirmed) {
        return
    }

    clearAuthSession()
    isAuthenticated.value = false
    currentUser.value = null
    userMenuOpen.value = false
    await router.push({ name: 'home' })
}

async function loadCurrentUser(): Promise<void> {
    const token = getAuthToken()
    if (!token) {
        isAuthenticated.value = false
        currentUser.value = null
        return
    }

    try {
        const user = await authApi.getCurrentUser()
        currentUser.value = user
        isAuthenticated.value = true
    } catch (error) {
        console.error('Erro ao carregar perfil do usuário:', error)
        isAuthenticated.value = false
        currentUser.value = null
    }
}

onMounted(async () => {
    await loadHomeCards()
    await loadCurrentUser()
    sectionKeys.forEach((key) => {
        carouselIndices.value[key] = 0
    })
})

onUnmounted(() => {
    if (pointerAnimationFrame !== null) {
        cancelAnimationFrame(pointerAnimationFrame)
        pointerAnimationFrame = null
    }

    if (quickLoginCloseTimeout !== null) {
        clearTimeout(quickLoginCloseTimeout)
        quickLoginCloseTimeout = null
    }

    if (userMenuCloseTimeout !== null) {
        clearTimeout(userMenuCloseTimeout)
        userMenuCloseTimeout = null
    }
})
</script>

<template>
    <div class="home-page" :style="homeBackgroundStyle" @pointermove="handlePointerMove" @mousemove="handlePointerMove">
        <!-- Header -->
        <header class="header">
            <div class="header__container">
                <div class="header__content">
                    <!-- Logo -->
                    <div class="header__logo">
                        <button type="button" class="header__logo-button" @click="goToHome"
                            aria-label="Voltar para a home">
                            <img src="/assets/LogoOmnis.png" alt="OmnisReview Logo" />
                        </button>
                    </div>

                    <!-- Search Bar -->
                    <div class="header__search-wrapper">
                        <div class="search-bar">
                            <input v-model="searchQuery" type="text" placeholder="Search books, movies, games, shows..."
                                class="search-bar__input" @keyup.enter="handleSearch" />
                            <button @click="handleSearch" class="search-bar__button">
                                <svg class="search-bar__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Auth Buttons / User Menu -->
                    <div v-if="!isAuthenticated" class="header__auth-buttons">
                        <div class="quick-login" @mouseenter="openQuickLogin" @mouseleave="scheduleQuickLoginClose">
                            <button @click="goToLogin" class="btn btn--secondary" type="button">
                                Log in
                            </button>

                            <div v-if="quickLoginOpen" class="quick-login__panel" @mouseenter="openQuickLogin"
                                @mouseleave="scheduleQuickLoginClose">
                                <form class="quick-login__form" @submit.prevent="submitQuickLogin">
                                    <input v-model="quickLoginIdentifier" type="text" class="quick-login__input"
                                        placeholder="Email ou username" autocomplete="username" />
                                    <div class="quick-login__password-field">
                                        <input v-model="quickLoginPassword" :type="quickLoginPasswordVisible ? 'text' : 'password'" class="quick-login__input"
                                            placeholder="Senha" autocomplete="current-password" />
                                        <button type="button" class="quick-login__password-toggle" @click="quickLoginPasswordVisible = !quickLoginPasswordVisible">
                                            <svg v-if="!quickLoginPasswordVisible" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <button type="submit" class="quick-login__submit" :disabled="quickLoginLoading">
                                        {{ quickLoginLoading ? 'Entrando...' : 'Entrar' }}
                                    </button>

                                    <p v-if="quickLoginMessage" class="quick-login__status"
                                        :class="quickLoginMessageType === 'success' ? 'quick-login__status--success' : 'quick-login__status--error'">
                                        {{ quickLoginMessage }}
                                    </p>

                                    <div class="quick-login__links">
                                        <button type="button" class="quick-login__link"
                                            @click="goToRegisterFromQuickLogin">
                                            Nao e cadastrado? Clique aqui
                                        </button>
                                        <button type="button" class="quick-login__link" @click="goToForgotPassword">
                                            Esqueci senha
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <button @click="goToSignUp" class="btn btn--primary">
                            Sign up
                        </button>
                    </div>
                    <div v-else class="user-menu" @mouseenter="openUserMenu" @mouseleave="scheduleUserMenuClose">
                        <button class="user-menu__trigger" type="button" @mouseenter="openUserMenu">
                            <span class="user-menu__greeting">Olá, {{ currentUser?.userName }}</span>
                        </button>

                        <div v-if="userMenuOpen" class="user-menu__dropdown" @mouseenter="openUserMenu"
                            @mouseleave="scheduleUserMenuClose">
                            <button type="button" class="user-menu__item">
                                <svg class="user-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Meu perfil
                            </button>
                            <button type="button" class="user-menu__item">
                                <svg class="user-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 4.354a4 4 0 110 5.292M15 4h6m-6 4h3m-3 4h9M6.5 14h3" />
                                </svg>
                                Meus amigos
                            </button>
                            <button type="button" class="user-menu__item">
                                <svg class="user-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Favoritos
                            </button>
                            <div class="user-menu__divider"></div>
                            <button type="button" class="user-menu__item user-menu__item--logout" @click="logout">
                                <svg class="user-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Hero Section -->
            <section class="hero">
                <h1 class="hero__title">
                    Bem-vindo ao OmnisReview
                </h1>
                <p class="hero__subtitle">
                    Descubra, avalie e compartilhe suas opiniões sobre livros, filmes, jogos e séries favoritas.
                </p>
            </section>

            <!-- Books Section -->
            <section class="carousel-section">
                <div class="carousel-section__header">
                    <h2 class="carousel-section__title">
                        {{ sections.books.title }}
                    </h2>
                    <div class="carousel-controls">
                        <button @click="prevCarousel('books')" :disabled="carouselIndices.books === 0"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button @click="nextCarousel('books')"
                            :disabled="carouselIndices.books >= sections.books.items.length - 4"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="carousel-grid">
                    <HighlightCard v-for="item in visibleBooks" :key="item.id" :title="item.title"
                        :image-url="item.imageUrl" :rating="item.rating" :category="item.category"
                        :genre="item.genre" />
                </div>
                <p v-if="!isLoading && sections.books.items.length === 0" class="carousel-section__empty-state">
                    Nenhum livro encontrado no momento.
                </p>
            </section>

            <!-- Movies Section -->
            <section class="carousel-section">
                <div class="carousel-section__header">
                    <h2 class="carousel-section__title">
                        {{ sections.movies.title }}
                    </h2>
                    <div class="carousel-controls">
                        <button @click="prevCarousel('movies')" :disabled="carouselIndices.movies === 0"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button @click="nextCarousel('movies')"
                            :disabled="carouselIndices.movies >= sections.movies.items.length - 4"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="carousel-grid">
                    <HighlightCard v-for="item in visibleMovies" :key="item.id" :title="item.title"
                        :image-url="item.imageUrl" :rating="item.rating" :category="item.category"
                        :genre="item.genre" />
                </div>
                <p v-if="!isLoading && sections.movies.items.length === 0" class="carousel-section__empty-state">
                    Nenhum filme popular encontrado no momento.
                </p>
            </section>

            <!-- Games Section -->
            <section class="carousel-section">
                <div class="carousel-section__header">
                    <h2 class="carousel-section__title">
                        {{ sections.games.title }}
                    </h2>
                    <div class="carousel-controls">
                        <button @click="prevCarousel('games')" :disabled="carouselIndices.games === 0"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button @click="nextCarousel('games')"
                            :disabled="carouselIndices.games >= sections.games.items.length - 4"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="carousel-grid">
                    <HighlightCard v-for="item in visibleGames" :key="item.id" :title="item.title"
                        :image-url="item.imageUrl" :rating="item.rating" :category="item.category"
                        :genre="item.genre" />
                </div>
                <p v-if="!isLoading && sections.games.items.length === 0" class="carousel-section__empty-state">
                    Nenhum jogo popular encontrado no momento.
                </p>
            </section>

            <!-- Series Section -->
            <section class="carousel-section">
                <div class="carousel-section__header">
                    <h2 class="carousel-section__title">
                        {{ sections.series.title }}
                    </h2>
                    <div class="carousel-controls">
                        <button @click="prevCarousel('series')" :disabled="carouselIndices.series === 0"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button @click="nextCarousel('series')"
                            :disabled="carouselIndices.series >= sections.series.items.length - 4"
                            class="carousel-controls__button">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="carousel-grid">
                    <HighlightCard v-for="item in visibleSeries" :key="item.id" :title="item.title"
                        :image-url="item.imageUrl" :rating="item.rating" :category="item.category"
                        :genre="item.genre" />
                </div>
                <p v-if="!isLoading && sections.series.items.length === 0" class="carousel-section__empty-state">
                    Nenhuma série popular encontrada no momento.
                </p>
            </section>
        </main>
    </div>
</template>

<style scoped>
:deep(*) {
    font-family: 'Ubuntu', sans-serif;
}

.home-page {
    --flow-x: 0px;
    --flow-y: 0px;
    --flow-x-inv: 0px;
    --flow-y-inv: 0px;
    position: relative;
    background:
        radial-gradient(circle at calc(46% + var(--flow-x)) calc(38% + var(--flow-y)), rgba(45, 0, 107, 0.58), transparent 34%),
        radial-gradient(circle at calc(54% + var(--flow-x-inv)) calc(50% + var(--flow-y-inv)), rgba(62, 107, 0, 0.6), transparent 36%),
        radial-gradient(circle at calc(18% + var(--flow-x)) calc(28% + var(--flow-y-inv)), rgba(62, 107, 0, 0.38), transparent 34%),
        radial-gradient(circle at calc(80% + var(--flow-x-inv)) calc(34% + var(--flow-y)), rgba(45, 0, 107, 0.5), transparent 36%),
        radial-gradient(circle at calc(32% + var(--flow-x-inv)) calc(72% + var(--flow-y)), rgba(45, 0, 107, 0.34), transparent 42%),
        radial-gradient(circle at calc(72% + var(--flow-x)) calc(20% + var(--flow-y-inv)), rgba(62, 107, 0, 0.42), transparent 42%),
        linear-gradient(140deg, #1a0d4a 0%, #2d006b 34%, #2b3650 56%, #3e6b00 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    isolation: isolate;
}

.home-page::before,
.home-page::after {
    content: '';
    position: absolute;
    inset: -20%;
    pointer-events: none;
    z-index: 0;
    mix-blend-mode: screen;
    filter: blur(40px) saturate(140%);
}

.home-page::before {
    background:
        radial-gradient(circle at calc(34% + var(--flow-x)) calc(30% + var(--flow-y)), #2d006bdb, transparent 24%),
        radial-gradient(circle at calc(52% + var(--flow-x-inv)) calc(40% + var(--flow-y-inv)), #3e6b00d6, transparent 26%),
        radial-gradient(circle at calc(16% + var(--flow-x)) calc(46% + var(--flow-y-inv)), rgba(62, 107, 0, 0.62), transparent 20%),
        radial-gradient(circle at calc(70% + var(--flow-x-inv)) calc(66% + var(--flow-y)), rgba(45, 0, 107, 0.74), transparent 24%),
        radial-gradient(circle at calc(84% + var(--flow-x)) calc(44% + var(--flow-y-inv)), rgba(45, 0, 107, 0.82), transparent 22%),
        radial-gradient(circle at calc(44% + var(--flow-x-inv)) calc(56% + var(--flow-y)), rgba(62, 107, 0, 0.66), transparent 22%);
    animation: lava-flow-a 9s ease-in-out infinite alternate;
}

.home-page::after {
    background:
        radial-gradient(circle at calc(62% + var(--flow-x-inv)) calc(24% + var(--flow-y)), rgba(62, 107, 0, 0.92), transparent 24%),
        radial-gradient(circle at calc(48% + var(--flow-x)) calc(56% + var(--flow-y-inv)), rgba(45, 0, 107, 0.8), transparent 26%),
        radial-gradient(circle at calc(12% + var(--flow-x-inv)) calc(34% + var(--flow-y)), rgba(62, 107, 0, 0.64), transparent 18%),
        radial-gradient(circle at calc(28% + var(--flow-x)) calc(50% + var(--flow-y-inv)), rgba(62, 107, 0, 0.76), transparent 22%),
        radial-gradient(circle at calc(74% + var(--flow-x-inv)) calc(74% + var(--flow-y)), rgba(45, 0, 107, 0.62), transparent 22%),
        radial-gradient(circle at calc(88% + var(--flow-x)) calc(58% + var(--flow-y-inv)), rgba(45, 0, 107, 0.72), transparent 20%);
    animation: lava-flow-b 11s ease-in-out infinite alternate;
}

@keyframes lava-flow-a {
    0% {
        transform: translate3d(-6%, -3%, 0) scale(0.98);
    }

    50% {
        transform: translate3d(7%, 4%, 0) scale(1.1);
    }

    100% {
        transform: translate3d(-3%, 8%, 0) scale(0.94);
    }
}

@keyframes lava-flow-b {
    0% {
        transform: translate3d(4%, 2%, 0) scale(1.03);
    }

    50% {
        transform: translate3d(-7%, -5%, 0) scale(0.93);
    }

    100% {
        transform: translate3d(6%, -2%, 0) scale(1.08);
    }
}

@media (prefers-reduced-motion: reduce) {

    .home-page::before,
    .home-page::after {
        animation: none;
    }
}

/* Header Styles */
.header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(19, 18, 64, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header__container {
    margin: 0 auto;
    max-width: 80rem;
    padding: 1rem;
}

.header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.header__logo {
    flex-shrink: 0;
}

.header__logo-button {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
}

.header__logo img {
    height: 3.6rem;
    width: auto;
}

.header__logo-button:hover img {
    transform: scale(1.02);
}

.header__logo-button img {
    transition: transform 0.2s ease;
}

@media (max-width: 640px) {
    .header__logo img {
        height: 3.1rem;
    }
}

.header__search-wrapper {
    display: none;
    flex: 1;
    max-width: 28rem;
}

.header__auth-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

@media (min-width: 768px) {
    .header__search-wrapper {
        display: flex;
        justify-content: center;
    }
}

@media (max-width: 640px) {
    .btn--secondary {
        display: none;
    }
}

/* Search Bar Styles */
.search-bar {
    position: relative;
    width: 100%;
}

.search-bar__input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #f8fafc;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.15s ease;
}

.search-bar__input::placeholder {
    color: #c7d2fe;
    opacity: 0.6;
}

.search-bar__input:focus {
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 0 3px rgba(62, 107, 0, 0.1);
}

.search-bar__button {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #c7d2fe;
    cursor: pointer;
    transition: color 0.15s ease;
}

.search-bar__button:hover {
    color: #f8fafc;
}

.search-bar__icon {
    width: 1.25rem;
    height: 1.25rem;
}

/* Button Styles */
.btn {
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn--primary {
    background: linear-gradient(135deg, #2D006B, #3E6B00);
    color: white;
    font-weight: 600;
}

.btn--primary:hover {
    opacity: 0.9;
}

.btn--secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.8);
}

.btn--secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.quick-login {
    position: relative;
}

.quick-login__panel {
    position: absolute;
    top: calc(100% + 0.6rem);
    right: 0;
    width: min(22rem, 88vw);
    padding: 0.85rem;
    border-radius: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(19, 18, 64, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 14px 30px rgba(8, 8, 24, 0.45);
    z-index: 80;
}

.quick-login__form {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.quick-login__password-field {
    position: relative;
    display: flex;
    align-items: center;
}

.quick-login__input {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 0.6rem;
    background: rgba(255, 255, 255, 0.07);
    color: #f8fafc;
    font-size: 0.85rem;
    padding: 0.55rem 0.75rem;
    outline: none;
}

.quick-login__input::placeholder {
    color: rgba(199, 210, 254, 0.75);
}

.quick-login__input:focus {
    border-color: rgba(199, 210, 254, 0.6);
    box-shadow: 0 0 0 2px rgba(62, 107, 0, 0.14);
}

.quick-login__password-toggle {
    position: absolute;
    right: 0.5rem;
    border: none;
    background: transparent;
    color: rgba(199, 210, 254, 0.7);
    cursor: pointer;
    padding: 0.25rem;
    transition: color 0.15s ease;
}

.quick-login__password-toggle:hover {
    color: rgba(199, 210, 254, 1);
}

.quick-login__password-toggle svg {
    width: 1rem;
    height: 1rem;
}

.quick-login__submit {
    border: none;
    border-radius: 0.6rem;
    padding: 0.55rem 0.8rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #2D006B, #3E6B00);
    cursor: pointer;
}

.quick-login__submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.quick-login__status {
    margin: 0;
    padding: 0.45rem 0.55rem;
    border-radius: 0.55rem;
    font-size: 0.78rem;
}

.quick-login__status--success {
    background: rgba(46, 194, 138, 0.18);
    border: 1px solid rgba(46, 194, 138, 0.35);
    color: #9affd7;
}

.quick-login__status--error {
    background: rgba(255, 104, 144, 0.16);
    border: 1px solid rgba(255, 104, 144, 0.3);
    color: #ffc7d6;
}

.quick-login__links {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
}

.quick-login__link {
    border: none;
    background: none;
    color: #c7d2fe;
    font-size: 0.78rem;
    cursor: pointer;
    padding: 0;
}

.quick-login__link:hover {
    color: #ffffff;
    text-decoration: underline;
}

/* User Menu */
.user-menu {
    position: relative;
}

.user-menu__trigger {
    border: none;
    background: transparent;
    color: #c7d2fe;
    font-size: 0.95rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 0.5rem;
}

.user-menu__trigger:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
}

.user-menu__greeting {
    background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
    letter-spacing: 0.3px;
}

.user-menu__dropdown {
    position: absolute;
    top: calc(100% + 0.6rem);
    right: 0;
    width: max(14rem, 100%);
    min-width: 14rem;
    padding: 0.5rem 0;
    border-radius: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(19, 18, 64, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 14px 30px rgba(8, 8, 24, 0.45);
    z-index: 80;
}

.user-menu__item {
    width: 100%;
    border: none;
    background: transparent;
    color: #e2e8f0;
    font-size: 0.9rem;
    padding: 0.6rem 1rem;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    transition: all 0.15s ease;
}

.user-menu__item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
}

.user-menu__icon {
    width: 1.1rem;
    height: 1.1rem;
    flex-shrink: 0;
    opacity: 0.85;
}

.user-menu__item--logout {
    color: #f87171;
}

.user-menu__item--logout:hover {
    background: rgba(248, 113, 113, 0.12);
    color: #fca5a5;
}

.user-menu__divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
    margin: 0.4rem 0;
}

/* Main Content */
.main-content {
    position: relative;
    z-index: 10;
    margin: 0 auto;
    max-width: 80rem;
    padding: 3rem 1rem;
    flex: 1;
}

/* Hero Section */
.hero {
    margin-bottom: 4rem;
    text-align: center;
}

.hero__title {
    margin-bottom: 1rem;
    font-size: clamp(2rem, 5vw, 3.75rem);
    font-weight: 700;
    color: #f8fafc;
}

.hero__subtitle {
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: #c7d2fe;
    max-width: 42rem;
    margin: 0 auto;
}

@media (min-width: 768px) {
    .hero {
        margin-bottom: 6rem;
    }
}

/* Carousel Section */
.carousel-section {
    margin-bottom: 3rem;
}

@media (min-width: 768px) {
    .carousel-section {
        margin-bottom: 4rem;
    }
}

.carousel-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
}

.carousel-section__title {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 1.875rem);
    font-weight: 700;
    color: #f8fafc;
}

/* Carousel Controls */
.carousel-controls {
    display: flex;
    gap: 0.5rem;
}

.carousel-controls__button {
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.15s ease;
}

.carousel-controls__button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.carousel-controls__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.carousel-controls__button svg {
    width: 1.25rem;
    height: 1.25rem;
}

/* Carousel Grid */
.carousel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1.5rem;
}

.carousel-section__empty-state {
    margin-top: 1rem;
    color: #c7d2fe;
    font-size: 0.9rem;
}

@media (max-width: 640px) {
    .carousel-grid {
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 1rem;
    }
}

@media (min-width: 1024px) {
    .carousel-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
</style>
