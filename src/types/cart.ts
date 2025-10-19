import type { Product } from "@/types/catalog.ts"

export type CartItem = {
  product: Product
  quantity: number
}

export type Cart = {
  id: number
  user_id: number
  date: string
  items?: CartItem[] | null
}

export type CartItemInput = {
  product_id: number
  quantity: number
}

export type CartPatchPayload = {
  add?: CartItemInput[]
  update?: CartItemInput[]
  remove?: number[]
  date?: string
  userId?: number
}
