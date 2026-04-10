import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'

export default function BookingSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const bookingId = searchParams.get('booking_id')
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle')
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null)
  const [tickets, setTickets] = useState<Array<Record<string, unknown>>>([])
  const [bookingLoaded, setBookingLoaded] = useState(false)
  const addons = Array.isArray(booking?.addons_snapshot) ? booking?.addons_snapshot as Array<Record<string, unknown>> : []
  const ticketQty = Number(booking?.ticket_quantity || 1)
  const baseSnapshot = Number(booking?.base_price_snapshot || 0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function confirmBooking() {
      setSyncState('syncing')
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/confirm-booking`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId }),
      })
      if (cancelled) return
      setSyncState(res.ok ? 'synced' : 'failed')
    }

    confirmBooking()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId && !bookingId) return
    const apiBase = import.meta.env.VITE_API_URL || ''
    const query = sessionId ? `session_id=${encodeURIComponent(sessionId)}` : `booking_id=${encodeURIComponent(String(bookingId || ''))}`
    fetch(`${apiBase}/api/get-booking-details?${query}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking((data.booking || null) as Record<string, unknown> | null)
        setTickets((data.tickets || []) as Array<Record<string, unknown>>)
        setBookingLoaded(true)
      })
      .catch(() => {
        setBooking(null)
        setTickets([])
        setBookingLoaded(true)
      })
  }, [sessionId, bookingId])

  const waitingForSync = !!sessionId && syncState !== 'synced' && syncState !== 'failed'
  const waitingForBooking = !bookingLoaded
  const showBlockingLoader = waitingForSync || waitingForBooking

  if (showBlockingLoader) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm animate-pulse">
            <div className="h-6 w-44 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto mb-8" />
            <div className="space-y-3">
              <div className="h-16 bg-gray-100 rounded-xl" />
              <div className="h-24 bg-gray-100 rounded-xl" />
              <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
            <div className="mt-6 h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
          <div className="w-16 h-16 bg-jamaica-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-jamaica-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Booking confirmed</h2>
          <p className="text-gray-500 mb-6">
            Your booking is confirmed. Your ticket QR codes are below.
          </p>
          {sessionId && (
            <p className="text-xs text-gray-400 font-mono break-all mb-6">Ref: {sessionId}</p>
          )}
          {syncState === 'failed' && (
            <p className="text-xs text-amber-600 mb-6">Payment was successful but booking sync is delayed. Refresh your dashboard in a moment.</p>
          )}
          {booking && (
            <div className="mb-5 text-left bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Booking Reference</p>
              <p className="text-sm font-bold text-gray-900">{String(booking.booking_reference || 'N/A')}</p>
              <p className="text-xs text-gray-500 mt-2">Payment</p>
              <p className="text-sm font-semibold text-gray-900">
                {String(booking.payment_method || '').toUpperCase()} - {String(booking.payment_status || '')}
              </p>
              <div className="mt-3 space-y-1 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Base Ticket</span>
                  <span>J${baseSnapshot.toFixed(2)} x {ticketQty}</span>
                </div>
                {addons.map((addon, idx) => (
                  <div key={`${idx}`} className="flex justify-between">
                    <span>{String(addon.name || 'Add-on')}</span>
                    <span>J${Number(addon.price || 0).toFixed(2)} x {ticketQty}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>J${Number(booking.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          {tickets.length > 0 && (
            <div className="space-y-3 mb-6">
              {tickets.map((ticket) => (
                <div key={String(ticket.id)} className="border border-gray-100 rounded-xl p-3 text-left">
                  <p className="text-sm font-bold text-gray-900">{String(ticket.ticket_holder_name || 'Guest')}</p>
                  <p className="text-xs text-gray-500 mb-2">Ticket #{String(ticket.ticket_index || '')}</p>
                  <div className="flex justify-center py-2 bg-white rounded-lg">
                    <QRCodeCanvas value={String(ticket.qr_payload || '')} size={140} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-block bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Browse events
            </Link>
            <Link
              to="/dashboard"
              className="inline-block border border-jamaica-green text-jamaica-green font-semibold px-8 py-3 rounded-xl hover:bg-jamaica-green/5 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
