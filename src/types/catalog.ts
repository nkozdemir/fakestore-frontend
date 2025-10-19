export type Category = {
  id: number
  name: string
}

export type Product = {
  id: number
  title: string
  price: string
  description: string
  image: string
  rate: string
  count: number
  categories: Category[]
}

export type ProductResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Product[]
}

export type RatingSummary = {
  productId: number
  rating: {
    rate: number
    count: number
  }
  userRating: number | null
}

export type ProductRatingEntry = {
  id: number | null
  firstName: string | null
  lastName: string | null
  value: number
  createdAt: string | null
  updatedAt: string | null
}

export type ProductRatingsList = {
  productId: number
  count: number
  ratings: ProductRatingEntry[]
}
