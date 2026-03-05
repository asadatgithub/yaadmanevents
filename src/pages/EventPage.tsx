import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Event {
  id: string
  name: string
  date: string
  venue: string
  organizer_name: string
  banner_url: string | null
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isScan = searchParams.get('scan') === '1'

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    setEvent(data)
    setLoading(false)
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !amount) return
    setError('')
    setSubmitting(true)

    const { error: insertError } = await supabase.from('expenses').insert({
      event_id: id,
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
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Organizer
            </div>
            <div className="font-semibold text-gray-900">{event.organizer_name}</div>
          </div>
        </div>

        {isScan ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-jamaica-green/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-jamaica-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Record Expense</h2>
                <p className="text-gray-500 text-sm">Enter the amount you spent at this event</p>
              </div>
            </div>

            {submitted && (
              <div className="bg-jamaica-green/10 text-jamaica-green px-4 py-3 rounded-lg text-sm mt-4 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Expense recorded successfully!
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mt-4 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleExpenseSubmit} className="flex gap-3 mt-5">
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
                disabled={submitting}
                className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 shrink-0"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
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
