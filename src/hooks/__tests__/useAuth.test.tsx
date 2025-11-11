import { act, renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import AuthProvider from "@/context/AuthProvider.tsx"
import useAuth from "@/hooks/useAuth.ts"
import type { AuthTokens } from "@/types/auth.ts"
import { server } from "@/test/msw-server.ts"

const API_BASE_URL = "http://localhost:8000/api/"

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/"]}>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
)

const baseUserResponse = {
  id: 1,
  username: "janedoe",
  email: "jane@example.com",
  first_name: "Jane",
  last_name: "Doe",
  last_login: "2024-01-01T00:00:00Z",
  date_joined: "2020-01-01T00:00:00Z",
  is_staff: false,
  is_superuser: false,
}

const baseProfileResponse = {
  id: 1,
  email: "jane@example.com",
  username: "janedoe",
  phone: "+1-555-0101",
  addresses: [],
  name: {
    first_name: "Jane",
    last_name: "Doe",
  },
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function createJwtToken(expiresInSeconds: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = base64UrlEncode(
    JSON.stringify({
      exp: nowSeconds + expiresInSeconds,
    }),
  )

  return `${header}.${payload}.signature`
}

function installBootstrapHandlers() {
  server.use(
    http.get(`${API_BASE_URL}auth/me/`, () => HttpResponse.json(baseUserResponse)),
    http.get(`${API_BASE_URL}users/1/`, () => HttpResponse.json(baseProfileResponse)),
  )
}

describe("useAuth", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("logs in successfully, fetches the user profile, and stores tokens", async () => {
    const loginRequests: unknown[] = []
    installBootstrapHandlers()

    server.use(
      http.post(`${API_BASE_URL}auth/login/`, async ({ request }) => {
        loginRequests.push(await request.json())

        return HttpResponse.json({
          access: createJwtToken(3600),
          refresh: createJwtToken(7200),
        })
      }),
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.login({ username: "janedoe", password: "pass1234" })
    })

    expect(loginRequests).toHaveLength(1)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toMatchObject({
      id: 1,
      username: "janedoe",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
    })

    const storedTokens = JSON.parse(
      window.localStorage.getItem("fakestore.authTokens") ?? "{}",
    ) as AuthTokens

    expect(storedTokens.access).toEqual(expect.any(String))
    expect(storedTokens.refresh).toEqual(expect.any(String))
  })

  it("clears state and removes tokens on logout", async () => {
    installBootstrapHandlers()

    server.use(
      http.post(`${API_BASE_URL}auth/login/`, () =>
        HttpResponse.json({
          access: createJwtToken(3600),
          refresh: createJwtToken(7200),
        }),
      ),
      http.post(`${API_BASE_URL}auth/logout/`, async ({ request }) => {
        expect(await request.json()).toEqual({
          refresh: expect.any(String),
        })

        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.login({ username: "janedoe", password: "pass1234" })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(window.localStorage.getItem("fakestore.authTokens")).not.toBeNull()

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(window.localStorage.getItem("fakestore.authTokens")).toBeNull()
  })

  it("refreshes the access token before it expires", async () => {
    const realSetTimeout = globalThis.setTimeout
    let scheduledDelay: number | undefined
    let scheduledCallback: (() => unknown) | null = null
    let scheduledHandle: ReturnType<typeof setTimeout> | null = null

    const setTimeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
        const handle = realSetTimeout(callback as TimerHandler, delay ?? 0, ...args)

        if (typeof delay === "number" && delay >= 30_000 && typeof callback === "function") {
          scheduledCallback = callback as () => unknown
          scheduledDelay = delay
          scheduledHandle = handle
        }

        return handle
      })

    try {
      const initialTokens: AuthTokens = {
        access: createJwtToken(40),
        refresh: createJwtToken(24 * 60 * 60),
      }

      window.localStorage.setItem("fakestore.authTokens", JSON.stringify(initialTokens))

      const refreshCalls: Array<Record<string, unknown>> = []

      installBootstrapHandlers()

      server.use(
        http.post(`${API_BASE_URL}auth/refresh/`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>
          refreshCalls.push(body)

          return HttpResponse.json({
            access: createJwtToken(60 * 60),
          })
        }),
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(setTimeoutSpy).toHaveBeenCalled()
      expect(scheduledDelay).toBeGreaterThan(0)
      expect(scheduledDelay).toBeLessThanOrEqual(40_000)
      expect(scheduledCallback).toBeTypeOf("function")

      await act(async () => {
        scheduledCallback?.()
      })

      if (scheduledHandle) {
        clearTimeout(scheduledHandle)
      }

      await waitFor(() => {
        expect(refreshCalls).toHaveLength(1)
      })

      const storedTokens = JSON.parse(
        window.localStorage.getItem("fakestore.authTokens") ?? "{}",
      ) as AuthTokens

      expect(storedTokens.access).not.toBe(initialTokens.access)
      expect(storedTokens.refresh).toBe(initialTokens.refresh)
    } finally {
      setTimeoutSpy.mockRestore()
    }
  }, 10_000)
})
