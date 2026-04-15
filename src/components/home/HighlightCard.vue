<script setup lang="ts">
import { computed } from 'vue'

interface HighlightCardProps {
    title: string
    imageUrl: string
    rating: number
    category: 'book' | 'movie' | 'game' | 'series'
    genre?: string
}

const props = defineProps<HighlightCardProps>()

const starsArray = computed(() => {
    const safeRating = Math.max(0, Math.min(5, props.rating || 0))
    return Array.from({ length: 5 }, (_, i) => i < Math.floor(safeRating) ? 'full' : 'empty')
})
</script>

<template>
    <div class="card">
        <!-- Image Container -->
        <div :class="['card__image-container', { 'card__image-container--game': category === 'game' }]">
            <img :src="imageUrl" :alt="title" :class="['card__image', { 'card__image--game': category === 'game' }]" />
            <div class="card__image-overlay" />
        </div>

        <!-- Content -->
        <div class="card__content">
            <!-- Title -->
            <h3 class="card__title">
                {{ title }}
            </h3>

            <!-- Rating Stars -->
            <div class="card__rating">
                <div class="card__stars">
                    <span v-for="(star, index) in starsArray" :key="index" class="card__star">
                        <span v-if="star === 'full'" class="card__star--filled">★</span>
                        <span v-else class="card__star--empty">★</span>
                    </span>
                </div>
                <span class="card__rating-value">{{ rating.toFixed(1) }}</span>
            </div>

            <!-- Category and Genre Badges -->
            <div class="card__badges">
                <span class="card__badge">
                    {{ category.charAt(0).toUpperCase() + category.slice(1) }}
                </span>
                <span v-if="genre" class="card__badge card__badge--genre">
                    {{ genre }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(*) {
    font-family: 'Ubuntu', sans-serif;
}

.card {
    position: relative;
    width: 16rem;
    height: auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 20px;
    background: rgba(19, 18, 64, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
}

.card:hover {
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 20px 25px -5px rgba(147, 51, 234, 0.2);
}

.card__image-container {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    background: rgba(9, 8, 32, 0.65);
    flex-shrink: 0;
}

.card__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    transition: transform 0.3s ease;
}

.card__image-container--game {
    aspect-ratio: 16 / 9;
}

.card__image--game {
    object-fit: cover;
}

.card:hover .card__image {
    transform: scale(1);
}

.card__image-overlay {
    display: none;
}

.card__content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: rgba(19, 18, 64, 0.9);
    padding: 1rem;
    flex: 1;
}

.card__title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #f8fafc;
    line-clamp: 2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card__rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.card__stars {
    display: flex;
    gap: 0.25rem;
}

.card__star {
    font-size: 0.75rem;
}

.card__star--filled {
    color: #facc15;
}

.card__star--empty {
    color: rgba(255, 255, 255, 0.2);
}

.card__rating-value {
    font-size: 0.75rem;
    color: #c7d2fe;
}

.card__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.card__badge {
    display: inline-flex;
    border-radius: 9999px;
    background: linear-gradient(90deg, rgba(45, 0, 107, 0.4) 0%, rgba(62, 107, 0, 0.4) 100%);
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #e0d5ff;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.card__badge--genre {
    background: rgba(255, 255, 255, 0.08);
    color: #c7d2fe;
}
</style>
