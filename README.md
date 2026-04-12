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
