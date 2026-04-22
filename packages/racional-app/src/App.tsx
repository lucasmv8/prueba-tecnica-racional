import { Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import DashboardPage from './dashboard/DashboardPage'
import EvolutionPage from './evolution/EvolutionPage'
import PortfolioPage from './portfolio/PortfolioPage'
import TransactionsPage from './transactions/TransactionsPage'
import ProfilePage from './profile/ProfilePage'
import Layout from './shared/components/Layout'
import ProtectedRoute from './shared/components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/evolution" element={<EvolutionPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
