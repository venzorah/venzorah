# Venzorah

UK-first multi-vendor marketplace for African products (food, fashion, beauty, art, homewares and more). The app is a mobile-first installable PWA with Admin, Customer and Vendor dashboards backed by Prisma.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM (SQLite locally, PostgreSQL in production)
- Session cookies, bcrypt password hashing, RBAC
- Stripe-ready webhooks; sandbox payments by default

## Brand

Official tokens live in `src/app/globals.css`:

- Navy `#002168`
- Gold `#F7B506`
- Surface `#F5F7FB`
- Deep navy `#00133D`
- Gold hover `#D99D00`

PWA `theme_color` is `#002168` and `background_color` is `#FFFFFF`. The square mark is the favicon/app icon; the shopping wordmark is the marketing logo.

## Local setup

```bash
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Open http://localhost:3000

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@venzorah.com | VenzorahAdmin!23 |
| Customer | customer@venzorah.com | VenzorahCustomer!23 |
| Vendor (free) | vendor@venzorah.com | VenzorahVendor!23 |
| Vendor (monthly) | vendor2@venzorah.com | VenzorahVendor!23 |

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production
- `npm test` — unit tests
- `npx prisma db seed` — roles, categories, plans, demo catalogue
- `POST /api/cron/jobs` — reminders, expiry/downgrade, settlement release (`x-cron-secret`)

## Production notes

1. Set `DATABASE_URL` to PostgreSQL and change `provider` in `prisma/schema.prisma` to `postgresql`, then `npx prisma migrate dev`.
2. Configure Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) for live/test-card checkout and vendor subscription invoices. Until then, checkout uses an explicit sandbox confirmation — a browser redirect is never treated as payment proof.
3. Configure SMTP for real email. Without it, messages are logged and recorded in `NotificationDelivery`.
4. Store KYC files in private object storage and keep only references in the database.
5. Obtain legal review for UK VAT, recurring payments, KYC, marketplace operator duties, returns and vendor settlement. The seven-day settlement rule is **not** escrow unless your payment provider and contracts make it so.

## PWA limitations

- iOS Safari has no `beforeinstallprompt`; use Share → Add to Home Screen (`/install`).
- Web push requires a VAPID provider and user permission; in-app and email notifications are the fallback.
- The service worker caches the public shell only. Authenticated dashboards, checkout and APIs are never cached as success for money movement.

## Architecture

Business rules live in `src/lib/commerce.ts`, `src/lib/billing.ts` and `src/app/actions/*`. Dashboards call those server actions. Hiding a button is not authorisation — `requirePermission` runs on the server.
