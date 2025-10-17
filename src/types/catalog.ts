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
