# Stripe and Vercel API

Set these in the Vercel project environment (and match `SUPABASE_*` with your Supabase project):

- `SUPABASE_URL` — same as `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` — same as `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — service role (server only; never in Vite)
- `STRIPE_SECRET_KEY` — from Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` — signing secret for endpoint `https://YOUR_DOMAIN/api/stripe-webhook`
- `APP_ORIGIN` — `https://YOUR_DOMAIN` (no trailing slash) so Checkout success/cancel URLs are correct

Local full stack: `npx vercel dev` from this folder so `/api/*` runs. For Vite alone, set `VITE_API_URL=http://localhost:3000` (or the port `vercel dev` prints) in `.env`.

Stripe Dashboard → Developers → Webhooks → add endpoint URL, select `checkout.session.completed`, copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Run the new SQL in Supabase (from `supabase-schema.sql`: `events` columns, `event_addons`, `bookings`, policies).
