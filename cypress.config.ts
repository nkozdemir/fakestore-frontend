import { defineConfig } from "cypress"
import { loadEnv } from "vite"

const resolvedEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "")

const baseUrl =
  process.env.CYPRESS_BASE_URL ?? resolvedEnv.CYPRESS_BASE_URL ?? "http://localhost:5173"

const apiBaseUrl =
  process.env.CYPRESS_API_BASE_URL ??
  resolvedEnv.CYPRESS_API_BASE_URL ??
  resolvedEnv.VITE_API_BASE_URL ??
  "http://localhost:8000/api/"

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      apiBaseUrl,
    },
  },
})
