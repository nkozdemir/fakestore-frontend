export type AuthTokens = {
  access: string
  refresh: string
}

export type AuthMeResponse = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  last_login: string | null
  date_joined: string
  is_staff: boolean
  is_superuser: boolean
}

export type UserAddress = {
  id: number
  street: string
  number: number
  city: string
  zipcode: string
  latitude: string
  longitude: string
}

export type UserProfileResponse = {
  id: number
  email: string
  username: string
  phone?: string
  addresses: UserAddress[]
  name: {
    first_name: string
    last_name: string
  }
}

export type AuthUser = {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  lastLogin: string | null
  dateJoined: string
  isStaff: boolean
  isSuperuser: boolean
  phone?: string
  addresses: UserAddress[]
}

export type LoginCredentials = {
  username: string
  password: string
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export type UsernameAvailabilityResponse = {
  username: string
  available: boolean
}
