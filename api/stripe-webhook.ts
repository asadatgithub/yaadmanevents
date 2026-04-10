import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";
import {
  createBookingReference,
  insertBookingTickets,
  normalizePaymentMethod,
  parseTicketHolders,
} from "./_lib/booking";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "Stripe secret key not configured" });
  }
  const stripe = new Stripe(stripeKey);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!whSecret || !supabaseUrl || !serviceKey) {
    return res.status(500).send("Server configuration error");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).send("Missing stripe-signature");
  }

  let buf: Buffer;
  try {
    buf = await getRawBody(req);
  } catch {
    return res.status(400).send("Body read error");
  }

  let evt: Stripe.Event;
  try {
    evt = stripe.webhooks.constructEvent(buf, sig, whSecret);
  } catch {
    return res.status(400).send("Webhook signature verification failed");
  }

  if (evt.type === "checkout.session.completed") {
    const session = evt.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const meta = session.metadata || {};

    const eventId = meta.event_id;
    const userId = meta.user_id;
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
      addonsSnapshot = meta.addons_snapshot
        ? JSON.parse(meta.addons_snapshot)
        : [];
    } catch {
      addonsSnapshot = [];
    }

    if (!eventId || !customerEmail || Number.isNaN(totalAmount)) {
      return res.status(400).send("Invalid metadata");
    }
    if (ticketHolders.length !== quantity) {
      return res.status(400).send("Invalid ticket metadata");
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: existing } = await admin
      .from("bookings")
      .select("id")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const bookingReference = createBookingReference();
    const { data: insertedBooking, error: insertError } = await admin.from("bookings").insert({
      event_id: eventId,
      user_id: userId || null,
      customer_email: customerEmail,
      customer_name: customerName || null,
      base_price_snapshot: basePrice,
      addons_snapshot: addonsSnapshot,
      total_amount: totalAmount,
      currency,
      stripe_checkout_session_id: sessionId,
      status: "paid",
      payment_method: paymentMethod,
      payment_status: "paid",
      ticket_quantity: quantity,
      booking_reference: bookingReference,
      pickup_time: pickupTime,
      return_time: returnTime,
    }).select("id").single();

    if (insertError || !insertedBooking?.id) {
      console.error("Booking insert error:", insertError);
      return res.status(500).json({ error: "Failed to insert booking" });
    }

    const { data: event } = await admin
      .from("events")
      .select("name, date, venue")
      .eq("id", eventId)
      .single();
    const appOrigin = process.env.APP_ORIGIN || "";
    const ticketRows = await insertBookingTickets(admin, {
      bookingId: insertedBooking.id,
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
        ticketRows,
      });
    } catch (emailErr) {
      console.error("Webhook booking email send failed:", emailErr);
    }
  }

  return res.status(200).json({ received: true });
}
