import { Link, useNavigate } from 'react-router-dom'

interface EventCardProps {
  event: {
    id: string
    name: string
    date: string
    venue: string
    address_1?: string | null
    address_2?: string | null
    parish?: string | null
    organizer_name?: string | null
    banner_url: string | null
  }
}

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate()
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link to={`/event/${event.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-jamaica-green/5 hover:-translate-y-1.5">
        <div
          className="relative h-48 bg-gradient-to-br from-jamaica-green/20 to-jamaica-gold/20 overflow-hidden"
          onClick={event.banner_url ? (e) => { e.preventDefault(); e.stopPropagation(); window.open(event.banner_url!, '_blank'); } : undefined}
          role={event.banner_url ? 'button' : undefined}
          tabIndex={event.banner_url ? 0 : undefined}
          onKeyDown={event.banner_url ? (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); window.open(event.banner_url!, '_blank'); } } : undefined}
        >
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
              title="View full flyer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">🎵</span>
            </div>
          )}
          <div
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm z-10 cursor-pointer"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/event/${event.id}`) }}
          >
            {formattedDate}
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-jamaica-green transition-colors duration-200 truncate">
            {event.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{[event.venue, event.parish].filter(Boolean).join(', ')}</span>
          </div>
          {event.organizer_name && (
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate">{event.organizer_name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
