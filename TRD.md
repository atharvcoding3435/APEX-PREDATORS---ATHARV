# TRD — Technical Requirement Document

**Project:** Campus Resource Management Platform (CRMP)
**Document Version:** 1.0.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Introduction

This document defines the technical requirements for the Campus Resource Management Platform. It specifies the technology stack, infrastructure, performance targets, security architecture, and technical constraints. The platform replaces legacy paper-based and spreadsheet-driven campus resource management with a real-time, conflict-free digital system.

---

## 2. Technology Stack

### 2.1 Frontend

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Framework | Next.js (App Router) | 14.x | SSR/SSG out of the box, co-located API routes, Vercel-native |
| Language | TypeScript | 5.x | Type safety, autocompletion, self-documenting code |
| Styling | Tailwind CSS | 3.x | Utility-first, rapid prototyping, dark theme by default |
| State | React Context + `useSyncExternalStore` | — | Lightweight, no external state library overhead |
| Icons | Lucide React | latest | Consistent, tree-shakeable icon set |

### 2.2 Backend

| Component | Technology | Justification |
|-----------|-----------|---------------|
| API Routes | Next.js API Routes (App Router) | No separate backend server; co-located with frontend |
| Auth | Supabase Auth (OAuth + Magic Links) | Session management, JWT generation, role-based access |
| Realtime | Supabase Realtime (Postgres CDC) | WebSocket-free real-time via Postgres change feed |
| Database | PostgreSQL (via Supabase) | ACID compliance for conflict-lock, RLS for access control |
| Storage | Supabase Storage | QR code image storage with public URL generation |
| Hosting | Vercel (Edge + Serverless Functions) | Zero-config CDN, auto-scaling, free tier |

### 2.3 Why Not Alternatives

| Alternative | Why Rejected |
|-------------|-------------|
| Firebase | No relational model — RLS impossible; No stored procedures for complex booking logic |
| MongoDB | No native ACID transactions across documents; No row-level security |
| Django + PostgreSQL | Requires a running server process; higher operational overhead |
| Express + React (separate) | Separate backend server adds deployment complexity and latency |
| Flutter / React Native | Web-first app; native mobile is a future phase (v2.0) |

---

## 3. Infrastructure Architecture

### 3.1 Deployment Targets

| Environment | Frontend | Backend/DB | Cost |
|------------|----------|-----------|------|
| Development | `localhost:3000` | Supabase free tier | Free |
| Staging | Vercel Preview | Supabase free tier | Free |
| Production | Vercel Production | Supabase Pro (if needed) | Free → $25/mo |

### 3.2 Vercel Configuration

| Setting | Value |
|---------|-------|
| Framework | NextJS |
| Region | `iad1` (US East) or nearest to campus |
| Build Command | `next build` |
| Dev Command | `next dev` |
| Install Command | `npm install` |
| Node Version | 18.x |
| Functions | Default (10s timeout, 1GB memory) |

### 3.3 Supabase Configuration

| Setting | Value |
|---------|-------|
| Database | PostgreSQL 15 (managed) |
| Auth | Email + Magic Link + OAuth (Google, GitHub) |
| Realtime | Enabled (broadcast + presence) |
| Storage | 1GB (QR code images) |
| Bandwidth | 1GB free tier |
| RLS | Enabled on all tables |

---

## 4. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Booking conflict check | < 200ms | Supabase transaction time (SELECT FOR UPDATE) |
| Dashboard initial load | < 1.5s on 3G | Lighthouse / Web Vitals |
| Real-time notification delivery | < 1s from DB commit | Supabase Realtime latency |
| QR code generation | < 100ms | `qr-code-styling` render time |
| API response (non-database) | < 50ms | Vercel Edge Function cold start |
| Concurrent users | 500 CCU | Supabase connection pooling |
| Time to Interactive (TTI) | < 2.0s | Lighthouse on simulated 3G |
| Cumulative Layout Shift (CLS) | < 0.1 | CSS-defined dimensions on all dynamic content |
| First Input Delay (FID) | < 100ms | React hydration + event binding |

---

## 5. Security Requirements

### 5.1 Authentication & Authorization

| Requirement | Implementation |
|-------------|---------------|
| User authentication | Supabase Auth (JWT-based sessions) |
| Magic link login | Primary method — no password storage needed |
| Role-based access control (RBAC) | Enforced at API layer + database RLS |
| Session management | Supabase handles token refresh automatically |
| Session expiry | 2 hours of inactivity (configurable) |

### 5.2 Data Security

| Requirement | Implementation |
|-------------|---------------|
| Row Level Security | Every table has RLS policies; no direct DB access from client |
| Data validation | Zod schemas on all API request bodies |
| SQL injection prevention | Supabase client uses parameterized queries; no raw SQL in client code |
| XSS prevention | React auto-escapes JSX; `dangerouslySetInnerHTML` never used |
| CSRF protection | Vercel edge middleware handles CORS header validation |
| Secure tokens | Supabase `service_role` key used only in server-side API routes; never exposed to browser |

### 5.3 Operational Security

| Requirement | Implementation |
|-------------|---------------|
| Audit trail | Every action logged in `audit_logs` table (append-only) |
| QR code single-use | `checkin_token` is UUID v4, set to NULL after use |
| Rate limiting | Vercel Speed Insights / custom middleware (5 req/min on auth) |
| CORS | Restricted to production domain + localhost origin |
| HTTPS | Automatic via Vercel + Supabase (Let's Encrypt) |
| Dependency scanning | `npm audit` in CI pipeline |

---

## 6. Database Technical Requirements

### 6.1 Database Engine

PostgreSQL 15 (managed by Supabase).

### 6.2 Key Technical Guarantees

| Requirement | How It's Met |
|-------------|-------------|
| No double bookings | `SELECT ... FOR UPDATE` (row-level lock) inside a transaction |
| Data integrity | Foreign keys on all relationships; NOT NULL on required fields; CHECK constraints on enums |
| Access control | PostgreSQL Row Level Security (RLS) policies on every table |
| Audit immutability | `audit_logs` table has NO UPDATE/DELETE grants; only INSERT via service role |
| Concurrent access | Postgres MVCC handles read/write concurrency without explicit locks on reads |

### 6.3 Conflict Prevention Deep Dive

The core booking constraint uses serializable execution within a transaction:

```sql
BEGIN;
SELECT id FROM bookings
WHERE resource_id = 'resource-uuid'
  AND date = '2026-08-01'
  AND start_time < '12:00'::time
  AND end_time > '10:00'::time
  AND status IN ('pending', 'confirmed')
FOR UPDATE OF bookings;
-- If any row is returned → CONFLICT → abort transaction
-- If no rows returned → INSERT new booking → COMMIT
```

### 6.4 Index Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `bookings` | Partial unique on `(resource_id, date, start_time, end_time) WHERE status IN ('pending', 'confirmed')` | Enforces no overlapping bookings at DB level |
| `bookings` | Gin on `status` | Fast filtering by booking state |
| `resources` | GIN on `location` (text search) | Partial match for location search |
| `waitlist` | `(resource_id, date, start_time, end_time, position)` | Fast position lookup for waitlist processing |

---

## 7. API Technical Requirements

### 7.1 Architecture Pattern

RESTful JSON APIs. All endpoints under `/api/v1/`.

### 7.2 Request/Response Format

| Direction | Content-Type | Format |
|-----------|-------------|--------|
| Request (all) | `application/json` | UTF-8 |
| Response (success) | `application/json` | UTF-8 |
| Response (error) | `application/json` | UTF-8 with `error` + `message` fields |

### 7.3 Authentication

All endpoints (except `/auth/login` and `/auth/magic-link`) require:
```
Authorization: Bearer <supabase_jwt>
```

JWT is verified by middleware using `supabase.auth.getUser(request)`.

### 7.4 Real-Time Protocol

| Protocol | Usage | Trigger |
|----------|-------|---------|
| Supabase Realtime (Postgres CDC) | Broadcast booking status changes | INSERT/UPDATE/DELETE on `bookings` table |
| Server-Sent Events (SSE) | Fallback for browsers without WebSocket support | Next.js API route consuming Realtime stream |

### 7.5 Rate Limiting

| Endpoint Group | Requests/Minute | Per User/IP |
|---------------|----------------|-------------|
| `/api/v1/auth/*` | 5 | Per IP |
| `/api/v1/bookings` (POST) | 20 | Per user (JWT) |
| All others | 100 | Per user (JWT) |

---

## 8. Frontend Technical Requirements

### 8.1 Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |
| Mobile Safari | iOS 15+ |
| Chrome Mobile | Android 10+ |

### 8.2 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Desktop | ≥1024px | Sidebar + main content |
| Tablet | 768–1023px | Collapsible sidebar, stacked cards |
| Mobile | <768px | Bottom nav, single column, full-screen QR scanner |

### 8.3 Design Tokens

| Token | Value |
|-------|-------|
| `--bg-primary` | `#0F0F1A` |
| `--bg-card` | `#1A1A2E` |
| `--bg-elevated` | `#2A2A4E` |
| `--text-primary` | `#FFFFFF` |
| `--text-secondary` | `#A0A0B8` |
| `--accent-success` | `#00FF88` |
| `--accent-danger` | `#FF4444` |
| `--accent-warning` | `#FFAA00` |
| `--accent-info` | `#0088FF` |
| `--font-primary` | `'-Century Gothic', Arial, sans-serif` |
| `--font-size-base` | `16px` |
| `--line-height` | `1.5` |
| `--radius-card` | `8px` |

---

## 9. Testing Requirements

| Layer | Tool | Target Coverage |
|-------|------|----------------|
| Unit | Jest + React Testing Library | ≥70% on business logic |
| Integration | Supertest + Supabase test instance | All API routes |
| E2E | Playwright | Complete booking flow |
| DB | Migration tests (`supabase db test`) | RLS policy verification across all roles |
| Performance | k6 | 100 concurrent booking requests |

---

## 10. Technical Constraints (Hackathon)

| Constraint | Detail |
|-----------|--------|
| Development time | 2 days (16 hours) |
| Team size | 3–4 developers |
| Infrastructure budget | $0 (free tiers only) |
| Deployment target | Vercel + Supabase free tier |
| No external paid services | Everything must be free-tier |
| Must be demo-ready | Functional booking flow with at least 3 resources |
| Mobile responsive | Core flows must work on mobile browser |
| Offline capability | QR check-in works offline (deferred to demo if time permits) |

---

## 11. Deliverables Checklist

| Deliverable | Format |
|------------|--------|
| Working web app | Deployed URL on Vercel |
| Source code | Git repository |
| Database schema | Supabase project |
| API documentation | `API_SPEC.md` in repo |
| Design doc | `UI-UX Design Doc.md` in repo |
| TRD | `TRD.md` in repo |
| PRD | `PRD.md` in repo |
| Demo video / GIF | Hosted or embedded |
| Presentation | `APEX PREDATORS.pptx` |

---

*End of TRD*
