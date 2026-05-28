# ShaadiPlan — Indian Wedding Planning App

A Next.js 14 slice for Indian couples: multi-step intake, AI budget recommendations, persisted plans via API, and a budget tracker with payment logging.

## Features

- **4-step intake form** — wedding date, guests, city/venue, budget bracket (₹), top 2 priorities
- **AI recommendations** — `POST /api/recommend` calls Gemini with structured JSON output; optional SSE streaming with typing effect
- **Persisted plans** — Supabase Postgres; reload via `GET /api/recommendations/[id]` (no client-side Supabase)
- **Budget tracker** — per-category allocations, spent, balance; log payments via `POST /api/payments`

## Tech stack

- Next.js 14 (App Router)
- Supabase (Postgres)
- Gemini `gemini-flash-latest` (override with `GEMINI_MODEL`)
- Tailwind CSS + shadcn-style UI components
- Zod validation

## Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project
- [Google AI Studio](https://aistudio.google.com) API key

## Setup

1. **Clone and install**
  ```bash
   npm install
  ```
2. **Environment variables**
  Copy `.env.example` to `.env.local`:
   Use the **service role** key (Project Settings → API). It is server-only and never exposed to the browser.
3. **Database migration**
  In the Supabase SQL Editor, run:
   `[supabase/migrations/001_initial.sql](supabase/migrations/001_initial.sql)`
4. **Run locally**
  ```bash
   npm run dev
  ```
   Open [http://localhost:3000](http://localhost:3000).

## API routes


| Method | Path                        | Description                                                     |
| ------ | --------------------------- | --------------------------------------------------------------- |
| `POST` | `/api/recommend`            | Validate intake, call LLM, save to DB. Add `?stream=1` for SSE. |
| `GET`  | `/api/recommendations/[id]` | Return intake, recommendations, payments, budget summary        |
| `POST` | `/api/payments`             | Log a payment; returns updated `budget_summary`                 |


## Design decisions

1. **No client Supabase** — All DB access uses the service role in API routes. The frontend only talks to `/api/`*, which keeps keys safe and matches the assignment requirement.
2. **Budget brackets → numeric cap** — Couples pick human-readable brackets; the server maps them to `budget_inr` for consistent LLM allocation (see `src/lib/budget.ts`).
3. **Normalized `recommendations` table** — Easier per-category budget math than storing a JSON blob on `intakes`.
4. **LLM reliability** — `response_format: json_object`, Zod validation, one automatic retry with error feedback, and proportional scaling if allocations exceed budget.
5. **Reload without re-calling LLM** — `/plan/[id]` always hydrates from `GET /api/recommendations/[id]`. Streaming is only for the first visit after submit.

## Deploy (Vercel)

1. Push to GitHub and import in Vercel.
2. Add the same env vars (no `NEXT_PUBLIC` for Supabase service key).
3. Run the SQL migration in Supabase if not already applied.

## Project structure

```
src/
  app/              # Pages & API routes
  components/       # Intake wizard, plan UI
  lib/              # Validators, budget math, LLM service, Supabase admin
supabase/migrations/
```

## Manual test checklist

- Complete intake → recommendations appear on plan page
- Refresh `/plan/[id]` → same data, no new LLM request
- Log payment → budget summary updates
- Invalid payment category → 400 error

