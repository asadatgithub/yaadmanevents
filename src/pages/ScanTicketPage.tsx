import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ScannedTicketDetails {
  id: string
  ticketHolderName: string
  bookingReference: string
  paymentMethod: string
  paymentStatus: string
  customerName: string
}

export default function ScanTicketPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState('Processing scan...')
  const [stage, setStage] = useState('')
  const [details, setDetails] = useState<ScannedTicketDetails | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('Invalid scan token.')
      return
    }
    let cancelled = false
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const bearer = session?.access_token
      if (!bearer) {
        if (!cancelled) setStatus('Please login with a driver/club account to scan.')
        return
      }
      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/scan-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({ token }),
      })
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) {
        setStatus(typeof body.error === 'string' ? body.error : 'Scan failed')
        return
      }
      setDetails((body.ticket || null) as ScannedTicketDetails | null)
      setStage(String(body.scanStage || ''))
      if (body.scanResult === 'accepted') {
        setStatus(`Scan accepted (${String(body.scanStage || '')})`)
      } else {
        setStatus('Already scanned or out of expected stage')
      }
    }
    run()
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Ticket Scan</h1>
        <p className="text-sm text-gray-600 mt-3">{status}</p>
        {details && (
          <div className="mt-5 text-left bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5">
            <p className="text-xs text-gray-500">Ticket Holder</p>
            <p className="text-sm font-bold text-gray-900">{details.ticketHolderName || 'Unknown'}</p>
            <p className="text-xs text-gray-500 mt-2">Booking Ref</p>
            <p className="text-sm font-semibold text-gray-900">{details.bookingReference || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-2">Booked By</p>
            <p className="text-sm text-gray-900">{details.customerName || 'Unknown'}</p>
            <p className="text-xs text-gray-500 mt-2">Payment</p>
            <p className="text-sm text-gray-900">{details.paymentMethod?.toUpperCase()} - {details.paymentStatus}</p>
            {stage && (
              <>
                <p className="text-xs text-gray-500 mt-2">Scan Stage</p>
                <p className="text-sm font-semibold text-jamaica-green capitalize">{stage}</p>
              </>
            )}
          </div>
        )}
        <Link to="/scanner" className="inline-block mt-6 text-jamaica-green font-semibold hover:underline">
          Open Scanner Dashboard
        </Link>
      </div>
    </div>
  )
}

