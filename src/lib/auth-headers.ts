export function authorizationHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  } as const
}

export function optionalAuthorizationHeader(token: string | null | undefined) {
  return token ? authorizationHeader(token) : {}
}
