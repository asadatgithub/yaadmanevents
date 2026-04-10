create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$ language sql security definer stable;

create or replace function public.is_scanner()
returns boolean as $$
  select false;
$$ language sql security definer stable;

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  is_admin boolean default false,
  user_type text not null default 'customer' check (user_type in ('admin', 'organizer', 'driver', 'club', 'customer')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Anyone can view profiles" on public.profiles;
create policy "Anyone can view profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

drop policy if exists "Allow insert during signup" on public.profiles;
create policy "Allow insert during signup"
  on public.profiles for insert
  with check (auth.uid() = id);

create table if not exists public.events (
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
  base_price numeric default null,
  booking_enabled boolean default false,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.events add column if not exists base_price numeric;
alter table public.events add column if not exists booking_enabled boolean default false;
alter table public.events add column if not exists description text;
alter table public.events add column if not exists pickup_times text[];
alter table public.events add column if not exists return_times text[];

alter table public.events enable row level security;

drop policy if exists "Anyone can view events" on public.events;
create policy "Anyone can view events"
  on public.events for select
  using (true);

drop policy if exists "Authenticated users can create events" on public.events;
create policy "Authenticated users can create events"
  on public.events for insert
  with check (public.is_admin() and auth.uid() = user_id);

drop policy if exists "Users can delete own events" on public.events;
create policy "Users can delete own events"
  on public.events for delete
  using (auth.uid() = user_id);

drop policy if exists "Admins can insert events" on public.events;
create policy "Admins can insert events"
  on public.events for insert
  with check (public.is_admin());

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update
  using (public.is_admin());

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete
  using (public.is_admin());

create table if not exists public.supports (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  supporter_event_id uuid references public.events(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

alter table public.supports enable row level security;

drop policy if exists "Authenticated users can insert supports" on public.supports;
create policy "Authenticated users can insert supports"
  on public.supports for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Event owners can view their supports" on public.supports;
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

drop policy if exists "Admins can view all supports" on public.supports;
create policy "Admins can view all supports"
  on public.supports for select
  using (public.is_admin());

drop policy if exists "Admins can delete supports" on public.supports;
create policy "Admins can delete supports"
  on public.supports for delete
  using (public.is_admin());

create table if not exists public.event_addons (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  price numeric not null check (price >= 0),
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.event_addons enable row level security;

drop policy if exists "Anyone can read active addons for bookable events" on public.event_addons;
create policy "Anyone can read active addons for bookable events"
  on public.event_addons for select
  using (
    active = true
    and exists (
      select 1 from public.events e
      where e.id = event_addons.event_id
      and e.booking_enabled = true
    )
  );

drop policy if exists "Admins can read all event addons" on public.event_addons;
create policy "Admins can read all event addons"
  on public.event_addons for select
  using (public.is_admin());

drop policy if exists "Admins can insert event addons" on public.event_addons;
create policy "Admins can insert event addons"
  on public.event_addons for insert
  with check (public.is_admin());

drop policy if exists "Event owners can insert event addons" on public.event_addons;
create policy "Event owners can insert event addons"
  on public.event_addons for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_addons.event_id
      and e.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can update event addons" on public.event_addons;
create policy "Admins can update event addons"
  on public.event_addons for update
  using (public.is_admin());

drop policy if exists "Event owners can update event addons" on public.event_addons;
create policy "Event owners can update event addons"
  on public.event_addons for update
  using (
    exists (
      select 1 from public.events e
      where e.id = event_addons.event_id
      and e.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can delete event addons" on public.event_addons;
create policy "Admins can delete event addons"
  on public.event_addons for delete
  using (public.is_admin());

drop policy if exists "Event owners can delete event addons" on public.event_addons;
create policy "Event owners can delete event addons"
  on public.event_addons for delete
  using (
    exists (
      select 1 from public.events e
      where e.id = event_addons.event_id
      and e.user_id = auth.uid()
    )
  );

create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  customer_email text not null,
  customer_name text,
  base_price_snapshot numeric not null,
  addons_snapshot jsonb default '[]'::jsonb,
  total_amount numeric not null,
  currency text not null default 'jmd',
  stripe_checkout_session_id text unique,
  status text not null default 'paid' check (status in ('pending', 'paid', 'cancelled', 'expired')),
  payment_method text not null default 'card' check (payment_method in ('card', 'cash')),
  payment_status text not null default 'paid' check (payment_status in ('pending_cash', 'paid', 'cancelled', 'expired')),
  ticket_quantity int not null default 1 check (ticket_quantity > 0),
  booking_reference text unique,
  pickup_time text,
  return_time text,
  created_at timestamptz default now()
);

alter table public.bookings add column if not exists pickup_time text;
alter table public.bookings add column if not exists return_time text;
alter table public.profiles add column if not exists user_type text;
alter table public.bookings add column if not exists payment_method text;
alter table public.bookings add column if not exists payment_status text;
alter table public.bookings add column if not exists ticket_quantity int;
alter table public.bookings add column if not exists booking_reference text;
alter table public.bookings add column if not exists cash_collected_at timestamptz;
alter table public.bookings add column if not exists cash_collected_by_profile_id uuid references public.profiles(id) on delete set null;
update public.profiles set user_type = 'admin' where is_admin = true and (user_type is null or user_type = '');
update public.profiles set user_type = 'customer' where user_type is null or user_type = '';
alter table public.profiles alter column user_type set default 'customer';
alter table public.profiles alter column user_type set not null;
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (is_admin = true or user_type = 'admin')
  );
$$ language sql security definer stable;

create or replace function public.is_scanner()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and user_type in ('driver', 'club')
  );
$$ language sql security definer stable;
update public.bookings set payment_method = 'card' where payment_method is null;
update public.bookings set payment_status = status where payment_status is null and status in ('paid', 'cancelled', 'expired');
update public.bookings set payment_status = 'pending_cash' where payment_status is null and status = 'pending';
update public.bookings set ticket_quantity = 1 where ticket_quantity is null or ticket_quantity < 1;
alter table public.bookings alter column payment_method set default 'card';
alter table public.bookings alter column payment_method set not null;
alter table public.bookings alter column payment_status set default 'paid';
alter table public.bookings alter column payment_status set not null;
alter table public.bookings alter column ticket_quantity set default 1;
alter table public.bookings alter column ticket_quantity set not null;
update public.bookings set booking_reference = concat('BKG-', upper(substr(replace(id::text, '-', ''), 1, 10))) where booking_reference is null;

create table if not exists public.booking_tickets (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  ticket_holder_name text not null,
  ticket_index int not null check (ticket_index > 0),
  qr_token text not null unique,
  qr_payload text not null,
  ticket_status text not null default 'issued' check (ticket_status in ('issued', 'scanned', 'cancelled')),
  scanned_at timestamptz,
  scanned_by_profile_id uuid references public.profiles(id) on delete set null,
  pickup_scanned_at timestamptz,
  pickup_scanned_by_profile_id uuid references public.profiles(id) on delete set null,
  club_scanned_at timestamptz,
  club_scanned_by_profile_id uuid references public.profiles(id) on delete set null,
  dropoff_scanned_at timestamptz,
  dropoff_scanned_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.booking_tickets add column if not exists pickup_scanned_at timestamptz;
alter table public.booking_tickets add column if not exists pickup_scanned_by_profile_id uuid references public.profiles(id) on delete set null;
alter table public.booking_tickets add column if not exists club_scanned_at timestamptz;
alter table public.booking_tickets add column if not exists club_scanned_by_profile_id uuid references public.profiles(id) on delete set null;
alter table public.booking_tickets add column if not exists dropoff_scanned_at timestamptz;
alter table public.booking_tickets add column if not exists dropoff_scanned_by_profile_id uuid references public.profiles(id) on delete set null;

create unique index if not exists booking_tickets_booking_id_ticket_index_idx
  on public.booking_tickets (booking_id, ticket_index);

create table if not exists public.ticket_scans (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.booking_tickets(id) on delete cascade not null,
  scanned_by_profile_id uuid references public.profiles(id) on delete set null,
  scanned_by_type text check (scanned_by_type in ('driver', 'club', 'admin', 'unknown')),
  scan_stage text check (scan_stage in ('pickup', 'club', 'dropoff')),
  scan_result text not null check (scan_result in ('accepted', 'already_scanned', 'invalid', 'inactive_event')),
  device_info text,
  scanned_at timestamptz default now()
);

alter table public.ticket_scans add column if not exists scan_stage text;

alter table public.booking_tickets enable row level security;
alter table public.ticket_scans enable row level security;

alter table public.bookings enable row level security;

drop policy if exists "Users can view own bookings" on public.bookings;
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

drop policy if exists "Event organizers can view bookings" on public.bookings;
create policy "Event organizers can view bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.events
      where events.id = bookings.event_id
      and events.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can view all bookings" on public.bookings;
create policy "Admins can view all bookings"
  on public.bookings for select
  using (public.is_admin());

drop policy if exists "Users can insert own cash bookings" on public.bookings;
create policy "Users can insert own cash bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can update all bookings" on public.bookings;
create policy "Admins can update all bookings"
  on public.bookings for update
  using (public.is_admin());

drop policy if exists "Users can view own booking tickets" on public.booking_tickets;
create policy "Users can view own booking tickets"
  on public.booking_tickets for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_tickets.booking_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists "Event organizers can view booking tickets" on public.booking_tickets;
create policy "Event organizers can view booking tickets"
  on public.booking_tickets for select
  using (
    exists (
      select 1 from public.events e
      where e.id = booking_tickets.event_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can view all booking tickets" on public.booking_tickets;
create policy "Admins can view all booking tickets"
  on public.booking_tickets for select
  using (public.is_admin());

drop policy if exists "Scanners can view booking tickets" on public.booking_tickets;
create policy "Scanners can view booking tickets"
  on public.booking_tickets for select
  using (public.is_scanner());

drop policy if exists "Scanners can update booking tickets scan fields" on public.booking_tickets;
create policy "Scanners can update booking tickets scan fields"
  on public.booking_tickets for update
  using (public.is_scanner() or public.is_admin());

drop policy if exists "Admins can insert booking tickets" on public.booking_tickets;
create policy "Admins can insert booking tickets"
  on public.booking_tickets for insert
  with check (public.is_admin());

drop policy if exists "Scanners can insert ticket scans" on public.ticket_scans;
create policy "Scanners can insert ticket scans"
  on public.ticket_scans for insert
  with check (public.is_scanner() or public.is_admin());

drop policy if exists "Scanners can view ticket scans" on public.ticket_scans;
create policy "Scanners can view ticket scans"
  on public.ticket_scans for select
  using (public.is_scanner() or public.is_admin());

drop policy if exists "Users can view own ticket scans" on public.ticket_scans;
create policy "Users can view own ticket scans"
  on public.ticket_scans for select
  using (
    exists (
      select 1 from public.booking_tickets bt
      join public.bookings b on b.id = bt.booking_id
      where bt.id = ticket_scans.ticket_id
        and b.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, user_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    case
      when (new.raw_user_meta_data->>'user_type') in ('admin', 'organizer', 'driver', 'club', 'customer')
        then (new.raw_user_meta_data->>'user_type')
      else 'customer'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('event-banners', 'event-banners', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view banners" on storage.objects;
create policy "Anyone can view banners"
  on storage.objects for select
  using (bucket_id = 'event-banners');

drop policy if exists "Authenticated users can upload banners" on storage.objects;
create policy "Authenticated users can upload banners"
  on storage.objects for insert
  with check (bucket_id = 'event-banners' and auth.role() = 'authenticated');

drop policy if exists "Users can delete own banners" on storage.objects;
create policy "Users can delete own banners"
  on storage.objects for delete
  using (bucket_id = 'event-banners' and auth.role() = 'authenticated');
