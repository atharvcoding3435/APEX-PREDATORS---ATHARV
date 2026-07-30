# PRD - Resourcify Campus Resource Management Platform

**Project:** APEX PREDATORS  
**Status:** Active hackathon build  
**Last Updated:** 2026-07-31

## Purpose

Resourcify provides a conflict-free digital booking system for campus resources. It helps students, faculty, and admins discover available resources, request time slots, avoid double bookings, and manage approvals from one web application.

## Goals

| Goal | Success Metric |
|---|---|
| Prevent double booking | No two pending, approved, or active bookings overlap for the same resource/date/time |
| Reduce manual admin work | Resource management and approvals live in admin workflows |
| Improve visibility | Users can browse availability and booking status without contacting staff |
| Improve utilization | Conflicts surface alternatives and waitlist-oriented next steps |

## Roles

| Capability | Student | Faculty | Admin |
|---|---:|---:|---:|
| Browse resources | Yes | Yes | Yes |
| Create bookings | Yes | Yes | Yes |
| View booking status | Own | Own/department | All |
| Approve or reject bookings | No | Department scoped | Yes |
| Manage resources | No | No | Yes |
| View audit logs | No | Scoped | Yes |
| View analytics | No | Scoped | Yes |

## Functional Requirements

### Resources

- Users can search and filter resources by type, location, department, status, and capacity.
- Public Resources page is view-only for students and faculty.
- Admin Resources page supports add, edit, deactivate/reactivate, search, and filtering.
- Resource mutation APIs must verify admin role before accepting changes.

### Bookings

- Users can create a booking with resource, requester, role, department, date, start time, end time, and purpose.
- The system must reject invalid dates, past slots, end-before-start times, and durations over the configured limit.
- Booking lifecycle is: Pending -> Approved -> Active -> Completed, with Cancelled and Rejected terminal states.
- Pending, approved, and active bookings block overlapping slots.
- Cancelled, rejected, and completed bookings do not block new bookings.

### Conflict Handling

- Conflict rule: `new_start < existing_end AND existing_start < new_end`.
- API returns HTTP 409 for conflicts with structured conflict details.
- UI shows a clear unavailable message, highlights the slot, and suggests alternatives.

### Dashboard

- Dashboard shows availability, pending approvals, approved bookings, active bookings, waitlist demand, upcoming bookings, and resource utilization.

### Audit

- Booking creation, approval, rejection, cancellation, completion, resource creation, resource update, and resource deactivation should be auditable.

## Non-Functional Requirements

- App must build successfully with `npm run build`.
- TypeScript must remain strict and clean.
- UI must be responsive for desktop and mobile.
- APIs must return structured JSON errors.
- Backend validation must not rely on frontend hiding alone.

## Out Of Scope

- Physical attendance verification workflows.
- Native mobile apps.
- Hardware access control.
