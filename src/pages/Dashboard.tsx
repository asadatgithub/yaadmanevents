import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Event {
  id: string
  name: string
  date: string
  venue: string
  organizer_name: string
  banner_url: string | null
}

const ADMIN_WHATSAPP = import.meta.env.VITE_ADMIN_WHATSAPP || ''

function getWhatsAppUrl(eventName: string) {
  const message = encodeURIComponent(
    `Hi, I'd like to request the QR code for my event: "${eventName}" on Yaadman Events.`
  )
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchMyEvents()
  }, [user])

  const fetchMyEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    setDeleting(id)
    await supabase.from('events').delete().eq('id', id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Events</h1>
            <p className="text-gray-500 mt-1">Welcome back, {profile?.name}</p>
          </div>
          <Link
            to="/create-event"
            className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-jamaica-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-6">Create your first event and share it with the world!</p>
            <Link
              to="/create-event"
              className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {event.banner_url ? (
                  <img
                    src={event.banner_url}
                    alt={event.name}
                    className="w-full sm:w-28 h-36 sm:h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full sm:w-28 h-36 sm:h-20 bg-gradient-to-br from-jamaica-green/10 to-jamaica-gold/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{event.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {event.venue}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <a
                    href={getWhatsAppUrl(event.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#25D366] hover:bg-[#1da851] rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Get QR Code
                  </a>
                  <Link
                    to={`/event/${event.id}`}
                    className="px-4 py-2 text-sm font-medium text-jamaica-green border border-jamaica-green rounded-lg hover:bg-jamaica-green hover:text-white transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={deleting === event.id}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting === event.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
