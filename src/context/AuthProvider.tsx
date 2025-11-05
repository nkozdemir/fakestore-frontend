import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router"
import { AuthContext } from "@/context/auth-context.ts"
import {
  ApiError,
  buildApiUrl,
  fetchJson,
  formatApiErrorMessage,
  parseApiError,
} from "@/lib/api.ts"
import {
  clearStoredTokens,
  readStoredTokens,
  storeTokens,
} from "@/lib/auth-storage.ts"
import { getJwtExpiry } from "@/lib/jwt.ts"
import { authorizationHeader } from "@/lib/auth-headers.ts"
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

const REFRESH_LEEWAY_MS = 60_000
const MIN_EXPIRY_BUFFER_MS = 5_000
const MIN_REFRESH_INTERVAL_MS = 1_000
const FALLBACK_REFRESH_INTERVAL_MS = 5 * 60_000

async function fetchAuthenticatedUser(accessToken: string): Promise<AuthUser> {
  const me = await fetchJson<AuthMeResponse>("/auth/me/", {
    init: {
      headers: authorizationHeader(accessToken),
    },
  })

  let profile: UserProfileResponse | null = null

  try {
    profile = await fetchJson<UserProfileResponse>(`/users/${me.id}/`, {
      init: {
        headers: authorizationHeader(accessToken),
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
    dateJoined: me.date_joined,
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
  const navigate = useNavigate()
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRefreshingRef = useRef(false)

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [])

  const accessToken = tokens?.access ?? null
  const refreshToken = tokens?.refresh ?? null

  const applyTokens = useCallback(
    (nextTokens: AuthTokens | null) => {
      clearRefreshTimeout()
      setTokens(nextTokens)

      if (nextTokens) {
        storeTokens(nextTokens)
      } else {
        clearStoredTokens()
      }
    },
    [clearRefreshTimeout],
  )

  const handleRefreshFailure = useCallback(() => {
    applyTokens(null)
    setUser(null)
    navigate("/login", { replace: true })
  }, [applyTokens, navigate])

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken || isRefreshingRef.current) {
      return
    }

    isRefreshingRef.current = true

    try {
      const refreshResponse = await fetchJson<{ access?: unknown }>(
        "/auth/refresh/",
        {
          init: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
          },
        },
      )

      if (typeof refreshResponse.access !== "string") {
        throw new Error("Refresh response missing access token")
      }

      const updatedTokens: AuthTokens = {
        access: refreshResponse.access,
        refresh: refreshToken,
      }

      applyTokens(updatedTokens)
    } catch (error) {
      console.warn("Access token refresh failed", error)
      handleRefreshFailure()
    } finally {
      isRefreshingRef.current = false
    }
  }, [applyTokens, handleRefreshFailure, refreshToken])

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
    clearRefreshTimeout()

    if (!accessToken || !refreshToken) {
      return
    }

    const expiryTime = getJwtExpiry(accessToken)

    if (!expiryTime) {
      refreshTimeoutRef.current = setTimeout(() => {
        void refreshAccessToken()
      }, FALLBACK_REFRESH_INTERVAL_MS)
      return
    }

    const now = Date.now()
    const timeUntilExpiry = expiryTime - now

    if (timeUntilExpiry <= MIN_REFRESH_INTERVAL_MS) {
      void refreshAccessToken()
      return
    }

    if (timeUntilExpiry <= REFRESH_LEEWAY_MS) {
      const bufferAdjusted = timeUntilExpiry - MIN_EXPIRY_BUFFER_MS
      const cappedDelay = Math.min(
        bufferAdjusted,
        timeUntilExpiry - MIN_REFRESH_INTERVAL_MS,
      )
      const delay = Math.max(cappedDelay, MIN_REFRESH_INTERVAL_MS)

      refreshTimeoutRef.current = setTimeout(() => {
        void refreshAccessToken()
      }, delay)
      return
    }

    const delay = timeUntilExpiry - REFRESH_LEEWAY_MS

    refreshTimeoutRef.current = setTimeout(() => {
      void refreshAccessToken()
    }, delay)

    return () => {
      clearRefreshTimeout()
    }
  }, [accessToken, clearRefreshTimeout, refreshAccessToken, refreshToken])

  useEffect(() => {
    void bootstrapSession()
  }, [bootstrapSession])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const invalidCredentialsMessage =
        "We couldn’t match that username and password. Double-check your details and try again."
      const throttledMessage =
        "Too many sign-in attempts. Please wait a moment and try again."
      const defaultMessage =
        "We ran into a problem while signing you in. Please try again in a few moments."

      let tokens: Partial<AuthTokens> | null = null

      try {
        tokens = await fetchJson<Partial<AuthTokens>>("/auth/login/", {
          init: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          },
        })
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === "TOO_MANY_REQUESTS" || error.status === 429) {
            throw new Error(
              formatApiErrorMessage(error, throttledMessage, [
                "Request was throttled",
              ]),
            )
          }

          if (
            ["VALIDATION_ERROR", "UNAUTHORIZED", "FORBIDDEN"].includes(
              error.code,
            ) ||
            [400, 401, 403].includes(error.status)
          ) {
            throw new Error(
              formatApiErrorMessage(error, invalidCredentialsMessage, [
                "Validation failed",
                "Authentication required",
                "You do not have permission to perform this action",
              ]),
            )
          }

          throw new Error(
            formatApiErrorMessage(error, defaultMessage, ["Request failed"]),
          )
        }

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : defaultMessage

        throw new Error(message)
      }

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
      let response: Response

      try {
        response = await fetch(buildApiUrl("/auth/register/"), {
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
      } catch (networkError) {
        const fallbackMessage =
          "We ran into a problem while creating your account. Please try again in a few moments."
        throw new Error(
          networkError instanceof Error && networkError.message.trim().length > 0
            ? networkError.message
            : fallbackMessage,
        )
      }

      if (!response.ok) {
        const apiError = await parseApiError(response)
        const fallbackMessage =
          apiError.status === 400
            ? "We couldn’t create your account with those details. Please review the form and try again."
            : "We ran into a problem while creating your account. Please try again in a few moments."

        throw new Error(
          formatApiErrorMessage(apiError, fallbackMessage, [
            "Validation failed",
            "Request failed",
          ]),
        )
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
