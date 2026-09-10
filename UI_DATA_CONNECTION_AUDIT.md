# UI data connection audit

Snapshot: 2026-08-31. Scope: all 52 routes declared in `frontend/src/app/app.routes.ts`.

## Result

- 48 application routes use an Angular service or HTTP API for operational data.
- `privacy-policy` and `terms` are intentionally static legal content.
- The public Home route combines static marketing content with live subscription plans. Hardcoded plan fallback data was removed; API failure now shows an explicit unavailable state.
- Subscription, billing, invoices, quota usage, admin plan management, dashboards, assessments, evidence, carbon logs, organizations, users, branches, assessor workflows, notifications, audit logs, and executive views all have service/API paths.

## Corrections made

- Home and `/subscription` now use `subscription_plans` as the plan source of truth; inactive plans are excluded.
- Removed quota assumptions tied to plan IDs 3 and 36. Quotas now come from persisted settings.
- Added `subscription_plans.stripe_price_id` and a migration.
- Paid checkout now creates a Stripe subscription and a local `organization_subscriptions` record instead of merely saving a card.
- Removed the webhook fallback to plan 36; Stripe events without a valid `planId` are rejected.
- Payment-method deletion validates that the method belongs to the caller's organization.
- Removed fabricated AI recommendation cards on API failure; empty/error UI is used instead.
- Removed the simulated Stripe Connect button from assessor profile.
- SMTP LIVE mode now fails closed when configuration is incomplete instead of silently reporting a mock delivery.
- Carbon log creation no longer substitutes a fabricated `0.5` emission factor. A persisted factor must be selected and valid.
- Password-reset and email-verification links (including their JWT tokens) are no longer written to application logs.

## Database-backed workflow evidence

Validated against an isolated PostgreSQL clone on 2026-08-31, then removed the clone:

- Organization registration → login → assessment creation → 8 persisted assessment details.
- A second organization was denied access to the first organization's assessment (404 to avoid resource enumeration).
- Assessor registration → submitted assignment → approval at score 85 → persisted certificate `PILOT-2026-001`; the assessment retained the correct assessor foreign key.
- Subscription plans were loaded from `subscription_plans`. The only local plan had no Stripe Price ID, so paid checkout rejected the request instead of creating fake payment/subscription data.
- Migration rollback/re-apply was exercised on a separate clone; row counts were unchanged and the added column was restored.

## Data that is intentionally static

Home hero copy, feature descriptions, FAQ/category labels, select options, calendar/month labels, chart colors, form placeholders, Privacy Policy, and Terms are presentation/configuration content rather than database records.

## Remaining environment dependencies

- A paid plan must be assigned a real recurring Stripe `price_...` ID in Admin → Subscriptions.
- The local database has only one active plan. The UI will correctly show only that record until administrators seed/configure additional real plans.
- Stripe, Supabase, Gemini, SMTP, and database behavior cannot be validated end-to-end without valid environment credentials.
- Admin settings are persisted in the configured settings JSON file, not PostgreSQL. They are configuration state, but moving them into a database table remains an optional post-Pilot architecture change.
- The local database currently contains two organizations, one active subscription, zero payments, and one active plan. Empty payment UI therefore reflects database state, not mock records.
