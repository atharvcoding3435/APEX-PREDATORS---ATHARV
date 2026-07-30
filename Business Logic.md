# Business Logic - Resourcify

**Last Updated:** 2026-07-31

## Booking Statuses

| Status | Meaning | Blocks New Booking |
|---|---|---:|
| Pending | Request is waiting for approval | Yes |
| Approved | Request is accepted and reserved | Yes |
| Active | Booking is currently in its scheduled window | Yes |
| Completed | Booking has ended | No |
| Cancelled | Booking was cancelled | No |
| Rejected | Booking was denied | No |

## Conflict Detection

A booking conflicts when all conditions are true:

- Same resource
- Same date
- Existing booking status is Pending, Approved, or Active
- `new_start < existing_end`
- `existing_start < new_end`

Conflict checks must run on the frontend for user experience and on the backend for integrity.

## Validation Rules

- Start and end time must be valid.
- End time must be after start time.
- Booking cannot be in the past.
- Booking duration cannot exceed 4 hours.
- Purpose must be meaningful.
- Duplicate submissions must be prevented by disabling submit while a request is in flight.

## Approval Routing

- Admin bookings are approved automatically.
- Faculty bookings for their own department can be approved automatically.
- Student classroom bookings can be approved automatically.
- Student lab, auditorium, equipment, or peak-hour requests can remain pending for review.

## Waitlist Logic

When a blocking booking is cancelled or rejected:

1. Find the next waiting entry for the same resource/date/time.
2. Mark it offered.
3. Set an expiry window.
4. Notify the waiting user.
5. If accepted, create an approved booking after conflict validation.

## Resource Management

- Students and faculty can view resources only.
- Admins can create, edit, deactivate, and reactivate resources.
- Resource changes must be checked by backend authorization.
- Deactivated resources are hidden from normal booking discovery but remain visible in admin records.

## Audit Events

- `booking_created`
- `booking_approved`
- `booking_rejected`
- `booking_cancelled`
- `booking_completed`
- `resource_created`
- `resource_updated`
- `resource_deactivated`
- `resource_reactivated`
- `waitlist_joined`
- `waitlist_offered`
- `waitlist_accepted`
- `waitlist_expired`
