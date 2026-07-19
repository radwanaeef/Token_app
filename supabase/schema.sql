-- =====================================================================
-- CLINIC TOKEN BOOKING — full Supabase schema
-- Run this once in the Supabase SQL editor.
-- =====================================================================

-- ---------- TABLES ----------

create table system_settings (
  id int primary key default 1,
  booking_date date not null default current_date,
  is_booking_open boolean not null default false,
  booking_open_time time not null default '07:00',
  max_tokens int not null default 25,
  consult_start time not null default '15:00',
  consult_end time not null default '20:00',
  current_token int not null default 0,
  constraint single_row check (id = 1)
);
insert into system_settings (id) values (1);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_date date not null default current_date,
  token_number int not null,
  patient_name text not null,
  phone_number text not null,
  status text not null default 'waiting',
  estimated_time time,
  created_at timestamptz not null default now(),
  unique (booking_date, phone_number),
  unique (booking_date, token_number)
);
create index idx_bookings_date on bookings(booking_date);

create table blacklist (
  phone_number text primary key,
  reason text,
  blocked_at timestamptz not null default now()
);

-- ---------- PUBLIC-SAFE VIEW (home page reads this, never the raw tables) ----------

create view public_status as
select
  s.is_booking_open,
  s.max_tokens,
  s.current_token,
  s.consult_start,
  s.consult_end,
  (select count(*) from bookings b where b.booking_date = s.booking_date) as booked_count
from system_settings s
where s.id = 1;

-- ---------- FUNCTIONS ----------

-- Atomic booking: locks the settings row so concurrent requests can't
-- both land on the same token number or exceed max_tokens.
create or replace function book_token(p_name text, p_phone text)
returns table(token_number int, estimated_time time) as $$
declare
  v_settings system_settings%rowtype;
  v_count int;
  v_token int;
  v_est time;
begin
  select * into v_settings from system_settings where id = 1 for update;

  if not v_settings.is_booking_open then
    raise exception 'BOOKING_CLOSED';
  end if;

  if exists (select 1 from blacklist where phone_number = p_phone) then
    raise exception 'BLOCKED';
  end if;

  if exists (
    select 1 from bookings
    where booking_date = v_settings.booking_date and phone_number = p_phone
  ) then
    raise exception 'ALREADY_BOOKED';
  end if;

  select count(*) into v_count from bookings where booking_date = v_settings.booking_date;
  if v_count >= v_settings.max_tokens then
    raise exception 'FULLY_BOOKED';
  end if;

  v_token := v_count + 1;
  v_est := v_settings.consult_start
    + ((v_settings.consult_end - v_settings.consult_start) / v_settings.max_tokens) * (v_token - 1);

  insert into bookings (booking_date, token_number, patient_name, phone_number, estimated_time)
  values (v_settings.booking_date, v_token, trim(p_name), trim(p_phone), v_est);

  return query select v_token, v_est;
end;
$$ language plpgsql security definer;

-- Admin "Next Patient" button
create or replace function increment_token()
returns void as $$
begin
  update system_settings set current_token = current_token + 1 where id = 1;
end;
$$ language plpgsql security definer;

-- Daily reset — pair with a pg_cron schedule below
create or replace function reset_day()
returns void as $$
begin
  update system_settings
  set booking_date = current_date,
      is_booking_open = true,
      current_token = 0
  where id = 1;
end;
$$ language plpgsql security definer;

-- ---------- ROW LEVEL SECURITY ----------

alter table system_settings enable row level security;
alter table bookings enable row level security;
alter table blacklist enable row level security;

-- system_settings: public read, authenticated (admin) write
create policy "settings readable by all" on system_settings for select using (true);
create policy "settings writable by admin" on system_settings for update using (auth.role() = 'authenticated');

-- bookings: no direct public select/insert — booking goes through book_token(),
-- reading the list is admin-only. (public_status view above covers the public case.)
create policy "bookings readable by admin" on bookings for select using (auth.role() = 'authenticated');
create policy "bookings insert via function only" on bookings for insert with check (false);

-- blacklist: admin only, no public access at all
create policy "blacklist admin only" on blacklist for all using (auth.role() = 'authenticated');

-- ---------- OPTIONAL: automate 7 AM daily open via pg_cron (Supabase free tier supports this) ----------
-- select cron.schedule('open-booking-daily', '0 7 * * *', $$select reset_day()$$);
