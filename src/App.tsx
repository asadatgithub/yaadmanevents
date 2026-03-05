import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateEvent from './pages/CreateEvent'
import EventPage from './pages/EventPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function AppRoutes() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 ${isLanding ? '' : 'pt-16'}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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
