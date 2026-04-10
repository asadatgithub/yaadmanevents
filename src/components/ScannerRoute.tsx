import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ScannerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isScanner, loading } = useAuth()
  const location = useLocation()

  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-jamaica-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !isScanner) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return <>{children}</>
}

