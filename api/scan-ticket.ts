import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: authData } = await authClient.auth.getUser(token);
  const userId = authData.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await admin
    .from("profiles")
    .select("id, user_type")
    .eq("id", userId)
    .single();
  if (!profile || !["driver", "club", "admin"].includes(profile.user_type)) {
    return res.status(403).json({ error: "Not allowed" });
  }

  let body: { token?: string; deviceInfo?: string; collectCash?: boolean };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  const tokenValue = String(body.token || "").trim();
  let qrToken = tokenValue;
  if (tokenValue.startsWith("http://") || tokenValue.startsWith("https://")) {
    try {
      const parsed = new URL(tokenValue);
      qrToken = parsed.searchParams.get("token") || "";
    } catch {
      qrToken = tokenValue;
    }
  }
  if (!qrToken) {
    return res.status(400).json({ error: "Token required" });
  }

  const { data: ticket } = await admin
    .from("booking_tickets")
    .select("*, bookings!inner(id, payment_method, payment_status, booking_reference, customer_name)")
    .eq("qr_token", qrToken)
    .single();
  if (!ticket) {
    return res.status(404).json({ ok: false, scanResult: "invalid" });
  }

  const nowIso = new Date().toISOString();
  let scanResult: "accepted" | "already_scanned" = "accepted";
  let scanStage: "pickup" | "club" | "dropoff" | null = null;
  const isDriver = profile.user_type === "driver" || profile.user_type === "admin";
  const isClub = profile.user_type === "club";

  if (!ticket.pickup_scanned_at && isDriver) {
    scanStage = "pickup";
  } else if (ticket.pickup_scanned_at && !ticket.dropoff_scanned_at && isDriver) {
    scanStage = "dropoff";
  } else if (ticket.pickup_scanned_at && !ticket.club_scanned_at && isClub && !ticket.dropoff_scanned_at) {
    scanStage = "club";
  } else {
    scanResult = "already_scanned";
  }

  if (scanResult === "accepted" && scanStage) {
    const updates: Record<string, unknown> = {
      scanned_at: nowIso,
      scanned_by_profile_id: userId,
    };
    if (scanStage === "pickup") {
      updates.pickup_scanned_at = nowIso;
      updates.pickup_scanned_by_profile_id = userId;
    }
    if (scanStage === "club") {
      updates.club_scanned_at = nowIso;
      updates.club_scanned_by_profile_id = userId;
    }
    if (scanStage === "dropoff") {
      updates.dropoff_scanned_at = nowIso;
      updates.dropoff_scanned_by_profile_id = userId;
      updates.ticket_status = "scanned";
    }
    await admin
      .from("booking_tickets")
      .update(updates)
      .eq("id", ticket.id);
  }

  if (
    scanResult === "accepted" &&
    scanStage === "pickup" &&
    body.collectCash === true &&
    ticket.bookings.payment_method === "cash"
  ) {
    await admin
      .from("bookings")
      .update({
        payment_status: "paid",
        status: "paid",
        cash_collected_at: nowIso,
        cash_collected_by_profile_id: userId,
      })
      .eq("id", ticket.bookings.id);
  }

  await admin.from("ticket_scans").insert({
    ticket_id: ticket.id,
    scanned_by_profile_id: userId,
    scanned_by_type: profile.user_type,
    scan_stage: scanStage,
    scan_result: scanResult,
    device_info: body.deviceInfo || null,
  });

  return res.status(200).json({
    ok: scanResult === "accepted",
    scanResult,
    scanStage,
    ticket: {
      id: ticket.id,
      ticketHolderName: ticket.ticket_holder_name,
      bookingReference: ticket.bookings.booking_reference,
      paymentMethod: ticket.bookings.payment_method,
      paymentStatus: ticket.bookings.payment_status,
      customerName: ticket.bookings.customer_name,
    },
  });
}

