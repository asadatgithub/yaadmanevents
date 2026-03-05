import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'

interface Profile {
  id: string
  name: string
  email: string
  is_admin: boolean
  created_at: string
}

interface Event {
  id: string
  name: string
  date: string
  venue: string
  organizer_name: string
  banner_url: string | null
  user_id: string
  created_at: string
}

interface Expense {
  id: string
  event_id: string
  amount: number
  created_at: string
}

type Tab = 'overview' | 'users' | 'events' | 'expenses'

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [qrEventId, setQrEventId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [profilesRes, eventsRes, expensesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      setProfiles(profilesRes.data || [])
      setEvents(eventsRes.data || [])
      setExpenses(expensesRes.data || [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const handleAdminSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user and all their events?')) return
    await supabase.from('profiles').delete().eq('id', id)
    setProfiles((p) => p.filter((u) => u.id !== id))
    setEvents((e) => e.filter((ev) => ev.user_id !== id))
    showToast('User deleted')
  }

  const updateUser = async () => {
    if (!editingUser) return
    await supabase.from('profiles').update({
      name: editingUser.name,
      email: editingUser.email,
    }).eq('id', editingUser.id)
    setProfiles((p) => p.map((u) => u.id === editingUser.id ? editingUser : u))
    setEditingUser(null)
    showToast('User updated')
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    setEvents((e) => e.filter((ev) => ev.id !== id))
    showToast('Event deleted')
  }

  const updateEvent = async () => {
    if (!editingEvent) return
    await supabase.from('events').update({
      name: editingEvent.name,
      date: editingEvent.date,
      venue: editingEvent.venue,
      organizer_name: editingEvent.organizer_name,
    }).eq('id', editingEvent.id)
    setEvents((e) => e.map((ev) => ev.id === editingEvent.id ? editingEvent : ev))
    setEditingEvent(null)
    showToast('Event updated')
  }

  const copyQrImage = async () => {
    if (!qrRef.current) return
    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          showToast('QR code copied to clipboard!')
        } catch {
          downloadQr()
        }
      }
    })
  }

  const downloadQr = () => {
    if (!qrRef.current) return
    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `qr-event-${qrEventId}.png`
    link.href = url
    link.click()
    showToast('QR code downloaded!')
  }

  const getEventExpenses = (eventId: string) => expenses.filter((e) => e.event_id === eventId)
  const getEventTotal = (eventId: string) => getEventExpenses(eventId).reduce((sum, e) => sum + Number(e.amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const nonAdminUsers = profiles.filter((p) => !p.is_admin)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview', label: 'Overview',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    },
    {
      id: 'events', label: 'Events',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      id: 'users', label: 'Users',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>,
    },
    {
      id: 'expenses', label: 'Expenses',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-jamaica-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-jamaica-black text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_0.2s_ease-out]">
          {toastMsg}
        </div>
      )}

      <div className="bg-jamaica-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm mt-0.5">Manage your platform</p>
            </div>
            <button
              onClick={handleAdminSignOut}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 justify-center ${
                tab === t.id
                  ? 'bg-jamaica-green text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-jamaica-green/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-jamaica-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{events.length}</p>
                <p className="text-sm text-gray-500 mt-0.5">Total Events</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{nonAdminUsers.length}</p>
                <p className="text-sm text-gray-500 mt-0.5">Organizers</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-jamaica-gold/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-jamaica-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{expenses.length}</p>
                <p className="text-sm text-gray-500 mt-0.5">Expenses</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">${totalExpenses.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-0.5">Total Spent</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">Recent Events</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {events.slice(0, 5).map((ev) => (
                    <div key={ev.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                        <p className="text-xs text-gray-500">{ev.venue} &middot; {ev.date}</p>
                      </div>
                      <button
                        onClick={() => setQrEventId(ev.id)}
                        className="text-xs text-jamaica-gold-dark bg-jamaica-gold/10 px-2.5 py-1 rounded-md font-medium hover:bg-jamaica-gold/20 transition-colors shrink-0 ml-3"
                      >
                        QR
                      </button>
                    </div>
                  ))}
                  {events.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No events yet</div>}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">Recent Organizers</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {nonAdminUsers.slice(0, 5).map((u) => (
                    <div key={u.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-jamaica-green/10 rounded-full flex items-center justify-center text-sm font-bold text-jamaica-green shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0 ml-3">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {nonAdminUsers.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No organizers yet</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">{profiles.length} Users</h2>
            </div>
            {profiles.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-jamaica-green/10 rounded-full flex items-center justify-center text-sm font-bold text-jamaica-green shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      {p.is_admin && (
                        <span className="bg-jamaica-gold/15 text-jamaica-gold-dark px-2 py-0.5 rounded text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{p.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Joined {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingUser(p)}
                      className="p-2 text-gray-400 hover:text-jamaica-green hover:bg-jamaica-green/5 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {!p.is_admin && (
                      <button
                        onClick={() => deleteUser(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">{events.length} Events</h2>
            </div>
            {events.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400">No events yet</p>
              </div>
            )}
            {events.map((ev) => (
              <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {ev.banner_url ? (
                    <img src={ev.banner_url} alt={ev.name} className="w-full sm:w-32 h-32 sm:h-auto object-cover" />
                  ) : (
                    <div className="w-full sm:w-32 h-24 sm:h-auto bg-gradient-to-br from-jamaica-green/10 to-jamaica-gold/10 flex items-center justify-center">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{ev.name}</h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {ev.venue}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {ev.organizer_name}
                          </span>
                        </div>
                        {getEventExpenses(ev.id).length > 0 && (
                          <p className="text-xs text-jamaica-green font-medium mt-2">
                            {getEventExpenses(ev.id).length} expenses &middot; ${getEventTotal(ev.id).toFixed(2)} total
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => setEditingEvent(ev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-jamaica-green bg-jamaica-green/5 hover:bg-jamaica-green/10 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setQrEventId(ev.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-jamaica-gold-dark bg-jamaica-gold/10 hover:bg-jamaica-gold/20 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        QR Code
                      </button>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Expenses by Event</h2>
              <span className="text-sm font-semibold text-jamaica-green bg-jamaica-green/10 px-3 py-1 rounded-lg">
                Total: ${totalExpenses.toFixed(2)}
              </span>
            </div>
            {events.map((ev) => {
              const evExpenses = getEventExpenses(ev.id)
              if (evExpenses.length === 0) return null
              return (
                <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{ev.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{ev.venue} &middot; {ev.date}</p>
                    </div>
                    <span className="bg-jamaica-green/10 text-jamaica-green px-3 py-1 rounded-lg text-sm font-semibold shrink-0 ml-3">
                      ${getEventTotal(ev.id).toFixed(2)}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {evExpenses.map((exp) => (
                      <div key={exp.id} className="px-5 py-3 flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">${Number(exp.amount).toFixed(2)}</span>
                        <span className="text-xs text-gray-400">{new Date(exp.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {events.every((ev) => getEventExpenses(ev.id).length === 0) && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-gray-500 font-medium">No expenses recorded yet</p>
                <p className="text-sm text-gray-400 mt-1">Expenses will appear here once users scan QR codes and submit amounts.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={updateUser}
                  className="flex-1 bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingEvent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editingEvent.name}
                  onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={editingEvent.date}
                  onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue</label>
                <input
                  type="text"
                  value={editingEvent.venue}
                  onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organizer</label>
                <input
                  type="text"
                  value={editingEvent.organizer_name}
                  onChange={(e) => setEditingEvent({ ...editingEvent, organizer_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={updateEvent}
                  className="flex-1 bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {qrEventId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrEventId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Event QR Code</h2>
              <button onClick={() => setQrEventId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4 break-all bg-gray-50 px-3 py-2 rounded-lg font-mono">
              {BASE_URL}/event/{qrEventId}?scan=1
            </p>
            <div ref={qrRef} className="flex justify-center mb-6 bg-white p-4 rounded-xl">
              <QRCodeCanvas
                value={`${BASE_URL}/event/${qrEventId}?scan=1`}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyQrImage}
                className="bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Copy Image
              </button>
              <button
                onClick={downloadQr}
                className="bg-jamaica-gold hover:bg-jamaica-gold-dark text-jamaica-black font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
