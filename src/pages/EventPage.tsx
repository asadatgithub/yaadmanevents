import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Event {
  id: string
  name: string
  date: string
  venue: string
  address_1: string | null
  address_2: string | null
  parish: string | null
  organizer_name: string | null
  banner_url: string | null
  qr_active: boolean | null
  user_id: string
}


export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isScan = searchParams.get('scan') === '1'
  const { user } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) fetchEvent()
  }, [id])

  useEffect(() => {
    if (user && isScan) fetchMyEvents()
  }, [user, isScan])

  const fetchEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    setEvent(data)
    setLoading(false)
  }

  const fetchMyEvents = async () => {
    if (!user) return
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    const events = data || []
    setMyEvents(events)
    if (events.length === 1) setSelectedEventId(events[0].id)
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !amount || !selectedEventId) return
    setError('')
    setSubmitting(true)

    const { error: insertError } = await supabase.from('supports').insert({
      event_id: selectedEventId,
      supporter_event_id: id,
      amount: parseFloat(amount),
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setAmount('')
    setSubmitting(false)
    setTimeout(() => setSubmitted(false), 4000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-jamaica-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Event Not Found</h2>
        <p className="text-gray-500 mb-6">This event may have been removed or the link is invalid.</p>
        <Link to="/" className="text-jamaica-green font-medium hover:underline">
          Browse Events
        </Link>
      </div>
    )
  }

  const isOwnEvent = user && event.user_id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {event.banner_url ? (
          <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img
              src={event.banner_url}
              alt={event.name}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">{event.name}</h1>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-jamaica-green to-jamaica-green-dark p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{event.name}</h1>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Date
            </div>
            <div className="font-semibold text-gray-900">
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Venue
            </div>
            <div className="font-semibold text-gray-900">{event.venue}</div>
            {(event.address_1 || event.address_2 || event.parish) && (
              <div className="text-sm text-gray-500 mt-1">
                {[event.address_1, event.address_2, event.parish].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          {event.organizer_name && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Organizer
              </div>
              <div className="font-semibold text-gray-900">{event.organizer_name}</div>
            </div>
          )}
        </div>

        {isScan ? (
          (() => {
            const eventDate = new Date(event.date + 'T23:59:59')
            const isPast = eventDate < new Date()
            const qrDisabled = event.qr_active === false || (isPast && event.qr_active !== true)

            if (qrDisabled) {
              return (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Event Has Ended</h2>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    This event is no longer active and support can no longer be recorded.
                  </p>
                  <Link to="/" className="inline-flex items-center gap-2 text-jamaica-green hover:text-jamaica-green-dark font-medium transition-colors mt-6">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Browse Events
                  </Link>
                </div>
              )
            }

            if (!user) {
              return (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-jamaica-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-jamaica-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h2>
                  <p className="text-gray-500 max-w-sm mx-auto mb-6">
                    You need to be logged in to record support for this promoter.
                  </p>
                  <Link
                    to={`/login?redirect=/event/${id}?scan=1`}
                    className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block"
                  >
                    Sign In
                  </Link>
                </div>
              )
            }

            if (isOwnEvent) {
              return (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">This Is Your Event</h2>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    You cannot record support on your own event.
                  </p>
                </div>
              )
            }

            if (myEvents.length === 0) {
              return (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-jamaica-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-jamaica-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">No Events Yet</h2>
                  <p className="text-gray-500 max-w-sm mx-auto mb-6">
                    You need to create an event before you can record support.
                  </p>
                  <Link
                    to="/create-event"
                    className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block"
                  >
                    Create Event
                  </Link>
                </div>
              )
            }

            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-jamaica-green/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-jamaica-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Record Support</h2>
                    <p className="text-gray-500 text-sm">
                      Record how much {event.organizer_name ? <span className="font-medium text-gray-700">{event.organizer_name}</span> : 'this promoter'} spent supporting your event
                    </p>
                  </div>
                </div>

                {submitted && (
                  <div className="bg-jamaica-green/10 text-jamaica-green px-4 py-3 rounded-lg text-sm mt-4 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Support recorded successfully!
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mt-4 font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSupportSubmit} className="space-y-4 mt-5">
                  {myEvents.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Your Event
                      </label>
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
                      >
                        <option value="">Select your event...</option>
                        {myEvents.map((ev) => (
                          <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !selectedEventId}
                      className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                    >
                      {submitting ? 'Recording...' : 'Record Support'}
                    </button>
                  </div>
                </form>
              </div>
            )
          })()
        ) : (
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-jamaica-green hover:text-jamaica-green-dark font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Events
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
