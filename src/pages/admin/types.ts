export interface AdminProfile {
  id: string
  name: string
  email: string
  is_admin: boolean
  user_type: 'admin' | 'organizer' | 'driver' | 'club' | 'customer'
  created_at: string
}

export interface AdminBooking {
  id: string
  event_id: string
  customer_name: string | null
  customer_email: string
  total_amount: number
  status: string
  payment_method: string
  payment_status: string
  ticket_quantity: number
  booking_reference: string | null
  pickup_time: string | null
  return_time: string | null
  created_at: string
}

