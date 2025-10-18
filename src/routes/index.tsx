import type { ReactNode } from "react"
import LoginPage from "@/pages/LoginPage.tsx"
import RegisterPage from "@/pages/RegisterPage.tsx"
import NotFoundPage from "@/pages/NotFoundPage.tsx"
import ProductDetailPage from "@/pages/ProductDetailPage.tsx"
import ProductsPage from "@/pages/ProductsPage.tsx"
import CartsPage from "@/pages/CartsPage.tsx"
import ProfilePage from "@/pages/ProfilePage.tsx"

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
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/products/:productId",
    element: <ProductDetailPage />,
  },
]

export const protectedRoutes: AppRoute[] = [
  {
    path: "/carts",
    element: <CartsPage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
]

export const fallbackRoute: AppRoute = {
  path: "*",
  element: <NotFoundPage />,
}
