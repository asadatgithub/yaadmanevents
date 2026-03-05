import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, loading } = useAuth()

  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-jamaica-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !isAdmin) return <Navigate to="/admin" replace />

  return <>{children}</>
}
