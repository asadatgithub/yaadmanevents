import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLanding = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const navBg = !isLanding || scrolled || menuOpen
    ? 'bg-jamaica-black/95 backdrop-blur-md shadow-lg'
    : 'bg-transparent'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Yaadman Events" className="h-10 w-10 rounded-lg object-contain" />
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-jamaica-gold font-extrabold text-lg tracking-tight">YAADMAN</span>
              <span className="text-jamaica-green font-bold text-lg">EVENTS</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="text-gray-300 hover:text-jamaica-gold transition-colors text-sm font-medium">
                  Admin Dashboard
                </Link>
                <span className="text-gray-500 text-sm">{profile?.name}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-jamaica-green hover:bg-jamaica-green-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : user ? (
              <>
                <Link to="/" className="text-gray-300 hover:text-jamaica-gold transition-colors text-sm font-medium">
                  Home
                </Link>
                <Link to="/dashboard" className="text-gray-300 hover:text-jamaica-gold transition-colors text-sm font-medium">
                  Dashboard
                </Link>
                <span className="text-gray-500 text-sm">{profile?.name}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-jamaica-green hover:bg-jamaica-green-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-300 hover:text-jamaica-gold transition-colors text-sm font-medium">
                  Home
                </Link>
                <Link to="/login" className="text-gray-300 hover:text-jamaica-gold transition-colors text-sm font-medium">
                  Log In
                </Link>
                <Link to="/signup" className="bg-jamaica-green hover:bg-jamaica-green-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 pb-4 space-y-2 bg-jamaica-black/95 backdrop-blur-md">
          {isAdmin ? (
            <>
              <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-300 hover:text-jamaica-gold text-sm">
                Admin Dashboard
              </Link>
              <button onClick={() => { handleSignOut(); setMenuOpen(false) }} className="block py-2 text-jamaica-green text-sm font-medium">
                Sign Out
              </button>
            </>
          ) : user ? (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-300 hover:text-jamaica-gold text-sm">
                Home
              </Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-300 hover:text-jamaica-gold text-sm">
                Dashboard
              </Link>
              <button onClick={() => { handleSignOut(); setMenuOpen(false) }} className="block py-2 text-jamaica-green text-sm font-medium">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-300 hover:text-jamaica-gold text-sm">
                Home
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-300 hover:text-jamaica-gold text-sm">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="block py-2 text-jamaica-green text-sm font-medium">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
