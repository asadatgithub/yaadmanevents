import type { AdminBooking } from './types'

interface BookingsTabProps {
  bookings: AdminBooking[]
  getEventName: (eventId: string) => string
}

export default function BookingsTab({ bookings, getEventName }: BookingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-900">All Ticket Bookings</h2>
        <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
          {bookings.length} bookings
        </span>
      </div>
      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-3">🎫</div>
          <p className="text-gray-500 font-medium">No bookings yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                <tr>
                  <th className="px-5 py-3">Guest & Event</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Logistics</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{b.customer_name || 'Anonymous Guest'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{getEventName(b.event_id)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(b.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-700">{b.customer_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-gray-700">{(b.payment_method || 'card').toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{b.payment_status || b.status}</p>
                      <p className="text-xs text-gray-500">{b.ticket_quantity || 1} ticket(s)</p>
                    </td>
                    <td className="px-5 py-4">
                      {(b.pickup_time || b.return_time) ? (
                        <div className="text-xs font-medium text-jamaica-gold-dark bg-jamaica-gold/10 inline-block px-2.5 py-1.5 rounded-lg">
                          {b.pickup_time && <div>Pickup: {b.pickup_time}</div>}
                          {b.return_time && <div>Return: {b.return_time}</div>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        J${Number(b.total_amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

