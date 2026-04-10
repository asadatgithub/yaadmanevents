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
  const requesterId = authData.user?.id;
  if (!requesterId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: requesterProfile } = await admin
    .from("profiles")
    .select("is_admin, user_type")
    .eq("id", requesterId)
    .single();
  const canCreate = requesterProfile?.is_admin || requesterProfile?.user_type === "admin";
  if (!canCreate) {
    return res.status(403).json({ error: "Forbidden" });
  }

  let body: { name?: string; email?: string; password?: string; userType?: string };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const userType = body.userType === "club" ? "club" : "driver";
  if (!name || !email || password.length < 6) {
    return res.status(400).json({ error: "Invalid user data" });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, user_type: userType },
  });
  if (createErr || !created.user) {
    return res.status(500).json({ error: createErr?.message || "Failed to create user" });
  }

  await admin
    .from("profiles")
    .update({ name, email, user_type: userType, is_admin: false })
    .eq("id", created.user.id);

  return res.status(200).json({ ok: true, id: created.user.id });
}

