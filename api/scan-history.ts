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

  if (!profile) {
    return res.status(403).json({ error: "Not allowed" });
  }

  let query = admin
    .from("ticket_scans")
    .select("*, booking_tickets(ticket_holder_name, qr_token)")
    .order("scanned_at", { ascending: false })
    .limit(200);

  if (profile.user_type !== "admin") {
    query = query.eq("scanned_by_profile_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: "Failed to load scan history" });
  }
  return res.status(200).json({ rows: data || [] });
}

