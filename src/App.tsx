import { Route, Routes, useLocation } from "react-router"
import SiteHeader from "@/components/layout/SiteHeader.tsx"
import ProtectedRoute from "@/components/routing/ProtectedRoute.tsx"
import { fallbackRoute, protectedRoutes, publicRoutes } from "@/routes"

function App() {
  const location = useLocation()

  const hideNavigation = ["/login", "/register"].some((route) =>
    location.pathname.startsWith(route),
  )

  return (
    <>
      {!hideNavigation && <SiteHeader />}
      <Routes>
        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
        {protectedRoutes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<ProtectedRoute>{element}</ProtectedRoute>}
          />
        ))}
        <Route
          path={fallbackRoute.path}
          element={fallbackRoute.element}
        />
      </Routes>
    </>
  )
}

export default App
