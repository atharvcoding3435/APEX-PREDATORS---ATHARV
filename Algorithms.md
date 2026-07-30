# Algorithms - Resourcify

**Last Updated:** 2026-07-31

## Algorithm Index

| ID | Name | Purpose |
|---|---|---|
| A1 | Booking Conflict Detection | Prevent overlapping active bookings |
| A2 | Booking Validation | Reject invalid dates, times, durations, and duplicate submissions |
| A3 | Approval Routing | Decide whether a booking is pending or approved |
| A4 | Alternative Suggestions | Recommend other slots or similar resources |
| A5 | Waitlist Allocation | Offer cancelled/rejected slots to waiting users |
| A6 | Resource Search | Filter resources by query, type, department, location, and status |
| A7 | Session Validation | Verify identity and role before protected operations |

## A1 - Booking Conflict Detection

```
FUNCTION findConflict(newBooking):
  FOR EACH existingBooking IN bookings:
    IF existingBooking.resource_id != newBooking.resource_id:
      CONTINUE
    IF existingBooking.date != newBooking.date:
      CONTINUE
    IF existingBooking.status NOT IN ('pending', 'approved', 'active'):
      CONTINUE
    IF newBooking.start_time < existingBooking.end_time
       AND existingBooking.start_time < newBooking.end_time:
      RETURN existingBooking

  RETURN null
```

The backend must run this check before insert. The frontend also runs it to give immediate feedback.

## A2 - Booking Validation

```
FUNCTION validateBooking(input):
  errors = []
  IF date is invalid: errors.push("Choose a valid booking date")
  IF start or end time invalid: errors.push("Choose valid start and end times")
  IF end_time <= start_time: errors.push("End time must be after start time")
  IF duration > 4 hours: errors.push("Booking duration cannot exceed 4 hours")
  IF slot is in the past: errors.push("Booking cannot be made for a past slot")
  RETURN errors
```

## A3 - Approval Routing

```
FUNCTION defaultStatus(role, resource):
  IF role == 'admin': RETURN 'approved'
  IF role == 'faculty' AND resource.department == user.department: RETURN 'approved'
  IF role == 'student' AND resource.type == 'classroom': RETURN 'approved'
  RETURN 'pending'
```

## A4 - Alternative Suggestions

When a conflict exists:

1. Try the same resource at an earlier available slot.
2. Try the same resource at the next available slot.
3. Try similar resources with matching type, sufficient capacity, and matching department where possible.

## A5 - Waitlist Allocation

```
FUNCTION processWaitlist(cancelledBooking):
  nextEntry = earliest waiting entry for same resource/date/start/end
  IF nextEntry exists:
    mark nextEntry as offered
    set expiry window
    notify user
```

## A6 - Resource Search

Search matches name, type, location, and department. Filters narrow by type, availability status, active/inactive state, and capacity.

## A7 - Session Validation

Protected APIs must extract the authenticated user, load role information, and deny unauthorized mutations. Resource create/update/delete operations require Admin.
