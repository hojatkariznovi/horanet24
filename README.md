# Horanet24 — Digital Services Platform

A mobile-first Persian (RTL) service showcase for **horanet24.ir**.

## Frontend
- Responsive Persian RTL interface with a pearl-white, turquoise and blue visual system.
- Tailwind CSS utilities compiled at build time; no Tailwind CDN runtime.
- Service discovery with categories, search, details, required documents and steps.
- Product catalogue with sample digital products and Eitaa hand-off.
- Stories, educational content, PWA manifest and service worker.
- Supabase Auth for optional customer accounts and favorites.

## Service model
The public website is a showcase and guidance layer. It does **not** collect service orders, identity documents, payments, or perform request processing. Service and product CTAs direct customers to the official Eitaa bot: https://eitaa.com/huranet24_app.

## Backend
Supabase project: `iqrgqkluuhbyphtihsls`.
- PostgreSQL content tables for service categories, services, products, stories and explore posts.
- Public read policies only for active/published catalogue content.
- Customer profile and favorites protected with Row Level Security.
- Customer request/conversation tables exist in the database but are not part of the public website flow.
- Never expose a Supabase service-role or secret key in frontend code.

## Build and deployment
GitHub Pages deploys from `dist/` using GitHub Actions. Tailwind is compiled during CI.
- `npm install`
- `npm run build`

## Operational notes
- Sample catalogue products are clearly labelled as samples and must be replaced or approved before commercial promotion.
- Admin content-management access must be provisioned separately and protected by explicit admin authorization policies.
- Verify Supabase RLS and GitHub Actions after every production change.
