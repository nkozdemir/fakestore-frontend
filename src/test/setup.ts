import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, vi } from "vitest"
import { server } from "./msw-server.ts"

vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000/api/")

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  server.resetHandlers()
  cleanup()
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})
