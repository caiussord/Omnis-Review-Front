<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { HighlightCard } from '../components/home'

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

// Search state
const searchQuery = ref<string>('')
const isLoading = ref<boolean>(false)

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
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Falha ao buscar ${url}: ${response.status}`)
    }
    return response.json() as Promise<T>
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
    return sections.value.books.items.slice(index, index + 5)
})

const visibleMovies = computed(() => {
    const index = carouselIndices.value.movies
    return sections.value.movies.items.slice(index, index + 5)
})

const visibleGames = computed(() => {
    const index = carouselIndices.value.games
    return sections.value.games.items.slice(index, index + 5)
})

const visibleSeries = computed(() => {
    const index = carouselIndices.value.series
    return sections.value.series.items.slice(index, index + 5)
})

// Carousel navigation
function nextCarousel(sectionKey: string): void {
    const key = sectionKey as SectionKey
    const maxIndex = Math.max(0, sections.value[key].items.length - 5)
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
    router.push({ name: 'auth' })
}

function goToSignUp(): void {
    router.push({ name: 'auth' })
}

function handleSearch(): void {
    if (searchQuery.value.trim()) {
        console.log('Searching for:', searchQuery.value)
        // Implement search navigation later
    }
}

onMounted(async () => {
    await loadHomeCards()
    sectionKeys.forEach((key) => {
        carouselIndices.value[key] = 0
    })
})
</script>

<template>
    <div class="home-page">
        <!-- Header -->
        <header class="header">
            <div class="header__container">
                <div class="header__content">
                    <!-- Logo -->
                    <div class="header__logo">
                        <img src="/assets/LogoOmnis.png" alt="OmnisReview Logo" />
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

                    <!-- Auth Buttons -->
                    <div class="header__auth-buttons">
                        <button @click="goToLogin" class="btn btn--secondary">
                            Log in
                        </button>
                        <button @click="goToSignUp" class="btn btn--primary">
                            Sign up
                        </button>
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
                            :disabled="carouselIndices.books >= sections.books.items.length - 5"
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
                            :disabled="carouselIndices.movies >= sections.movies.items.length - 5"
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
                            :disabled="carouselIndices.games >= sections.games.items.length - 5"
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
                            :disabled="carouselIndices.series >= sections.series.items.length - 5"
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
    position: relative;
    background: linear-gradient(135deg, #1a0d4a 0%, #2D006B 30%, #3E6B00 70%, #1a1f4d 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
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

.header__logo img {
    height: 2.5rem;
    width: auto;
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
        grid-template-columns: repeat(5, 1fr);
    }
}
</style>
