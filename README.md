# Fakestore-Frontend

A modern Vite + React storefront for the FakeStore sample API. It implements browsing, authentication-protected actions, and a polished shopping experience by combining reusable UI primitives with robust data fetching.

## Features
- Product catalogue with category filtering, pagination, skeleton loading states, and lightweight caching via TanStack Query.
- Detailed product view with rating summaries, authenticated rating actions, carousel-ready media, and add-to-cart helpers.
- Session-aware sign in/out and registration powered by JWT tokens, token refresh, protected routes, and form validation with React Hook Form + Zod.
- Fully managed cart experience with quantity steppers, optimistic updates, and toast feedback on success/error.
- Responsive layout, accessible navigation, and a light/dark/system theme toggle built on Radix UI primitives.

## Tech stack
- React 19 + TypeScript
- Vite 7 with Tailwind CSS 4 and PostCSS
- React Router 7 for routing
- TanStack Query 5 for API caching
- React Hook Form + Zod for forms and validation
- shadcn/ui components driven by Radix UI, lucide-react icons, and Sonner notifications

## Getting started
1. Copy the environment template and update it with your API endpoint:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_BASE_URL` to the root of your FakeStore API (e.g. `http://localhost:8000/api/`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The app defaults to `http://localhost:5173`.

## Available scripts
- `npm run dev` — start the development server with hot module replacement.
- `npm run lint` — run ESLint across the project.
- `npm run build` — type-check and produce a production build.
- `npm run preview` — serve the built assets locally.

## Environment variables
- `VITE_API_BASE_URL` — base URL of the FakeStore backend (`/` suffix optional); used for all REST requests.

## Project structure
- `src/pages/` — top-level route components such as products, product detail, cart, login, register, and profile.
- `src/context/AuthProvider.tsx` — centralizes JWT storage, refresh logic, and the authenticated user state.
- `src/hooks/` — reusable domain hooks (auth, cart) built on TanStack Query.
- `src/lib/` — API helpers, query client configuration, and shared utilities.
- `src/components/` — design system primitives and layout pieces (header, mode toggle, toasts).

The frontend expects a FakeStore-compatible backend that exposes `products/`, `categories/`, `auth/`, and `carts/` endpoints. Once the API is reachable and the environment variable set, the app boots with complete browsing, rating, and cart flows.
