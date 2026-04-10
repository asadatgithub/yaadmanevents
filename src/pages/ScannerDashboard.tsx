import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface ScanRow {
  id: string
  scan_result: string
  scan_stage: 'pickup' | 'club' | 'dropoff' | null
  scanned_at: string
  booking_tickets: {
    ticket_holder_name: string
    qr_token: string
  } | null
}

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorInstance

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor
  }
}

export default function ScannerDashboard() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [collectCash, setCollectCash] = useState(false)
  const [history, setHistory] = useState<ScanRow[]>([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraSupported, setCameraSupported] = useState(true)
  const [cameraBusy, setCameraBusy] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanTimerRef = useRef<number | null>(null)
  const scanLockRef = useRef(false)

  const loadHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const bearer = session?.access_token
    if (!bearer) return
    const apiBase = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${apiBase}/api/scan-history`, {
      headers: { Authorization: `Bearer ${bearer}` },
    })
    const body = await res.json().catch(() => ({}))
    setHistory((body.rows || []) as ScanRow[])
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const normalizeTokenInput = (value: string) => {
    const text = value.trim()
    if (!text) return ''
    if (text.startsWith('http://') || text.startsWith('https://')) {
      try {
        const parsed = new URL(text)
        return parsed.searchParams.get('token') || ''
      } catch {
        return text
      }
    }
    return text
  }

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current)
      scanTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraOpen(false)
  }

  const handleScan = async (rawToken?: string) => {
    const normalized = normalizeTokenInput(rawToken ?? token)
    if (!normalized) return
    setLoading(true)
    setResult('')
    const { data: { session } } = await supabase.auth.getSession()
    const bearer = session?.access_token
    const apiBase = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${apiBase}/api/scan-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ token: normalized, collectCash }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setResult(typeof body.error === 'string' ? body.error : 'Scan failed')
    } else {
      if (body.scanResult === 'accepted') {
        const stage = String(body.scanStage || '')
        setResult(`Ticket accepted (${stage || 'scan'})`)
      } else {
        setResult('Ticket already scanned or out of order')
      }
    }
    setLoading(false)
    setToken('')
    setCollectCash(false)
    loadHistory()
  }

  const startCamera = async () => {
    if (!window.BarcodeDetector) {
      setCameraSupported(false)
      return
    }
    try {
      setCameraBusy(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || scanLockRef.current) return
        if (videoRef.current.readyState < 2) return
        scanLockRef.current = true
        try {
          const detected = await detector.detect(videoRef.current)
          const value = detected[0]?.rawValue
          const extracted = value ? normalizeTokenInput(value) : ''
          if (extracted) {
            setToken(extracted)
            await handleScan(extracted)
            stopCamera()
          }
        } catch {
        } finally {
          scanLockRef.current = false
        }
      }, 400)
    } catch {
      setResult('Unable to access camera')
      setCameraOpen(false)
    } finally {
      setCameraBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Scanner Dashboard</h1>
          <label className="block text-sm font-semibold text-gray-700 mb-2">QR Token</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green"
            placeholder="Paste ticket token"
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={collectCash}
              onChange={(e) => setCollectCash(e.target.checked)}
              className="rounded border-gray-300 text-jamaica-green focus:ring-jamaica-green"
            />
            Mark cash as collected on pickup scan
          </label>
          <button
            onClick={() => { void handleScan() }}
            disabled={loading}
            className="mt-3 w-full bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Scan Ticket'}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={startCamera}
              disabled={cameraBusy || cameraOpen}
              className="w-full bg-jamaica-black hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 text-sm"
            >
              {cameraBusy ? 'Opening...' : 'Scan With Camera'}
            </button>
            <button
              onClick={stopCamera}
              disabled={!cameraOpen}
              className="w-full border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl disabled:opacity-50 text-sm"
            >
              Stop Camera
            </button>
          </div>
          {!cameraSupported && (
            <p className="mt-2 text-xs text-red-600">This browser does not support camera QR detection. Use Chrome on mobile/desktop.</p>
          )}
          {cameraOpen && (
            <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
            </div>
          )}
          {result && <p className="mt-3 text-sm font-medium text-gray-700">{result}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Scan History</h2>
          <div className="space-y-2">
            {history.map((row) => (
              <div key={row.id} className="flex justify-between items-center border border-gray-100 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{row.booking_tickets?.ticket_holder_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{new Date(row.scanned_at).toLocaleString()}</p>
                  <p className="text-[11px] text-gray-500 capitalize">{row.scan_stage || 'unknown stage'}</p>
                </div>
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{row.scan_result}</span>
              </div>
            ))}
            {history.length === 0 && <p className="text-sm text-gray-500">No scans yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

