import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface EventRow {
  id: string
  name: string
  date: string
  venue: string
  booking_enabled: boolean | null
  base_price: number | null
  description: string | null
  pickup_times: string[] | null
  return_times: string[] | null
}

interface AddonRow {
  id: string
  name: string
  price: number
}

export default function BookEvent() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const [event, setEvent] = useState<EventRow | null>(null)
  const [addons, setAddons] = useState<AddonRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pickupTime, setPickupTime] = useState('')
  const [returnTime, setReturnTime] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [ticketHolders, setTicketHolders] = useState<string[]>([''])
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.name && !guestName) setGuestName(profile.name)
    if (user?.email && !guestEmail) setGuestEmail(user.email)
  }, [profile, user])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      const { data: ev } = await supabase
        .from('events')
        .select('id, name, date, venue, booking_enabled, base_price, description, pickup_times, return_times')
        .eq('id', id)
        .single()
      if (cancelled) return
      if (!ev || !ev.booking_enabled || ev.base_price == null) {
        setEvent(null)
        setLoading(false)
        return
      }
      setEvent(ev as EventRow)
      const { data: adds } = await supabase
        .from('event_addons')
        .select('id, name, price')
        .eq('event_id', id)
        .eq('active', true)
        .order('sort_order', { ascending: true })
      if (!cancelled) setAddons((adds || []) as AddonRow[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const base = event ? Number(event.base_price) : 0
  const addonsTotal = addons
    .filter((a) => selected.has(a.id))
    .reduce((s, a) => s + Number(a.price), 0)
  const unitTotal = base + addonsTotal
  const total = unitTotal * quantity

  const toggleAddon = (addonId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(addonId)) next.delete(addonId)
      else next.add(addonId)
      return next
    })
  }

  const changeQuantity = (next: number) => {
    const normalized = Math.max(1, Math.min(10, next))
    setQuantity(normalized)
    setTicketHolders((prev) => {
      const clone = [...prev]
      if (clone.length < normalized) {
        while (clone.length < normalized) clone.push('')
      }
      return clone.slice(0, normalized)
    })
  }

  const setTicketHolder = (index: number, value: string) => {
    setTicketHolders((prev) => prev.map((x, i) => (i === index ? value : x)))
  }

  const handleCheckout = async () => {
    if (!id || !event) return
    setError('')
    
    if (!guestName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!guestEmail.match(/^\S+@\S+\.\S+$/)) {
      setError('Please enter a valid email address.')
      return
    }
    if (event.pickup_times?.length && !pickupTime) {
      setError('Please select a pickup time.')
      return
    }
    if (event.return_times?.length && !returnTime) {
      setError('Please select a return time.')
      return
    }
    if (ticketHolders.some((name) => !name.trim())) {
      setError('Please enter a name for each ticket.')
      return
    }

    setPaying(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const apiBase = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${apiBase}/api/create-checkout-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventId: id,
        addonIds: Array.from(selected),
        pickupTime,
        returnTime,
        guestName,
        guestEmail,
        quantity,
        ticketHolders: ticketHolders.map((name) => ({ name })),
        paymentMethod,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(typeof body.error === 'string' ? body.error : 'Checkout failed')
      setPaying(false)
      return
    }
    if (body.cash && body.bookingId) {
      window.location.href = `/booking/success?booking_id=${encodeURIComponent(body.bookingId)}`
      return
    }
    if (body.url) {
      window.location.href = body.url as string
      return
    }
    setError('No checkout URL returned')
    setPaying(false)
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
      <div className="text-center py-20 max-w-md mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Booking unavailable</h2>
        <p className="text-gray-500 mb-6">This event does not have booking enabled.</p>
        <Link to={id ? `/event/${id}` : '/'} className="text-jamaica-green font-medium hover:underline">
          Back to event
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          to={`/event/${id}`}
          className="text-sm text-jamaica-green hover:text-jamaica-green-dark font-medium inline-flex items-center gap-1 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to event
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-extrabold text-gray-900">{event.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500">{event.venue}</p>
          </div>

          <div className="p-6 space-y-4">
            {event.description && (
              <div className="text-gray-600 text-sm py-4 border-b border-gray-50 whitespace-pre-wrap">
                {event.description}
              </div>
            )}

            <div className="py-2 border-b border-gray-50 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all text-sm"
                />
              </div>
            </div>

            {event.pickup_times && event.pickup_times.length > 0 && (
              <div className="py-2 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select Pickup Time *</p>
                <div className="grid grid-cols-2 gap-2">
                  {event.pickup_times.map((time) => (
                    <label key={time} className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors ${pickupTime === time ? 'bg-jamaica-green/10 border-jamaica-green text-jamaica-green font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                      <input type="radio" className="hidden" name="pickupTime" value={time} checked={pickupTime === time} onChange={() => setPickupTime(time)} />
                      {time}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {event.return_times && event.return_times.length > 0 && (
              <div className="py-2 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select Return Time *</p>
                <div className="grid grid-cols-2 gap-2">
                  {event.return_times.map((time) => (
                    <label key={time} className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors ${returnTime === time ? 'bg-jamaica-green/10 border-jamaica-green text-jamaica-green font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                      <input type="radio" className="hidden" name="returnTime" value={time} checked={returnTime === time} onChange={() => setReturnTime(time)} />
                      {time}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="font-medium text-gray-900">Ticket</span>
              <span className="font-semibold text-gray-900">${base.toFixed(2)}</span>
            </div>
            <div className="py-2 border-b border-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => changeQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green"
              />
            </div>
            <div className="py-2 border-b border-gray-50 space-y-2">
              <p className="text-sm font-semibold text-gray-700">Ticket Holder Names</p>
              {ticketHolders.map((name, index) => (
                <input
                  key={`${index}`}
                  type="text"
                  value={name}
                  onChange={(e) => setTicketHolder(index, e.target.value)}
                  placeholder={`Ticket ${index + 1} name`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green text-sm"
                />
              ))}
            </div>

            {addons.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Add-ons</p>
                <div className="space-y-2">
                  {addons.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected.has(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="rounded border-gray-300 text-jamaica-green focus:ring-jamaica-green"
                        />
                        <span className="text-sm font-medium text-gray-900">{a.name}</span>
                      </span>
                      <span className="text-sm font-semibold text-gray-700">+J${Number(a.price).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-xl font-extrabold text-jamaica-green">J${total.toFixed(2)}</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-sm font-semibold ${paymentMethod === 'card' ? 'border-jamaica-green text-jamaica-green bg-jamaica-green/10' : 'border-gray-200 text-gray-600'}`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border text-sm font-semibold ${paymentMethod === 'cash' ? 'border-jamaica-green text-jamaica-green bg-jamaica-green/10' : 'border-gray-200 text-gray-600'}`}
                >
                  Cash
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={paying}
              className="w-full bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {paying ? 'Processing…' : paymentMethod === 'card' ? 'Pay with Card' : 'Reserve with Cash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
