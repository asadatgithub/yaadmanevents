import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }
  const admin = createClient(supabaseUrl, serviceKey);

  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  const bookingId = typeof req.query.booking_id === "string" ? req.query.booking_id : "";

  if (!sessionId && !bookingId) {
    return res.status(400).json({ error: "session_id or booking_id required" });
  }

  let bookingQuery = admin.from("bookings").select("*").limit(1);
  bookingQuery = sessionId
    ? bookingQuery.eq("stripe_checkout_session_id", sessionId)
    : bookingQuery.eq("id", bookingId);
  const { data: bookings, error } = await bookingQuery;
  if (error || !bookings || bookings.length === 0) {
    return res.status(404).json({ error: "Booking not found" });
  }
  const booking = bookings[0];
  const { data: tickets } = await admin
    .from("booking_tickets")
    .select("*")
    .eq("booking_id", booking.id)
    .order("ticket_index", { ascending: true });

  return res.status(200).json({
    booking,
    tickets: tickets || [],
  });
}

