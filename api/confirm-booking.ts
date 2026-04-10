import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  createBookingReference,
  insertBookingTickets,
  normalizePaymentMethod,
  parseTicketHolders,
} from "./_lib/booking";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!stripeKey || !supabaseUrl || !serviceKey || !anonKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const stripe = new Stripe(stripeKey);
  const admin = createClient(supabaseUrl, serviceKey);

  let body: { sessionId?: string };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const sessionId = body.sessionId;
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "sessionId is required" });
  }

  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  let requesterId: string | null = null;
  if (token) {
    const supabaseAuth = createClient(supabaseUrl, anonKey);
    const { data } = await supabaseAuth.auth.getUser(token);
    requesterId = data.user?.id || null;
  }

  const { data: existing } = await admin
    .from("bookings")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ ok: true, duplicate: true });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return res.status(404).json({ error: "Stripe session not found" });
  }

  const meta = session.metadata || {};
  const eventId = meta.event_id;
  const userId = meta.user_id || requesterId || null;
  const customerEmail = meta.customer_email || session.customer_email || "";
  const customerName = meta.customer_name || "";
  const basePrice = parseFloat(meta.base_price_snapshot || "0");
  const totalAmount = parseFloat(meta.total_amount || "0");
  const currency = (meta.currency || "jmd").toLowerCase();
  const quantity = Math.max(1, Number(meta.ticket_quantity || "1"));
  const paymentMethod = normalizePaymentMethod(meta.payment_method);
  let ticketHoldersRaw: unknown = [];
  try {
    ticketHoldersRaw = meta.ticket_holders ? JSON.parse(meta.ticket_holders) : [];
  } catch {
    ticketHoldersRaw = [];
  }
  const ticketHolders = parseTicketHolders(ticketHoldersRaw);
  const pickupTime = meta.pickup_time || null;
  const returnTime = meta.return_time || null;

  let addonsSnapshot: unknown = [];
  try {
    addonsSnapshot = meta.addons_snapshot ? JSON.parse(meta.addons_snapshot) : [];
  } catch {
    addonsSnapshot = [];
  }

  if (!eventId || !customerEmail || Number.isNaN(totalAmount)) {
    return res.status(400).json({ error: "Invalid checkout metadata" });
  }
  if (ticketHolders.length !== quantity) {
    return res.status(400).json({ error: "Invalid ticket holder metadata" });
  }

  const paid =
    session.payment_status === "paid" ||
    (session.status === "complete" && session.mode === "payment");
  if (!paid) {
    return res.status(400).json({ error: "Session is not paid" });
  }

  const bookingReference = createBookingReference();
  const { data: bookingData, error: insertError } = await admin
    .from("bookings")
    .insert({
    event_id: eventId,
    user_id: userId,
    customer_email: customerEmail,
    customer_name: customerName || null,
    base_price_snapshot: basePrice,
    addons_snapshot: addonsSnapshot,
    total_amount: totalAmount,
    currency,
    stripe_checkout_session_id: session.id,
    status: "paid",
    payment_method: paymentMethod,
    payment_status: "paid",
    ticket_quantity: quantity,
    booking_reference: bookingReference,
    pickup_time: pickupTime,
    return_time: returnTime,
    })
    .select("id")
    .single();

  if (insertError || !bookingData?.id) {
    return res.status(500).json({ error: "Failed to insert booking" });
  }

  const { data: event } = await admin
    .from("events")
    .select("name, date, venue")
    .eq("id", eventId)
    .single();

  let refererOrigin = "";
  if (req.headers.referer) {
    try {
      refererOrigin = new URL(req.headers.referer as string).origin;
    } catch {
      refererOrigin = "";
    }
  }
  const appOrigin =
    process.env.APP_ORIGIN ||
    (req.headers.origin as string) ||
    refererOrigin ||
    "";
  const tickets = await insertBookingTickets(admin, {
    bookingId: bookingData.id,
    eventId,
    ticketHolders,
    appOrigin,
  });

  try {
    const { sendBookingConfirmationEmail } = await import("./_lib/mailer");
    await sendBookingConfirmationEmail({
      to: customerEmail,
      bookingReference,
      eventName: event?.name || "Event",
      eventDate: event?.date || null,
      venue: event?.venue || null,
      paymentMethod,
      paymentStatus: "paid",
      totalAmount,
      ticketRows: tickets,
    });
  } catch (emailErr) {
    console.error("Confirm booking email send failed:", emailErr);
  }

  return res.status(200).json({ ok: true });
}
