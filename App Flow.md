# App Flow - Resourcify

**Last Updated:** 2026-07-31

## Entry

Users land on `/` and open the application from the dashboard link. Future authentication will route users to either the general dashboard or admin dashboard based on role.

## Student / Faculty Flow

1. Open Dashboard.
2. Browse live resource metrics and upcoming bookings.
3. Go to Resources.
4. Search and filter by resource type, department, status, capacity, or location.
5. Go to Bookings.
6. Create a booking request.
7. Review real-time availability and calendar slot color.
8. Submit the request.
9. If no conflict exists, booking is created as Pending or Approved.
10. If conflict exists, the user sees the unavailable resource, blocked time range, and suggested alternatives.
11. User tracks status from My Bookings and Booking Detail.

## Admin Resource Flow

1. Admin opens `/admin`.
2. Admin goes to `/admin/resources`.
3. Admin searches and filters resources.
4. Admin adds a new resource or edits existing metadata.
5. Admin deactivates a resource after confirmation when it should no longer be bookable.
6. Admin can reactivate inactive resources when needed.

## Approval Flow

1. A booking starts as Pending when manual review is required.
2. Faculty or Admin reviews it under Pending Approvals.
3. Approved bookings reserve the slot and block overlaps.
4. Rejected bookings become terminal and do not block future bookings.
5. Approved bookings become Active during their scheduled time window.
6. Active bookings become Completed after the reservation ends.

## Conflict Flow

```
User submits booking
  -> Validate form
  -> API checks same resource, same date, overlapping time
  -> If pending/approved/active conflict exists: return 409
  -> UI shows conflict and alternatives
  -> User chooses a different slot/resource
```

## Navigation

General sidebar:

- Dashboard
- Resources
- Bookings
- Profile

Admin sidebar:

- Dashboard
- Resources
- Users
- Pending Approvals
- Audit Logs
- Analytics

## Booking State Machine

```
Pending -> Approved -> Active -> Completed
Pending -> Rejected
Pending -> Cancelled
Approved -> Cancelled
Active -> Completed
```
