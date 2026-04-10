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
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "Stripe secret key not configured" });
  }
  const stripe = new Stripe(stripeKey);
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

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("Missing DB config:", { hasUrl: !!supabaseUrl, hasAnon: !!anonKey, hasService: !!serviceKey, serviceKeyLength: serviceKey?.length });
    return res.status(500).json({ error: "Server configuration error" });
  }

  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  let user = null;

  if (token) {
    const supabaseAuth = createClient(supabaseUrl, anonKey);
    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (!authErr && authData?.user) {
      user = authData.user;
    }
  }

  let body: {
    eventId?: string;
    addonIds?: string[];
    pickupTime?: string;
    returnTime?: string;
    guestName?: string;
    guestEmail?: string;
    quantity?: number;
    ticketHolders?: unknown;
    paymentMethod?: string;
  };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const eventId = body.eventId;
  const addonIds = Array.isArray(body.addonIds) ? body.addonIds : [];
  const pickupTime = body.pickupTime || "";
  const returnTime = body.returnTime || "";
  const guestName = body.guestName || "";
  const guestEmail = body.guestEmail || "";
  const paymentMethod = normalizePaymentMethod(body.paymentMethod);
  const quantity = Math.max(1, Number(body.quantity || 1));
  const ticketHolders = parseTicketHolders(body.ticketHolders);

  if (!eventId || typeof eventId !== "string") {
    return res.status(400).json({ error: "eventId required" });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: event, error: evErr } = await admin
    .from("events")
    .select("id, name, booking_enabled, base_price")
    .eq("id", eventId)
    .single();

  if (evErr || !event) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (!event.booking_enabled) {
    return res.status(400).json({ error: "Booking not available for this event" });
  }

  const base = Number(event.base_price);
  if (event.base_price == null || Number.isNaN(base) || base < 0) {
    return res.status(400).json({ error: "Invalid event price" });
  }

  let addons: { id: string; name: string; price: number }[] = [];
  if (addonIds.length > 0) {
    const { data: rows, error: adErr } = await admin
      .from("event_addons")
      .select("id, name, price")
      .eq("event_id", eventId)
      .eq("active", true)
      .in("id", addonIds);

    if (adErr || !rows || rows.length !== addonIds.length) {
      return res.status(400).json({ error: "Invalid add-on selection" });
    }
    addons = rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
    }));
  }

  let profile = null;
  if (user) {
    const { data } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const customerEmail = guestEmail || profile?.email || user?.email || "";
  const customerName = guestName || profile?.name || "";

  if (!customerEmail || !customerName) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  if (ticketHolders.length !== quantity) {
    return res.status(400).json({ error: "Each ticket must have a holder name" });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  lineItems.push({
    price_data: {
      currency: "jmd",
      product_data: { name: `${event.name} — Ticket` },
      unit_amount: Math.round(base * 100),
    },
    quantity,
  });

  for (const a of addons) {
    const cents = Math.round(Number(a.price) * 100);
    if (Number.isNaN(cents) || cents < 0) {
      return res.status(400).json({ error: "Invalid add-on price" });
    }
    lineItems.push({
      price_data: {
        currency: "jmd",
        product_data: { name: `${event.name} — ${a.name}` },
        unit_amount: cents,
      },
      quantity,
    });
  }

  const unitTotal = base + addons.reduce((s, a) => s + Number(a.price), 0);
  const total = unitTotal * quantity;

  let refererOrigin = "";
  if (req.headers.referer) {
    try {
      refererOrigin = new URL(req.headers.referer as string).origin;
    } catch {
      refererOrigin = "";
    }
  }
  const origin =
    process.env.APP_ORIGIN ||
    (req.headers.origin as string) ||
    refererOrigin ||
    "";

  if (!origin) {
    return res.status(500).json({ error: "APP_ORIGIN not configured" });
  }

  if (paymentMethod === "cash") {
    const bookingReference = createBookingReference();
    const { data: bookingRow, error: bookingError } = await admin
      .from("bookings")
      .insert({
        event_id: eventId,
        user_id: user?.id || null,
        customer_email: customerEmail,
        customer_name: customerName || null,
        base_price_snapshot: base,
        addons_snapshot: addons,
        total_amount: total,
        currency: "jmd",
        status: "pending",
        payment_method: "cash",
        payment_status: "pending_cash",
        ticket_quantity: quantity,
        booking_reference: bookingReference,
        pickup_time: pickupTime || null,
        return_time: returnTime || null,
      })
      .select("id")
      .single();

    if (bookingError || !bookingRow?.id) {
      return res.status(500).json({ error: "Failed to create cash booking" });
    }

    const ticketRows = await insertBookingTickets(admin, {
      bookingId: bookingRow.id,
      eventId,
      ticketHolders,
      appOrigin: origin,
    });

    try {
      const { sendBookingConfirmationEmail } = await import("./_lib/mailer");
      await sendBookingConfirmationEmail({
        to: customerEmail,
        bookingReference,
        eventName: event.name,
        paymentMethod: "cash",
        paymentStatus: "pending_cash",
        totalAmount: total,
        ticketRows,
      });
    } catch (emailErr) {
      console.error("Cash booking email send failed:", emailErr);
    }

    return res.status(200).json({
      cash: true,
      bookingId: bookingRow.id,
      bookingReference,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail || undefined,
    line_items: lineItems,
    success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/event/${eventId}/book`,
    metadata: {
      event_id: eventId,
      user_id: user?.id || "",
      customer_email: customerEmail,
      customer_name: customerName,
      base_price_snapshot: String(base),
      total_amount: String(total),
      currency: "jmd",
      ticket_quantity: String(quantity),
      payment_method: paymentMethod,
      ticket_holders: JSON.stringify(ticketHolders),
      addon_ids: JSON.stringify(addonIds),
      addons_snapshot: JSON.stringify(addons),
      pickup_time: pickupTime,
      return_time: returnTime,
    },
  });

  return res.status(200).json({ url: session.url });
}
