# OmnisReview Frontend

Frontend do OmnisReview, uma plataforma para reviews de series, livros e jogos em um unico lugar.

## Visao geral

- Framework: Vue 3 (Composition API)
- Linguagem: TypeScript
- Build tool: Vite
- Estilo: Tailwind CSS
- Roteamento: Vue Router
- Testes: Vitest + Vue Test Utils

## Design

O projeto usa um visual dark com identidade roxo/azul:

- gradientes de fundo para profundidade visual
- card principal com efeito glassmorphism
- formularios com feedback de foco, hover, loading e erro

## Requisitos

- Node.js `20.19+` (ou `22.12+`)
- npm

## Como rodar localmente

1. Instale dependencias:

```bash
npm install
```

2. Configure a URL do backend (arquivo `.env.development.local`):

```env
VITE_BACKEND_URL=https://localhost:7079
```

3. Rode o frontend:

```bash
npm run dev
```

O frontend sobe em `http://localhost:8080`.

## Integracao com backend

- No frontend, as chamadas usam `/api/auth/login` e `/api/auth/register`.
- Na recuperacao de senha, o frontend envia um `resetPasswordUrl` absoluto apontando para `/reset-password`.
- Em desenvolvimento, o Vite faz proxy de `/api` para `VITE_BACKEND_URL`.
- Exemplo final de destino com a config atual:
  - `http://localhost:8080/api/auth/register` -> `https://localhost:7079/api/auth/register`

Se der erro `502 Bad Gateway`, normalmente significa que o backend nao esta rodando ou a porta/protocolo (`http`/`https`) esta incorreto.

## Implementacao da Home e Integracao com API

Esta secao registra o que foi implementado na Home para carregar cards reais via API.

### 1. Integracao de cards por categoria

A Home passou a carregar dados reais para 4 secoes:

- Livros
- Filmes Populares
- Jogos Populares
- Series Populares

### 2. Endpoints usados na Home

Filmes e jogos usam endpoints diretos:

- `/api/tmdb/movies/popular/card?page=1`
- `/api/rawg/games/popular/card?page=1&pageSize=20`

Livros e series usam fallback de rota para tolerar variacoes no backend:

- Livros (tentativas em sequencia):
  - `/api/google-books/search/card?query=Harry%20Potter&startIndex=0&maxResults=10`
  - `/api/books/search/card?query=Harry%20Potter&startIndex=0&maxResults=10`
  - `/api/googlebooks/search/card?query=Harry%20Potter&startIndex=0&maxResults=10`
- Series (tentativas em sequencia):
  - `/api/tmdb/series/popular/card?page=1`
  - `/api/tmdb/tv/popular/card?page=1`
  - `/api/tmdb/series/search/card?query=Breaking%20Bad&page=1`
  - `/api/tmdb/tv/search/card?query=Breaking%20Bad&page=1`

### 3. Estrategia de resiliencia

- O carregamento usa Promise.allSettled para que falha de uma categoria nao derrube as outras.
- Cada categoria e tratada de forma independente.
- Quando uma secao falha, apenas aquela secao fica vazia e e exibido aviso no console.

### 4. Mapeamento e normalizacao de dados

Implementado mapeamento para o formato unico de card:

- id
- title
- imageUrl
- rating
- category
- genre (novo)

Regras aplicadas:

- Rating e normalizado para intervalo de 0 a 5.
- Posters TMDB sao convertidos para URL completa com base `https://image.tmdb.org/t/p/w500`.
- Quando nao existe imagem valida, usa placeholder `https://placehold.co/300x450?text=Sem+Imagem`.

### 5. Compatibilidade de imagem para jogos

Para jogos, a Home aceita multiplos formatos de campo vindos da API:

- `backgroundImage`
- `background_image`
- `imageUrl`
- `coverImage`
- `posterPath` (fallback)

Tambem foi adicionada normalizacao de URL para evitar quebra quando a API retornar caminhos em formatos diferentes.

### 6. Categoria + genero no card

Os cards agora exibem:

- Badge da categoria (Book, Movie, Game, Series)
- Badge de genero (novo)

Origem do genero por categoria:

- Livros: primeiro item de `categories`
- Jogos: primeiro item de `genres[].name`
- Filmes e series: primeiro `genreId` mapeado por tabela local de generos TMDB

### 7. Ajustes visuais dos cards

- Card usa nota real para renderizar estrelas.
- Titulo com clamp em 2 linhas para manter consistencia visual.
- Imagens gerais com `object-fit: contain` para reduzir cortes.
- Cards de jogos com comportamento especifico:
  - container com proporcao `16/9`
  - imagem com `object-fit: cover`
  - melhor aproveitamento para thumbnails de jogos

### 8. Estado vazio por secao

Cada secao da Home mostra mensagem de vazio quando nao houver itens:

- livros
- filmes
- jogos
- series

Isso melhora a UX quando uma API retorna vazio ou quando uma rota nao esta disponivel.

### 9. Arquivos impactados

- `src/views/HomeView.vue`
- `src/components/home/HighlightCard.vue`

## Scripts

```bash
npm run dev        # inicia ambiente de desenvolvimento
npm run build      # type-check + build de producao
npm run preview    # preview do build
npm run test:unit  # testes unitarios
npm run format     # formatacao dos arquivos em src/
```

## Estrutura principal

```text
src/
	components/auth/
		AuthModeSwitch.vue
		LoginForm.vue
		RegisterForm.vue
		index.ts
	router/
		index.ts
		routes.ts
	types/
		auth.ts
	views/
		AuthView.vue
```

## Roadmap

- dashboard apos login
- persistencia de sessao com expiracao
- estado global (Pinia)
- filtros e ranking de reviews

## Status

Projeto em desenvolvimento ativo.
