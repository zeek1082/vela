# Vela

ACA subsidy optimization for pre-Medicare retirees. Vela models withdrawal sequencing across
Traditional IRA, Roth IRA, taxable brokerage, and HSA accounts to minimize MAGI and maximize
the ACA Premium Tax Credit.

> Retired before Medicare? You're probably overpaying for health insurance by $10,000 a year.

## Stack

- **React 19 + TypeScript + Vite** — single-page app, `wouter` for routing
- **Tailwind v4** + a trimmed set of shadcn/ui primitives
- **Vercel serverless function** (`api/lead.ts`) for lead capture
- **Neon Postgres** (optional) for lead storage

The optimization engine is pure TypeScript in `client/src/lib/optimizer.ts` and runs entirely
in the browser — no server round trip, no user data leaves the device unless they submit the
email gate.

## Layout

```
api/lead.ts              Lead capture endpoint (POST /api/lead)
client/index.html        App shell + meta tags
client/src/
  lib/optimizer.ts       MAGI + ACA subsidy engine, FPL tables, prescription builder
  lib/history.ts         Local (localStorage) run history
  lib/brand.ts           Logo URL — see "Remaining Manus dependency" below
  pages/Home.tsx         Landing page
  pages/Optimizer.tsx    4-step wizard: profile → accounts → optimize → results
  pages/History.tsx      Past runs on this device
  components/ResultsDashboard.tsx   Results + email gate
vercel.json              SPA rewrites, build config
```

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck
npm run build      # production build to dist/
```

`npm run dev` serves the SPA only. To exercise `api/lead.ts` locally, run `npx vercel dev`
instead.

## Lead capture

`POST /api/lead` accepts `{ email, profile, result, source }`.

Storage is optional by design so the site works before a database exists:

- **`DATABASE_URL` set** → the lead is upserted into a `leads` table (created on first write).
- **not set** → the lead is written to the Vercel function log and the request still returns
  200, so the results page unlocks either way.

To wire up storage: add a Neon Postgres database from the Vercel dashboard (Storage → Neon),
then set `DATABASE_URL` in project environment variables. No migration step needed.

## What was removed in the move off Manus

The prototype was scaffolded on Manus infrastructure. These pieces depended on services that
aren't ours and were cut rather than half-ported:

| Removed | Why | Path back |
|---|---|---|
| OAuth login | Authenticated against `api.manus.im` | Clerk or Auth.js |
| AI chat assistant | Called Manus's Forge LLM proxy with a Manus-issued key | Anthropic API + own key, rate limited |
| Server-side run history | Required auth + MySQL | Now `localStorage`; restore server-side when auth returns |
| tRPC + Express server | One remaining endpoint didn't justify it | — |
| Google Maps, voice transcription, image generation, S3 storage, push notifications | Manus template scaffolding Vela never used | — |
| `/dashboard` demo page | Depended on the chat + auth stack | Rebuild against real data |

### Remaining Manus dependency

The logo in `client/src/lib/brand.ts` still points at a Manus CloudFront URL. Drop the PNG into
`client/public/vela-logo.png` and change `LOGO_URL` to `/vela-logo.png` to cut the last cord.

## Next

- Plaid integration for real account balances
- Q4 Roth conversion optimizer
- Year-round MAGI monitoring with alerts
- Stripe billing ($150/yr Essential, $249/yr Pro)
