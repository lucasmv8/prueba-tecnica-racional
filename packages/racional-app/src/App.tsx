import { Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import PortfolioPage from './portfolio/PortfolioPage'
import TransactionsPage from './transactions/TransactionsPage'
import ProfilePage from './profile/ProfilePage'
import WatchlistPage from './watchlist/WatchlistPage'
import Layout from './shared/components/Layout'
import ProtectedRoute from './shared/components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          <Route path="/dashboard" element={<Navigate to="/portfolio" replace />} />
          <Route path="/evolution" element={<Navigate to="/portfolio" replace />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
