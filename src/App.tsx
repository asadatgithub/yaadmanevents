import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ScannerRoute from './components/ScannerRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateEvent from './pages/CreateEvent'
import EventPage from './pages/EventPage'
import BookEvent from './pages/BookEvent'
import BookingSuccess from './pages/BookingSuccess'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ScannerDashboard from './pages/ScannerDashboard'
import ScanTicketPage from './pages/ScanTicketPage'

function AdminRedirect({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, user, profile } = useAuth()

  if (loading || (user && !profile)) return null

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />

  return <>{children}</>
}

function AppRoutes() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 ${isLanding ? '' : 'pt-16'}`}>
        <Routes>
          <Route path="/" element={<AdminRedirect><Landing /></AdminRedirect>} />
          <Route path="/login" element={<AdminRedirect><Login /></AdminRedirect>} />
          <Route path="/signup" element={<AdminRedirect><Signup /></AdminRedirect>} />
          <Route path="/dashboard" element={<AdminRedirect><ProtectedRoute><Dashboard /></ProtectedRoute></AdminRedirect>} />
          <Route path="/create-event" element={<AdminRoute><CreateEvent /></AdminRoute>} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/event/:id/book" element={<AdminRedirect><ProtectedRoute><BookEvent /></ProtectedRoute></AdminRedirect>} />
          <Route path="/booking/success" element={<AdminRedirect><BookingSuccess /></AdminRedirect>} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/scanner" element={<ScannerRoute><ScannerDashboard /></ScannerRoute>} />
          <Route path="/scan-ticket" element={<ScannerRoute><ScanTicketPage /></ScannerRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
