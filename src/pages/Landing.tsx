import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import logo from '../assets/logo.png'

interface Event {
  id: string
  name: string
  date: string
  venue: string
  organizer_name: string
  banner_url: string | null
}

export default function Landing() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  const filtered = events.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.organizer_name.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative overflow-hidden min-h-[90vh] flex items-center hero-gradient">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <div className="animate-fade-up">
              <img
                src={logo}
                alt="Yaadman Events"
                className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8 animate-float drop-shadow-[0_20px_40px_rgba(254,209,0,0.15)]"
              />
            </div>

            <div className="animate-fade-up delay-100">
              <div className="inline-flex items-center gap-2 bg-white/[0.07] px-4 py-1.5 rounded-full text-sm text-jamaica-gold font-medium mb-6 border border-jamaica-gold/10">
                <span className="w-2 h-2 bg-jamaica-gold rounded-full animate-pulse" />
                Jamaica's Event Platform
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-5 leading-tight animate-fade-up delay-200">
              Discover{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-jamaica-gold via-jamaica-gold to-amber-300">
                Yaadman
              </span>{' '}
              Events
            </h1>

            <p className="text-base md:text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed animate-fade-up delay-300">
              Your gateway to the best events across Jamaica. Find, create, and experience unforgettable moments.
            </p>

            <div className="max-w-xl mx-auto animate-fade-up delay-400">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search events, venues, organizers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
                />
              </div>
            </div>

            {!user && (
              <div className="mt-8 flex items-center justify-center gap-4 animate-fade-up delay-500">
                <Link
                  to="/signup"
                  className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-jamaica-green/25 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white font-medium transition-colors border border-white/10 hover:border-white/25 px-6 py-3.5 rounded-xl"
                >
                  Sign In
                </Link>
              </div>
            )}

            <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto animate-fade-up delay-600">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-white">{events.length}+</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Events</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-2xl md:text-3xl font-extrabold text-white">JA</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Island Wide</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-white">24/7</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Access</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {search ? 'Search Results' : 'Upcoming Events'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-sm text-jamaica-green hover:text-jamaica-green-dark font-medium transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-jamaica-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 animate-scale-in">
            <div className="text-5xl mb-4">🎶</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500">Check back soon for upcoming events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event, i) => (
              <div
                key={event.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 100, 600)}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
