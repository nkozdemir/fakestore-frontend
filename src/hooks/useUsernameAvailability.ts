import { useCallback, useEffect, useRef, useState } from "react"
import { fetchJson } from "@/lib/api.ts"
import { usernameStrictSchema } from "@/lib/username-policy.ts"
import type { UsernameAvailabilityResponse } from "@/types/auth.ts"

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error"

type CheckResult = {
  checked: boolean
  available: boolean
}

export function useUsernameAvailability() {
  const [status, setStatus] = useState<UsernameStatus>("idle")
  const controllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setStatus("idle")
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const checkAvailability = useCallback(
    async (rawUsername: string): Promise<CheckResult> => {
      const username = rawUsername.trim()
      controllerRef.current?.abort()

      const validation = usernameStrictSchema.safeParse(username)
      if (!validation.success) {
        setStatus("idle")
        return { checked: false, available: false }
      }

      const normalizedUsername = validation.data

      const controller = new AbortController()
      controllerRef.current = controller
      setStatus("checking")

      try {
        const result = await fetchJson<UsernameAvailabilityResponse>(
          "/auth/validate-username/",
          {
            params: { username: normalizedUsername },
            init: { signal: controller.signal },
          },
        )

        const available = Boolean(result.available)
        setStatus(available ? "available" : "unavailable")
        return { checked: true, available }
      } catch (error) {
        if (controller.signal.aborted) {
          return { checked: false, available: false }
        }

        console.warn("Username availability check failed", error)
        setStatus("error")
        return { checked: false, available: false }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
      }
    },
    [],
  )

  return {
    status,
    checkAvailability,
    reset,
  }
}
