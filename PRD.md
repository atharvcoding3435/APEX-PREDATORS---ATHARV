# PRD — Campus Resource Management Platform (CRMP)

**Project:** APEX PREDATORS  
**Document Version:** 1.0.0  
**Date:** 2026-07-26  
**Status:** Draft  

> **Purpose:** This document defines the complete product requirements for the Campus Resource Management Platform — a unified digital system that replaces legacy paper ledgers and spreadsheets with a real-time, conflict-free campus asset distribution system.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Goals & Objectives](#2-goals--objectives)
3. [User Roles & Personas](#3-user-roles--personas)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Models](#7-data-models)
8. [API Specifications](#8-api-specifications)
9. [Security Requirements](#9-security-requirements)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [Timeline & Milestones](#12-timeline--milestones)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Future Enhancements](#14-future-enhancements)
15. [References](#15-references)

---

## 1. Introduction

### 1.1 Problem Statement

Colleges currently manage physical resources (classrooms, labs, equipment, auditoriums, sports facilities) using:

- Paper ledgers and sign-up sheets
- Messy spreadsheets maintained manually by admin staff
- Informal messaging groups (WhatsApp, SMS) for booking requests

This causes:

- **Double bookings** — multiple parties assigned the same resource at the same time
- **Scheduling overlaps** — no real-time visibility into what's already booked
- **Slow approvals** — manual paper-based sign-off chains
- **Wasted facilities** — resources go unused because no one knows they're available
- **Zero accountability** — no audit trail of who booked what and when

### 1.2 Proposed Solution

The **Campus Resource Management Platform (CRMP)** is a unified digital cloud registry that solves conflict-free campus asset distribution through:

- **Atomic DB-locking** — prevents simultaneous booking of the same resource-slot
- **Live calendar dashboard** — real-time visibility for students and faculty
- **Role-based workflows** — automated routing of approval requests
- **Instant waitlists** — cancellations are immediately offered to waiting users
- **QR-based check-in** — physical verification of reservation usage

### 1.3 Scope

This version (v1.0) covers a **single-campus deployment** with the following resource types:

- Classrooms
- Laboratories
- Auditoriums / Halls
- Equipment (projectors, laptops, etc.)
- Sports facilities (optional, can be deferred)

Multi-campus sync and IoT smart-lock integration are deferred to v2.0+.

---

## 2. Goals & Objectives

### Primary Goals

| # | Goal | Success Metric |
|---|------|---------------|
| G1 | Eliminate double bookings | Zero conflicting reservations in the system |
| G2 | Reduce admin overhead | 80% reduction in manual approval time |
| G3 | Provide real-time availability | Any user sees current availability within 1 second |
| G4 | Enable transparent scheduling | All users have calendar access matching their role |

### Secondary Goals

- Provide an audit trail for every booking action
- Support offline check-in with sync-on-reconnect
- Scale from a single department pilot to full campus deployment within 2 days of development

---

## 3. User Roles & Personas

### 3.1 Role Hierarchy

```
Admin (Super User)
 ├── Faculty / Staff
 │    └── Students
 └── Guest / External (read-only, optional)
```

### 3.2 Role Capabilities

| Capability | Admin | Faculty | Student | Guest |
|-----------|-------|---------|---------|-------|
| View all resources | ✅ | ✅ | ✅ (own dept) | ✅ (public only) |
| Book a resource | ✅ | ✅ | ✅ (own dept) | ❌ |
| Approve/reject bookings | ✅ | ✅ (own dept) | ❌ | ❌ |
| Manage users & roles | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ (own dept) | ❌ | ❌ |
| Cancel any booking | ✅ | ✅ (own bookings) | ✅ (own bookings) | ❌ |
| QR check-in | ✅ | ✅ | ✅ | ❌ |
| Dashboard analytics | ✅ | ✅ (own dept) | ❌ | ❌ |
| Manage waitlists | ✅ | ✅ | ✅ (opt-in) | ❌ |

### 3.3 Personas

**Admin (Priya)**
- Manages all resources and user accounts
- Needs to see system-wide utilization metrics
- Wants zero double bookings and full audit trails
- Pain point: currently checking paper ledgers for conflicting bookings

**Faculty (Dr. Rahul)**
- Books classrooms and labs for lectures and practicals
- Needs priority scheduling during peak hours (8–10 AM)
- Wants to see real-time availability before sending emails to students
- Pain point: manual spreadsheet updates that go stale

**Student (Ananya)**
- Books equipment (projectors, laptops) and reserves study rooms
- Needs to see what's available without asking admin
- Wants instant confirmation or waitlist notification
- Pain point: no way to know if a resource is free until physically checking

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AUTH-001 | Users must log in via OAuth (Google, college SSO, or email/password via Supabase Auth) | P0 |
| FR-AUTH-002 | System must identify user role (admin / faculty / student) on login | P0 |
| FR-AUTH-003 | Session tokens must be validated on every API request | P0 |
| FR-AUTH-004 | Role-based access control (RBAC) must gate all resource operations | P0 |
| FR-AUTH-005 | Session expiry after 2 hours of inactivity | P1 |
| FR-AUTH-006 | Magic link authentication for campus-friendly login | P1 |

### 4.2 Resource Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RES-001 | Admin must be able to add/update/delete resource entries (name, type, capacity, location, availability hours) | P0 |
| FR-RES-002 | Resources must be categorized (Classroom, Lab, Auditorium, Equipment, Sports) | P0 |
| FR-RES-003 | Each resource must have a defined schedule (e.g., Lab: Mon–Fri 8AM–6PM, closed weekends) | P0 |
| FR-RES-004 | Resources must support recurring availability patterns (e.g., "available every weekday") | P1 |
| FR-RES-005 | Resources must support capacity metadata (e.g., max 40 students for a classroom) | P1 |

### 4.3 Booking System

| ID | Requirement | Priority |
|----|------------|----------|
| FR-BOOK-001 | User can search resources by name, type, location, and availability | P0 |
| FR-BOOK-002 | System must enforce a **conflict lock** — no two bookings can overlap for the same resource | P0 |
| FR-BOOK-003 | Booking must specify: resource, date, start time, end time, purpose, requester | P0 |
| FR-BOOK-004 | Booking must transition through state machine: **Available → Pending → Confirmed → Completed / Cancelled** | P0 |
| FR-BOOK-005 | Pending bookings require approval from an authorized role (admin or faculty for own dept) | P0 |
| FR-BOOK-006 | If a booking is rejected, the requester must receive an immediate notification | P0 |
| FR-BOOK-007 | Cancelled/overlapping time slots must trigger waitlist processing | P0 |
| FR-BOOK-008 | Users must be able to cancel their own pending/confirmed bookings | P0 |
| FR-BOOK-009 | Admin must be able to cancel any booking | P0 |
| FR-BOOK-010 | System must prevent users from booking outside resource availability hours | P0 |
| FR-BOOK-011 | Bulk booking support (multiple consecutive slots) | P1 |

### 4.4 Waitlist System

| ID | Requirement | Priority |
|----|------------|----------|
| FR-WL-001 | When a booking slot becomes available (cancelled or rejected), the next user on the waitlist must be auto-notified | P0 |
| FR-WL-002 | Waitlisted user must have a configurable acceptance window (default: 15 minutes) | P1 |
| FR-WL-003 | If waitlisted user does not accept within the window, slot moves to next person | P1 |
| FR-WL-004 | Users must be able to opt-in to waitlists for specific resources | P1 |

### 4.5 Notification System

| ID | Requirement | Priority |
|----|------------|----------|
| FR-NOTIF-001 | Real-time push notification on booking status change (created, approved, rejected, cancelled, waitlist position) | P0 |
| FR-NOTIF-002 | Email notification for booking confirmations and cancellations | P1 |
| FR-NOTIF-003 | In-app notification bell with unread count | P0 |
| FR-NOTIF-004 | Notification must be delivered within 1 second of state change | P0 |

### 4.6 QR Check-In

| ID | Requirement | Priority |
|----|------------|----------|
| FR-QR-001 | Confirmed bookings must generate a unique QR code | P0 |
| FR-QR-002 | QR code must encode booking ID, resource ID, date, and time slot | P0 |
| FR-QR-003 | Admin/faculty must be able to scan QR at resource location to mark attendance | P0 |
| FR-QR-004 | Scanning a QR code must transition booking state from Confirmed → Completed | P0 |
| FR-QR-005 | QR codes must expire after the booking's end time | P1 |
| FR-QR-006 | Failed check-in (scanning outside time window) must be logged for audit | P1 |

### 4.7 Dashboard & Analytics

| ID | Requirement | Priority |
|----|------------|----------|
| FR-DASH-001 | Live calendar view showing all bookings per resource | P0 |
| FR-DASH-002 | Color-coded conflict indicators (red = double-booked, yellow = pending approval) | P0 |
| FR-DASH-003 | Admin dashboard showing utilization rates per resource type | P1 |
| FR-DASH-004 | Monthly usage report (most used resources, peak hours, no-show rate) | P1 |
| FR-DASH-005 | Upcoming bookings list with filter by resource/type/dept | P0 |

### 4.8 Audit & Logging

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AUDIT-001 | Every booking action (create, approve, reject, cancel, complete, QR scan) must be logged with timestamp, user ID, and action type | P0 |
| FR-AUDIT-002 | Logs must be immutable and queryable by admin | P0 |
| FR-AUDIT-003 | Audit trail must include IP address and user agent for each action | P1 |

### 4.9 Offline Support

| ID | Requirement | Priority |
|----|------------|----------|
| FR-OFF-001 | Service worker must cache the booking interface for offline viewing | P1 |
| FR-OFF-002 | QR check-in must work offline — records stored in IndexedDB and synced on reconnect | P1 |
| FR-OFF-003 | Conflicting offline bookings must be detected and flagged on sync | P1 |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|----|------------|--------|
| NFR-PERF-001 | Booking conflict check must complete in under 200ms | 200ms |
| NFR-PERF-002 | Dashboard must load within 1.5 seconds on 3G | 1.5s |
| NFR-PERF-003 | Real-time notifications must deliver within 1 second | 1s |
| NFR-PERF-004 | System must support 500 concurrent users | 500 CCU |
| NFR-PERF-005 | QR code generation must complete in under 100ms | 100ms |

### 5.2 Scalability

| ID | Requirement | Target |
|----|------------|--------|
| NFR-SCALE-001 | Database must handle 10,000+ booking records per semester | 10K records |
| NFR-SCALE-002 | System must support scaling to multi-campus with configuration only (no code change) | v2.0 |
| NFR-SCALE-003 | Serverless architecture must auto-scale to zero during non-peak hours | Auto-scale |

### 5.3 Reliability

| ID | Requirement | Target |
|----|------------|--------|
| NFR-REL-001 | System uptime must be 99.5% during operational hours | 99.5% |
| NFR-REL-002 | No data loss on booking transactions (ACID compliance) | Zero loss |
| NFR-REL-003 | Failed transactions must be retried automatically up to 3 times | 3 retries |

### 5.4 Maintainability

| ID | Requirement | Target |
|----|------------|--------|
| NFR-MAINT-001 | Code must follow a consistent style guide (Prettier + ESLint) | Enforced |
| NFR-MAINT-002 | API must be versioned (e.g., `/api/v1/`) | v1 |
| NFR-MAINT-003 | Test coverage must be ≥ 70% for business logic | 70% |
| NFR-MAINT-004 | All dependencies must be tracked in a lock file (`package-lock.json` or `pnpm-lock.yaml`) | Required |

---

## 6. Technical Architecture

### 6.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Dashboard │  │ Booking Flow │  │  QR Scanner / Check-in   │ │
│  └─────┬────┘  └──────┬───────┘  └────────────┬─────────────┘ │
│        │               │                        │               │
│        └───────────────┼────────────────────────┘               │
│                        │ HTTP / SSE                              │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Vercel (Edge / Serverless)                 ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │              API Routes (Next.js)                     │  ││
│  │  │  Auth → Validate → Authorize → Route → Response      │  ││
│  │  └──────────────────────┬────────────────────────────────┘  ││
│  └─────────────────────────┼───────────────────────────────────┘│
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Supabase (Edge Functions)                ││
│  │  ┌───────────┐  ┌──────────────┐  ┌────────────────────┐  ││
│  │  │  Auth      │  │  Realtime     │  │  Storage (QR imgs) │  ││
│  │  └─────┬─────┘  └──────┬───────┘  └────────────────────┘  ││
│  └────────┼────────────────┼──────────────────────────────────┘│
│           │                │                                     │
│           ▼                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  PostgreSQL (Row Level Security)            ││
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐ ││
│  │  │ resources│ │ bookings │ │  waitlist  │ │ audit_logs   │ ││
│  │  └──────────┘ └──────────┘ └───────────┘ └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React (Next.js) | SSR/SSG for fast initial loads, component reusability, Vercel-native deployment |
| **UI Framework** | Tailwind CSS | Rapid styling with utility classes, consistent design system |
| **Backend** | Next.js API Routes | No separate backend server needed; co-located with frontend |
| **Database** | PostgreSQL (via Supabase) | ACID compliance for conflict-lock, RLS for multi-tenancy, relational model for complex queries |
| **Auth** | Supabase Auth | OAuth, magic links, session management out of the box |
| **Realtime** | Supabase Realtime (Postgres CDC) | Instant notifications on booking state changes |
| **Hosting** | Vercel (frontend) + Supabase (backend) | Serverless, free tier for hackathon, global CDN |
| **QR Generation** | `qr-code-styling` | Branded QR codes with logo overlay |
| **State Management** | React Context + `useSyncExternalStore` | Lightweight, no external state library needed for this scope |
| **Offline** | Service Worker + IndexedDB | Offline check-in support with sync-on-reconnect |

### 6.3 State Machine

Every booking follows this state progression:

```
                    ┌──────────┐
         ┌─────────│  AVAILABLE │───────────┐
         │         └──────────┘            │
         │              │                  │
         │         createBooking()         │
         │              ▼                  │
         │         ┌──────────┐            │
         │         │  PENDING  │            │
         │         └──────────┘            │
         │         ╱        ╲              │
         │   approve()    reject()         │
         │      │              │           │
         │      ▼              ▼           │
         │  ┌───────────┐  ┌───────────┐  │
         │  │ CONFIRMED  │  │  CANCELLED │  │
         │  └─────┬─────┘  └───────────┘  │
         │        │                        │
         │   checkInByQR()                 │
         │        │                        │
         │        ▼                        │
         │  ┌───────────┐                  │
         │  │ COMPLETED  │                  │
         │  └───────────┘                  │
         │                                  │
         │   cancelBooking()                │
         │        │                         │
         │        ▼                         │
         │  ┌───────────┐                  │
         │  │  CANCELLED  │────────────────┘
         │  └───────────┘
```

---

## 7. Data Models

### 7.1 Entity-Relationship Overview

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   users      │───────│    bookings      │───────│  resources  │
│─────────────│       │─────────────────│       │─────────────│
│ id (PK)      │       │ id (PK)         │       │ id (PK)      │
│ email        │       │ resource_id (FK)│       │ name         │
│ role         │       │ requester_id(FK)│       │ type         │
│ name         │       │ status          │       │ location     │
│ department   │       │ date            │       │ capacity     │
│ created_at   │       │ start_time      │       │ schedule     │
│ updated_at   │       │ end_time        │       │ color        │
└─────────────┘       │ purpose         │       │ is_active    │
                      │ waitlist_pos    │       └─────────────┘
                      │ qr_code_url     │
                      │ created_at      │
                      │ updated_at      │
                      └─────────────────┘

┌─────────────────┐       ┌──────────────┐
│   waitlist       │       │ audit_logs   │
│─────────────────│       │──────────────│
│ id (PK)          │       │ id (PK)      │
│ booking_id (FK)  │       │ booking_id(FK)│
│ user_id (FK)     │       │ user_id (FK) │
│ position         │       │ action       │
│ status           │       │ details      │
│ expires_at       │       │ ip_address   │
│ created_at       │       │ user_agent   │
└─────────────────┘       │ created_at   │
                          └──────────────┘
```

### 7.2 Detailed Field Definitions

See [DATA_MODELS.md](./DATA_MODELS.md) for complete field-level definitions, constraints, and RLS policies.

---

## 8. API Specifications

See [API_SPEC.md](./API_SPEC.md) for complete endpoint definitions, request/response schemas, authentication flows, and error codes.

### 8.1 Endpoint Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST `/api/v1/auth/login` | Email/password or magic link | ✅ | P0 |
| POST `/api/v1/auth/logout` | Invalidate session | ✅ | P0 |
| GET `/api/v1/users/me` | Get current user profile | ✅ | P0 |
| GET `/api/v1/resources` | List resources with filters | ✅ | P0 |
| GET `/api/v1/resources/:id` | Get single resource detail | ✅ | P0 |
| POST `/api/v1/resources` | Create resource | Admin only | P0 |
| PUT `/api/v1/resources/:id` | Update resource | Admin only | P0 |
| DELETE `/api/v1/resources/:id` | Delete resource | Admin only | P0 |
| GET `/api/v1/bookings` | List bookings (filtered by user/role) | ✅ | P0 |
| POST `/api/v1/bookings` | Create a booking | ✅ | P0 |
| PATCH `/api/v1/bookings/:id/status` | Approve/reject/cancel booking | ✅ | P0 |
| POST `/api/v1/bookings/:id/checkin` | QR check-in | ✅ | P0 |
| GET `/api/v1/bookings/:id/qr` | Generate QR code for booking | ✅ | P0 |
| GET `/api/v1/waitlist/:resource_id` | Get waitlist for a resource | ✅ | P1 |
| POST `/api/v1/waitlist/:resource_id` | Join waitlist | ✅ | P1 |
| GET `/api/v1/audit-logs` | Query audit logs | Admin only | P0 |
| GET `/api/v1/analytics/dashboard` | Utilization metrics | Admin + Faculty | P1 |

---

## 9. Security Requirements

| ID | Requirement | Details |
|----|------------|---------|
| SEC-001 | All API endpoints must validate authentication tokens | Supabase JWT on every request |
| SEC-002 | Row Level Security (RLS) must be enabled on all tables | Users can only see/modify data within their scope |
| SEC-003 | Password policies | Min 8 chars, must include uppercase + number + special char |
| SEC-004 | Session tokens must be HttpOnly, Secure, SameSite=Lax | Prevent XSS token theft |
| SEC-005 | All booking operations must be atomic | Use Supabase transactions to prevent race conditions |
| SEC-006 | QR codes must be single-use per check-in | Prevent reuse for attendance fraud |
| SEC-007 | Audit logs must be append-only and immutable | No DELETE or UPDATE on audit_logs table |
| SEC-008 | Input sanitization on all user-supplied data | Prevent SQL injection and XSS |
| SEC-009 | Rate limiting on auth endpoints | Max 5 login attempts per minute per IP |
| SEC-010 | CORS must restrict to approved domains | Only the deployed frontend origin |

---

## 10. UI/UX Requirements

### 10.1 Design System

| Property | Value |
|----------|-------|
| **Font** | Century Gothic (primary), Arial (fallback) |
| **Font Color** | White (`#FFFFFF`) on dark backgrounds |
| **Line Spacing** | 1.5× |
| **Background** | Dark theme (`#0F0F1A` primary, `#1A1A2E` cards) |
| **Accent Colors** | Green (#00FF88) for success, Red (#FF4444) for conflicts, Amber (#CCAA00) for pending |
| **Border Radius** | 8px for cards, 4px for buttons |
| **Spacing** | 8px base unit (4, 8, 16, 24, 32, 48, 64) |

### 10.2 Key Screens

1. **Login / Magic Link Entry** — Clean, single-page, resembling a consumer login screen
2. **Dashboard** — Calendar view (week/day toggle) + upcoming bookings card + resource search bar
3. **Resource Search** — Filterable list/grid with availability indicators and booking button
4. **Booking Form** — Multi-step: Select resource → Pick date/time → Enter purpose → Review & Confirm
5. **Booking Detail** — Status, QR code display, cancel button, approval actions for admins
6. **Admin Panel** — User management, resource CRUD, audit log viewer, utilization chart
7. **Waitlist View** — Position in queue, estimated wait time, opt-out button
8. **QR Scanner** — Camera-based scanner for check-in (mobile) or manual code entry (desktop)

### 10.3 Responsive Requirements

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Full dashboard with sidebar navigation |
| Tablet (768–1023px) | Collapsed sidebar, stacked cards |
| Mobile (<768px) | Bottom navigation, single-column layout, QR scanner full-screen |

---

## 11. Deployment & Infrastructure

### 11.1 Environment Configuration

| Environment | URL | Database | Purpose |
|------------|-----|----------|---------|
| Development | `localhost:3000` | Local Supabase or Docker | Developer workstation |
| Staging | `staging.crmp.example.com` | Supabase (free tier) | Pre-deployment testing |
| Production | `crmp.example.com` | Supabase (Pro tier for full campus) | Live deployment |

### 11.2 Deployment Pipeline

```
Local Development → Git Push → Vercel Preview → Manual QA → Git Merge → Vercel Production
```

### 11.3 Infrastructure Requirements

| Component | Requirement |
|-----------|------------|
| **Frontend Hosting** | Vercel (free tier sufficient for demo) |
| **Backend/Database** | Supabase (free tier: 500MB DB, 1GB file storage, 50K monthly active users) |
| **CDN** | Vercel Edge Network (automatic) |
| **SSL/TLS** | Automatic via Vercel + Supabase |
| **Domain** | Custom domain supported on Vercel Pro (optional for hackathon) |

---

## 12. Timeline & Milestones

### 12.1 2-Day Sprint Schedule

#### Day 1: Foundation (8 hours)

| Time | Task | Deliverable |
|------|------|-------------|
| 0–1h | Project scaffolding: Next.js + Tailwind + Supabase client setup | Working dev environment |
| 1–2h | Database schema creation + RLS policies | Tables created, RLS enforced |
| 2–4h | Auth flow (login, logout, role identification) | Working auth with protected routes |
| 4–5h | Resource CRUD (admin) | Admin can add/edit/delete resources |
| 5–7h | Conflict-lock booking logic (Postgres transaction) | No double bookings possible |
| 7–8h | Basic dashboard with resource list + search | Functional search and view |

#### Day 2: Features & Polish (8 hours)

| Time | Task | Deliverable |
|------|------|-------------|
| 0–1h | Booking form with date/time picker + conflict validation | Bookings can be created |
| 1–2h | Approval workflow (admin/faculty) | Pending → Confirmed/Cancelled flow |
| 2–3h | Waitlist system with notification | Waitlist processes on cancellation |
| 3–4h | QR code generation for confirmed bookings | QR codes displayable and scannable |
| 4–5h | Real-time notifications + live calendar updates | Instant status updates via Supabase Realtime |
| 5–6h | Audit logging for all booking actions | Immutable log of all actions |
| 6–7h | UI polish: responsive design, dark theme consistency, mobile checks | Production-quality appearance |
| 7–8h | Testing, bug fixes, demo preparation | Deployed to Vercel, demo-ready |

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Admin resistance to digital shift | High | High | Simple UI mimicking consumer calendars; pilot in one tech department first |
| Complex bulk bookings hard to handle manually | Medium | Medium | Built-in bulk import template + waitlist routing |
| Intermittent on-campus connectivity | Medium | High | Service worker + IndexedDB for offline check-in; syncs when online |
| Race condition on simultaneous bookings | Low | Critical | Postgres row-level locking with `SELECT FOR UPDATE` in transaction |
| Scalability beyond single campus | Low | Low | Architecture designed for multi-branch sync (deferred to v2.0) |
| Time overrun in hackathon (2-day limit) | Medium | Medium | Scope strictly limited to v1.0 features; future enhancements deferred |

---

## 14. Future Enhancements (v2.0+)

| Feature | Description | Dependency |
|---------|-------------|-----------|
| AI Congestion Prediction | ML model predicts high-demand times and suggests alternatives | Historical booking data |
| Smart Lock Integration | IoT locks trigger open-on-QR scan for equipment rooms | Physical hardware (ESP32 + servo) |
| Multi-Campus Sync | Cross-campus resource sharing and booking | Supabase Multi-org or custom sharding |
| Google / Outlook Calendar Sync | Two-way sync of bookings with external calendars | Google Calendar API + Microsoft Graph API |
| Predictive Capacity Planning | Admin analytics for resource purchase decisions | Utilization data over full semesters |
| Native Mobile Apps | Dedicated iOS and Android clients | React Native or Expo |
| Email Notifications | SMTP-based email for booking confirmations | Resend, SendGrid, or AWS SES |
| Report Export | CSV/PDF exports of usage reports | `jsPDF` or `react-pdf` |

---

## 15. References

1. [Supabase Documentation](https://supabase.com/docs)
2. [PostgreSQL ACID Transactions](https://www.postgresql.org/docs/current/transaction-iso.html)
3. [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
4. [React](https://react.dev)
5. [Vercel Serverless Deployment](https://vercel.com/docs)
6. [python-pptx (slide generation library)](https://python-pptx.readthedocs.io)
7. [qr-code-styling](https://github.com/kozakDenis/qr-code-styling)
8. [Next.js Documentation](https://nextjs.org/docs)

---

*End of PRD — APEX PREDATORS*
