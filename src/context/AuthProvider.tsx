import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { AuthContext } from "@/context/auth-context.ts"
import { buildApiUrl, fetchJson } from "@/lib/api.ts"
import {
  clearStoredTokens,
  readStoredTokens,
  storeTokens,
} from "@/lib/auth-storage.ts"
import type {
  AuthMeResponse,
  AuthTokens,
  AuthUser,
  LoginCredentials,
  RegisterPayload,
  UserProfileResponse,
} from "@/types/auth.ts"

type AuthProviderProps = {
  children: ReactNode
}

const AUTH_HEADERS = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
})

async function fetchAuthenticatedUser(accessToken: string): Promise<AuthUser> {
  const me = await fetchJson<AuthMeResponse>("/auth/me/", {
    init: {
      headers: AUTH_HEADERS(accessToken),
    },
  })

  let profile: UserProfileResponse | null = null

  try {
    profile = await fetchJson<UserProfileResponse>(`/users/${me.id}/`, {
      init: {
        headers: AUTH_HEADERS(accessToken),
      },
    })
  } catch (error) {
    console.warn("Failed to load user profile information", error)
  }

  return {
    id: me.id,
    username: me.username,
    email: me.email,
    firstName: profile?.name?.first_name ?? me.first_name,
    lastName: profile?.name?.last_name ?? me.last_name,
    lastLogin: me.last_login,
    isStaff: me.is_staff,
    isSuperuser: me.is_superuser,
    phone: profile?.phone,
    addresses: profile?.addresses ?? [],
  }
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const accessToken = tokens?.access ?? null
  const refreshToken = tokens?.refresh ?? null

  const applyTokens = useCallback((nextTokens: AuthTokens | null) => {
    setTokens(nextTokens)

    if (nextTokens) {
      storeTokens(nextTokens)
    } else {
      clearStoredTokens()
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!accessToken) {
      setUser(null)
      return
    }

    try {
      const fetchedUser = await fetchAuthenticatedUser(accessToken)
      setUser(fetchedUser)
    } catch (error) {
      console.warn("Refreshing user failed", error)
      applyTokens(null)
      setUser(null)
    }
  }, [accessToken, applyTokens])

  const bootstrapSession = useCallback(async () => {
    const storedTokens = readStoredTokens()

    if (!storedTokens) {
      setIsLoading(false)
      return
    }

    applyTokens(storedTokens)

    try {
      const fetchedUser = await fetchAuthenticatedUser(storedTokens.access)
      setUser(fetchedUser)
    } catch (error) {
      console.warn("Failed to restore session", error)
      applyTokens(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [applyTokens])

  useEffect(() => {
    void bootstrapSession()
  }, [bootstrapSession])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await fetch(buildApiUrl("/auth/login/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      let parsedBody: unknown = null

      try {
        parsedBody = await response.json()
      } catch {
        parsedBody = null
      }

      if (!response.ok) {
        const detail =
          typeof parsedBody === "object" &&
          parsedBody !== null &&
          "detail" in parsedBody &&
          typeof (parsedBody as { detail: unknown }).detail === "string"
            ? (parsedBody as { detail: string }).detail
            : null

        console.warn("Login attempt failed", {
          status: response.status,
          detail,
        })

        let friendlyMessage: string

        switch (response.status) {
          case 400:
          case 401:
          case 403:
            friendlyMessage =
              "We couldn’t match that username and password. Double-check your details and try again."
            break
          case 429:
            friendlyMessage =
              "Too many sign-in attempts. Please wait a moment and try again."
            break
          default:
            friendlyMessage =
              "We ran into a problem while signing you in. Please try again in a few moments."
        }

        throw new Error(friendlyMessage)
      }

      const tokens = parsedBody as Partial<AuthTokens> | null

      if (
        !tokens ||
        typeof tokens.access !== "string" ||
        typeof tokens.refresh !== "string"
      ) {
        throw new Error(
          "We ran into an unexpected issue while signing you in. Please try again.",
        )
      }

      const validatedTokens: AuthTokens = {
        access: tokens.access,
        refresh: tokens.refresh,
      }

      applyTokens(validatedTokens)

      try {
        const fetchedUser = await fetchAuthenticatedUser(validatedTokens.access)
        setUser(fetchedUser)
      } catch (error) {
        applyTokens(null)
        setUser(null)
        throw error instanceof Error
          ? error
          : new Error("Unable to load your account details after signing in.")
      }
    },
    [applyTokens],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await fetch(buildApiUrl("/auth/register/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: payload.username,
          email: payload.email,
          password: payload.password,
          first_name: payload.firstName,
          last_name: payload.lastName,
        }),
      })

      let parsedBody: unknown = null

      try {
        parsedBody = await response.json()
      } catch {
        parsedBody = null
      }

      if (!response.ok) {
        const detail =
          typeof parsedBody === "object" &&
          parsedBody !== null &&
          "detail" in parsedBody &&
          typeof (parsedBody as { detail: unknown }).detail === "string"
            ? (parsedBody as { detail: string }).detail
            : null

        const fallbackMessage =
          response.status === 400
            ? "We couldn’t create your account with those details. Please review the form and try again."
            : "We ran into a problem while creating your account. Please try again in a few moments."

        const friendlyMessage = detail ?? fallbackMessage

        throw new Error(friendlyMessage)
      }

      try {
        await login({
          username: payload.username,
          password: payload.password,
        })
      } catch (error) {
        throw error instanceof Error
          ? error
          : new Error(
              "Your account was created, but we couldn’t sign you in automatically. Try logging in manually.",
            )
      }
    },
    [login],
  )

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await fetch(buildApiUrl("/auth/logout/"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      } catch (error) {
        console.warn("Logout request failed", error)
      }
    }

    applyTokens(null)
    setUser(null)
  }, [applyTokens, refreshToken])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [accessToken, isLoading, login, logout, refreshToken, refreshUser, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
