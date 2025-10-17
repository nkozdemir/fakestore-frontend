import type { ReactNode } from "react"
import CartsPage from "@/pages/CartsPage.tsx"
import LoginPage from "@/pages/LoginPage.tsx"
import NotFoundPage from "@/pages/NotFoundPage.tsx"
import ProfilePage from "@/pages/ProfilePage.tsx"
import ProductDetailPage from "@/pages/ProductDetailPage.tsx"
import ProductsPage from "@/pages/ProductsPage.tsx"

export type AppRoute = {
  path: string
  element: ReactNode
}

export const publicRoutes: AppRoute[] = [
  {
    path: "/",
    element: <ProductsPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/products/:productId",
    element: <ProductDetailPage />,
  },
  {
    path: "/carts",
    element: <CartsPage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
]

export const protectedRoutes: AppRoute[] = []

export const fallbackRoute: AppRoute = {
  path: "*",
  element: <NotFoundPage />,
}
