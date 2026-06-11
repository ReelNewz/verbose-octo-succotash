## Album Purchase & Download — "Album of My Life" by Lady Outlaw

Add a paid album page where visitors buy via Stripe Checkout (using your own Stripe key), then receive a one-time, expiring download link both on-screen and by email. Admins upload/replace the album ZIP from the dashboard.

### What you'll get

- **Public album page** (`/album`) — cover art, title, artist, price, "Buy & Download" button, track list (optional, from filename), short description.
- **Stripe Checkout** (one-time payment) — collects email, redirects to a thank-you page.
- **Thank-you page** (`/album/thank-you?session_id=...`) — verifies purchase server-side, shows the download button (signed link valid 24 h, max 5 downloads).
- **Email** — automatic confirmation with the same signed download link, sent via Lovable Emails.
- **Admin album manager** (`/admin/album`) — set title, artist, price, description, upload cover image + ZIP file. Single-album record.

### Data model (new migration)

- `album` table (single row enforced): `title`, `artist`, `description`, `price_cents`, `currency`, `cover_path`, `zip_path`, `zip_size_bytes`, `active`. RLS: anyone can read active row; only admins can update.
- `album_purchases` table: `stripe_session_id` (unique), `stripe_payment_intent_id`, `email`, `amount_cents`, `status` (`pending`|`paid`|`refunded`), `download_token` (uuid), `token_expires_at`, `download_count`, `max_downloads` (default 5). RLS: service-role only (token lookup happens through edge function).
- Reuse existing private bucket `resource-files` with a new prefix `album/` for cover + ZIP.

### Edge functions

1. `create-album-checkout` (public) — reads album row, creates Stripe Checkout Session (mode=`payment`), inserts pending purchase, returns `{ url }`.
2. `stripe-album-webhook` (public, no JWT, raw body) — verifies signature, on `checkout.session.completed` marks purchase `paid`, generates `download_token`, and invokes `send-transactional-email` with the album link.
3. `album-download` (public) — accepts `?token=...`, validates token + expiry + count, increments `download_count`, returns a short-lived signed Storage URL (redirect) for the ZIP.
4. `verify-album-session` (public) — used by thank-you page with `session_id` to fetch token + download URL after Stripe redirect.

### Frontend

- `src/pages/Album.tsx` — marketing page + buy button (calls `create-album-checkout`, redirects to Stripe).
- `src/pages/AlbumThankYou.tsx` — calls `verify-album-session`, shows download button.
- `src/pages/admin/AlbumAdmin.tsx` — form + file inputs; uploads to `resource-files/album/...` via Supabase client, saves row.
- Route additions in `App.tsx`. Nav link to `/album` in main header.

### Email

- New template `album-purchase-confirmation.tsx` in `_shared/transactional-email-templates/` with album title, artist, price, download button, expiry notice. Registered in `registry.ts`. Triggered from the webhook with idempotency key `album-purchase-<session_id>`.
- Requires the email domain to be verified to actually deliver — your `notify.reelnewzpress.com` DNS still needs to pass. Setup will work either way; emails queue and send once DNS is green.

### Secrets needed

- `STRIPE_SECRET_KEY` — your Stripe secret key (test or live).
- `STRIPE_WEBHOOK_SECRET` — created after we register the webhook URL in your Stripe dashboard.

I'll request these via the secure secrets form after you approve the plan, and give you the exact webhook URL to paste into Stripe.

### Out of scope

- PayPal, subscriptions, multiple albums, per-track sales, refunds UI, streaming previews. Easy to add later.

Approve and I'll build it.