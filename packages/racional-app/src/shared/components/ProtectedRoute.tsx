import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../auth/AuthProvider'

import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
