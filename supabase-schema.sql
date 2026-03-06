-- =============================================
-- Yaadman Events - Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- 0. Helper: check admin status without triggering RLS on profiles
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );
$$ language sql security definer stable;

-- 1. Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can view profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

create policy "Allow insert during signup"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Events table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  date date not null,
  venue text not null,
  address_1 text,
  address_2 text,
  parish text,
  organizer_name text,
  banner_url text,
  qr_active boolean default null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Anyone can view events"
  on public.events for select
  using (true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own events"
  on public.events for delete
  using (auth.uid() = user_id);

create policy "Admins can insert events"
  on public.events for insert
  with check (public.is_admin());

create policy "Admins can update events"
  on public.events for update
  using (public.is_admin());

create policy "Admins can delete events"
  on public.events for delete
  using (public.is_admin());

-- 3. Supports table (promoter-to-promoter support tracking)
create table public.supports (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  supporter_event_id uuid references public.events(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

alter table public.supports enable row level security;

create policy "Authenticated users can insert supports"
  on public.supports for insert
  with check (auth.role() = 'authenticated');

create policy "Event owners can view their supports"
  on public.supports for select
  using (
    exists (
      select 1 from public.events
      where events.id = supports.event_id
      and events.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.events
      where events.id = supports.supporter_event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Admins can view all supports"
  on public.supports for select
  using (public.is_admin());

create policy "Admins can delete supports"
  on public.supports for delete
  using (public.is_admin());

-- MIGRATION: If upgrading from expenses to supports, run:
-- DROP TABLE IF EXISTS public.expenses;
-- Then create the supports table above.

-- 4. Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Storage bucket for event banners
insert into storage.buckets (id, name, public)
values ('event-banners', 'event-banners', true);

create policy "Anyone can view banners"
  on storage.objects for select
  using (bucket_id = 'event-banners');

create policy "Authenticated users can upload banners"
  on storage.objects for insert
  with check (bucket_id = 'event-banners' and auth.role() = 'authenticated');

create policy "Users can delete own banners"
  on storage.objects for delete
  using (bucket_id = 'event-banners' and auth.role() = 'authenticated');

-- 6. Seed admin account
-- NOTE: After running this schema, manually create the admin user
-- via Supabase Auth dashboard with email: admin@admin.com, password: admin123
-- Then run this to mark them as admin:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'admin@admin.com';
