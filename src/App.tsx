import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/components/routing/ProtectedRoute.tsx'
import DashboardPage from '@/pages/DashboardPage.tsx'
import HomePage from '@/pages/HomePage.tsx'
import LoginPage from '@/pages/LoginPage.tsx'
import NotFoundPage from '@/pages/NotFoundPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
