---
name: verify
description: How to verify /app/* pages end-to-end in this repo (auth-gated Next.js + Supabase). Build/launch/drive recipe with disposable QA fixture.
---

# Verifying auth-gated /app pages

The /app/* area needs an authenticated Supabase user with a paid-plan company.
The production DB usually has no usable fixture (Ion's account is plan `free`,
no SKUs). Recipe that works:

## 1. Disposable QA fixture (ALWAYS ask Ion first, ALWAYS delete after)

- Create user via GoTrue admin API (keys in `.env.local`):
  `POST {NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users` with
  `apikey`/`Authorization: Bearer` = `SUPABASE_SERVICE_ROLE_KEY`, body
  `{"email":"qa-verify-...@example.com","password":"...","email_confirm":true}`.
- Seed via SQL (supabase MCP `execute_sql`): `companies` (owner_id = new user,
  plan `'completo'`), `company_countries` (codes must exist in `countries`:
  DE/FR/IT seeded from /rules), `skus` + `packaging_components` (canonical
  materials, e.g. `paper_cardboard`), `sales_volumes` for prefill tests.
- Cleanup: `delete from companies where id = ...` (cascades to everything),
  then `DELETE /auth/v1/admin/users/{id}`. Note: companies→auth.users FK has
  NO cascade, so delete the company BEFORE the user.

## 2. Launch

`npm run dev` (background). Ready in ~5s on :3000.

## 3. Drive

No browser deps in the repo (and none may be added). Use **playwright-core +
Windows Edge channel** from the scratchpad (no browser download needed):

```js
// npm i playwright-core (in scratchpad, NOT the repo)
const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
```

- Login form: `#email`, `#password`, `button[type=submit]`; use
  `/login?next=/app/<page>` to land directly.
- Server actions re-render the route's server components automatically, but
  the RSC patch streams in with a small lag in dev — wait before asserting
  server-rendered sections (e.g. report history) updated.
- 360px floor check: `document.scrollingElement.scrollWidth <= 360` (tables
  scroll inside their own `overflow-x-auto` wrapper from components/ui/table).

## Gotchas

- `text=...` locators substring-match: "Report generato" also matches the
  history empty state "Nessun report generato finora".
- The PostHog cookie banner overlays mid-page in screenshots; dismiss it
  first if it hides what you're asserting.
- A 404'd resource logs a console error on /login (pre-existing, harmless).
