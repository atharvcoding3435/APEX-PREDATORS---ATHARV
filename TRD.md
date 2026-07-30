# TRD - Resourcify

**Last Updated:** 2026-07-31

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| UI | Tailwind CSS, Lucide React |
| API | Next.js route handlers |
| Validation | Zod |
| Database Target | Supabase PostgreSQL |
| Hosting | Vercel |
| Runtime | Node.js 24.x |

## Architecture

```
Next.js App Router
  -> Public user pages
  -> Admin pages
  -> /api/v1 route handlers
  -> Supabase-ready data layer
  -> PostgreSQL schema with RLS and conflict triggers
```

## Technical Guarantees

- Resource mutations require Admin authorization at the API layer.
- Booking creation validates request shape and time rules.
- Booking conflicts are checked using the overlap rule.
- Pending, approved, and active bookings block overlapping slots.
- Cancelled, rejected, and completed bookings do not block new slots.
- Database migration contains no retired attendance-workflow fields or triggers.

## Performance Targets

| Metric | Target |
|---|---|
| Booking conflict check | Under 200ms |
| Dashboard load | Under 1.5s on good campus Wi-Fi |
| API validation response | Under 100ms without database latency |
| Build | Successful `next build` |

## Security

- Supabase Auth will provide JWT/session identity.
- RLS policies gate row access.
- Admin-only APIs must reject non-admin roles.
- Input validation uses Zod.
- Audit logs are append-only.

## Removed Scope

The project does not include physical attendance verification workflows. Product focus stays on resource discovery, conflict-free booking, approvals, waitlists, audit logs, and analytics.
