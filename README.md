# Sunrise Clinic — Token Booking PWA

Zero-cost, zero-OTP daily token booking system. Next.js 14 + Tailwind + Supabase.

## Setup

1. **Create a Supabase project** (free tier) at supabase.com.
2. In the SQL editor, run `supabase/schema.sql` in full.
3. Create one admin user under Authentication → Users (email + password) — this is the login for `/admin/login`.
4. Copy `.env.local.example` to `.env.local` and fill in your project URL + anon key (Settings → API).
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
6. Deploy free on **Vercel**: connect the repo, add the same two env vars in Vercel's dashboard, deploy.

## Daily automation (optional)

Enable the `pg_cron` extension in Supabase (Database → Extensions), then uncomment the last line
in `schema.sql` to auto-open booking and reset the counter at 7:00 AM daily. Otherwise, staff can
open the day manually from `/admin/dashboard`.

## Icons

Add `icon-192.png` and `icon-512.png` (clinic logo, square) to `/public` for the "Add to Home Screen" icon.

## Pages

| Route | Purpose |
|---|---|
| `/` | Live token tracker + booking CTA (public) |
| `/book` | Booking form: name + phone (public) |
| `/ticket/[token]` | Confirmation ticket + WhatsApp share (public) |
| `/admin/login` | Staff sign-in |
| `/admin/dashboard` | Open/close day, Next Patient, patient list, blacklist (protected) |

## Notes

- One token per phone number per day is enforced at the database level (`unique` constraint) and
  inside the `book_token()` function — not just in the UI — so it can't be bypassed by calling the API directly.
- The `book_token()` function locks the settings row (`for update`) so two simultaneous bookings
  can never receive the same token number or exceed `max_tokens`.
- Patient names/phone numbers are never exposed on the public pages — only `public_status` (an
  aggregate view) is publicly readable. The full list requires an authenticated admin session.
