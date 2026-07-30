# Algorithms — Campus Resource Management Platform (CRMP)

**Version:** 1.0.0
**Last Updated:** 2026-07-28
**For:** APEX PREDATORS Team

---

## 1. Algorithm Index

| # | Name | Purpose | Complexity |
|---|------|---------|-----------|
| A1 | Booking Conflict Detection | Prevents double bookings | O(log n) |
| A2 | Waitlist Allocation | Auto-assigns cancelled slots | O(k) |
| A3 | Role-Based Approval Routing | Routes booking to the right approver | O(1) |
| A4 | QR Check-In Validation | Verifies QR and processes check-in | O(1) |
| A5 | Resource Search & Filtering | Finds resources matching criteria | O(n) |
| A6 | Real-Time Notification Dispatch | Sends instant update to listeners | O(w) |
| A7 | Session Validation | Verifies user identity on every request | O(1) |
| A8 | Offline Sync Queue | Stores and replays offline actions | O(m) |

---

## 2. A1 — Booking Conflict Detection

### Purpose
When a user attempts to book a resource for a specific time slot, this algorithm checks whether the slot is already occupied. If a conflict exists, the booking is rejected immediately — never allowed to persist.

### Pseudocode

```
FUNCTION attemptBooking(resourceId, date, startTime, endTime, requesterId, purpose):
    BEGIN TRANSACTION

    // Step 1: Verify resource exists and is active
    resource = SELECT * FROM resources
               WHERE id = resourceId AND is_active = true
    IF resource IS NULL:
        ROLLBACK
        RETURN ERROR("Resource not found or inactive")

    // Step 2: Verify the requested slot falls within the resource's schedule
    dayOfWeek = getDayOfWeek(date)         // e.g., "monday"
    schedule = resource.schedule[dayOfWeek]
    IF schedule.active != true:
        ROLLBACK
        RETURN ERROR("Resource is closed on this day")
    IF startTime < schedule.open OR endTime > schedule.close:
        ROLLBACK
        RETURN ERROR("Booking outside resource availability hours")

    // Step 3: Acquire exclusive row lock on all potentially conflicting bookings
    // This is the CRITICAL step — it prevents race conditions
    conflicting = SELECT id FROM bookings
                  WHERE resource_id = resourceId
                    AND date = date
                    AND start_time < endTime    // overlap condition
                    AND end_time > startTime    // overlap condition
                    AND status IN ('pending', 'confirmed')
                  FOR UPDATE OF bookings      // row-level lock

    IF conflicting IS NOT EMPTY:
        ROLLBACK
        RETURN CONFLICT("This slot is already booked")

    // Step 4: Insert the new booking
    bookingId = genUUID()
    INSERT INTO bookings (
        id, resource_id, requester_id, status,
        date, start_time, end_time, purpose,
        created_by, created_at
    ) VALUES (
        bookingId, resourceId, requesterId, 'pending',
        date, startTime, endTime, purpose,
        requesterId, NOW()
    )

    // Step 5: Log the action in audit trail
    INSERT INTO audit_logs (booking_id, user_id, action, details)
    VALUES (bookingId, requesterId, 'booking_created',
            'Booked ' || resourceId || ' on ' || date || ' ' || startTime || '-' || endTime)

    COMMIT

    // Step 6: Check if approval is needed
    IF requester.role == 'student' AND resource.type IN ('auditorium', 'lab'):
        // Auto-route to faculty for approval
        RETURN SUCCESS(bookingId, status='pending')
    ELSE:
        // Auto-confirm for simple bookings
        UPDATE bookings SET status='confirmed' WHERE id = bookingId
        RETURN SUCCESS(bookingId, status='confirmed')

END FUNCTION
```

### Overlap Condition Explained

Two time ranges overlap if and only if:
- The new booking starts before the existing one ends, AND
- The existing booking starts before the new one ends.

Diagram:
```
Existing:  |------|
New:          |--|     → OVERLAP (start < existing.end AND existing.start < end)
New:    |---|          → NO OVERLAP
New:    |-------|       → OVERLAP (partial overlap)
New:  |---|             → OVERLAP (new starts during existing)
Existing: |------|
New:                 |---|  → NO OVERLAP
```

Formula: `newStart < existingEnd AND existingStart < newEnd`

### Why `SELECT FOR UPDATE` Works

1. `BEGIN TRANSACTION` starts a serializable operation
2. `SELECT ... FOR UPDATE` acquires a **row-level lock** on every matching booking row
3. If another session already holds a lock on those rows, this session **waits**
4. Once it gets the lock, no other transaction can modify those rows until `COMMIT`
5. This guarantees that the conflict check and the insert happen atomically — no double booking is possible

### Failure Cases

| Case | Error Returned |
|------|---------------|
| Resource doesn't exist | `"Resource not found or inactive"` |
| Resource closed that day | `"Resource is closed on this day"` |
| Slot outside hours | `"Booking outside resource availability hours"` |
| Same slot already booked | `"This slot is already booked"` |
| Database error | `"An unexpected error occurred. Please try again."` |

---

## 3. A2 — Waitlist Allocation

### Purpose
When a booking is cancelled or rejected, this algorithm finds the next user on the waitlist for that exact resource+date+time slot and offers them the slot automatically.

### Pseudocode

```
FUNCTION processWaitlist(cancelledBookingId):
    booking = SELECT * FROM bookings WHERE id = cancelledBookingId
    IF booking IS NULL OR booking.status != 'cancelled':
        RETURN  // Nothing to process

    // Step 1: Find the next eligible waitlist entry
    // Ordered by position (FIFO), must match exact resource+date+time
    nextEntry = SELECT * FROM waitlist
                WHERE resource_id = booking.resource_id
                  AND date = booking.date
                  AND start_time = booking.start_time
                  AND end_time = booking.end_time
                  AND status = 'waiting'
                ORDER BY position ASC
                LIMIT 1

    IF nextEntry IS NULL:
        RETURN  // No one waiting for this slot

    // Step 2: Offer the slot to the next waitlisted user
    UPDATE waitlist
    SET status = 'offered',
        offered_at = NOW(),
        expires_at = NOW() + interval '15 minutes',
        booking_id = NULL   // new booking will be created separately
    WHERE id = nextEntry.id

    // Step 3: Log the action
    INSERT INTO audit_logs (booking_id, user_id, action, details)
    VALUES (cancelledBookingId, nextEntry.user_id, 'waitlist_offered',
            'Offered slot for ' || booking.resource_id || ' on ' || booking.date)

    // Step 4: Notify the waitlisted user in real-time
    PUSH_NOTIFICATION(
        userId = nextEntry.user_id,
        type = 'waitlist_offered',
        message = 'A slot opened for ' || booking.resource_id ||
                  ' on ' || booking.date || '. Accept within 15 minutes.',
        data = {
            resource_id: booking.resource_id,
            date: booking.date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            offer_expires_at: nextEntry.expires_at,
            waitlist_entry_id: nextEntry.id
        }
    )

END FUNCTION
```

### Acceptance Timeout

After 15 minutes, if the waitlisted user hasn't accepted:

```
FUNCTION expireWaitlistOffer():
    expiredEntries = SELECT * FROM waitlist
                     WHERE status = 'offered'
                       AND expires_at < NOW()

    FOR EACH entry IN expiredEntries:
        UPDATE waitlist SET status = 'expired' WHERE id = entry.id
        PUSH_NOTIFICATION(
            userId = entry.user_id,
            type = 'waitlist_expired',
            message = 'The slot offer for ' || entry.resource_id ||
                      ' has expired. We moved on to the next person.'
        )

        // Re-process: try the next person in line
        processWaitlistForSlot(entry.resource_id, entry.date,
                               entry.start_time, entry.end_time)
    END FOR
END FUNCTION
```

### Waitlist Processing on Slot Opening

This is the recursive variant called when either:
1. The offer expires and the next person needs a turn
2. A new cancellation occurs mid-process

```
FUNCTION processWaitlistForSlot(resourceId, date, startTime, endTime):
    nextEntry = SELECT * FROM waitlist
                WHERE resource_id = resourceId
                  AND date = date
                  AND start_time = startTime
                  AND end_time = endTime
                  AND status = 'waiting'
                ORDER BY position ASC
                LIMIT 1

    IF nextEntry IS NULL:
        RETURN  // No more people waiting

    // Mark current waitlist entry as offered
    UPDATE waitlist SET status = 'offered', offered_at = NOW(),
                       expires_at = NOW() + interval '15 minutes'
    WHERE id = nextEntry.id

    // Notify the user
    PUSH_NOTIFICATION(nextEntry.user_id, 'waitlist_offered', ...)
END FUNCTION
```

### Waitlist Positioning

When a user joins a waitlist:

```
FUNCTION joinWaitlist(resourceId, userId, date, startTime, endTime):
    // Get current waitlist size for this slot
    currentCount = SELECT COUNT(*) FROM waitlist
                   WHERE resource_id = resourceId
                     AND date = date
                     AND start_time = startTime
                     AND end_time = endTime
                     AND status IN ('waiting', 'offered')

    INSERT INTO waitlist (
        id, resource_id, user_id, date,
        start_time, end_time,
        position, status, created_at
    ) VALUES (
        genUUID(), resourceId, userId, date,
        startTime, endTime,
        currentCount + 1, 'waiting', NOW()
    )

    RETURN position: currentCount + 1
END FUNCTION
```

---

## 3A. Waitlist Acceptance Flow

When a waitlisted user accepts the offer:

```
FUNCTION acceptWaitlistOffer(waitlistEntryId):
    entry = SELECT * FROM waitlist WHERE id = waitlistEntryId
    IF entry.status != 'offered':
        RETURN ERROR("No active offer to accept")
    IF entry.expires_at < NOW():
        UPDATE waitlist SET status = 'expired' WHERE id = waitlistEntryId
        processWaitlistForSlot(entry.resource_id, entry.date,
                               entry.start_time, entry.end_time)
        RETURN ERROR("Offer expired")

    // Create a new booking from the waitlist offer
    INSERT INTO bookings (
        id, resource_id, requester_id, status,
        date, start_time, end_time, purpose,
        waitlist_position, waitlist_offered_at,
        created_by, created_at
    ) VALUES (
        genUUID(), entry.resource_id, entry.user_id, 'confirmed',
        entry.date, entry.start_time, entry.end_time,
        'Waitlist acceptance', entry.position, entry.offered_at,
        entry.user_id, NOW()
    )

    // Mark waitlist entry as confirmed
    UPDATE waitlist SET status = 'confirmed' WHERE id = waitlistEntryId

    // Log
    INSERT INTO audit_logs (booking_id, user_id, action, details)
    VALUES (last_insert_id, entry.user_id, 'waitlist_accepted',
            'Accepted waitlist offer for slot')

    // Notify the waitlisted user
    PUSH_NOTIFICATION(entry.user_id, 'booking_confirmed',
                      'Your waitlist offer was accepted!')

    // Update positions for remaining waitlist entries
    UPDATE waitlist SET position = position - 1
    WHERE resource_id = entry.resource_id
      AND date = entry.date
      AND start_time = entry.start_time
      AND end_time = entry.end_time
      AND status = 'waiting'
      AND position > entry.position

    RETURN SUCCESS
END FUNCTION
```

---

## 4. A3 — Role-Based Approval Routing

### Purpose
When a booking is created, determine whether it needs manual approval and route it to the correct person.

### Algorithm

```
FUNCTION routeBookingForApproval(booking, resource, requester):
    // RULES (in priority order):
    // 1. If requester is Admin → auto-confirm
    // 2. If requester is Faculty booking their department's resource → auto-confirm
    // 3. If requester is Faculty booking another department's resource → route to that dept's admin
    // 4. If requester is Student booking a classroom → auto-confirm
    // 5. If requester is Student booking a lab/auditorium → route to faculty

    IF requester.role == 'admin':
        CONFIRM booking immediately
        RETURN 'auto_confirmed'

    IF requester.role == 'faculty':
        IF resource.department == requester.department:
            CONFIRM booking immediately
            RETURN 'auto_confirmed'
        ELSE:
            ROUTE to resource.department's admin
            SET booking.status = 'pending'
            RETURN 'routed_to_admin'

    IF requester.role == 'student':
        IF resource.type == 'classroom':
            CONFIRM booking immediately
            RETURN 'auto_confirmed'
        ELSE IF resource.type IN ('lab', 'auditorium', 'equipment'):
            // Route to department faculty
            ROUTE to all faculty in resource.department
            SET booking.status = 'pending'
            RETURN 'routed_to_faculty'

    // Default fallback
    SET booking.status = 'pending'
    RETURN 'routed_to_admin'
END FUNCTION
```

### Routing Diagram

```
Student books classroom → auto-confirmed (no approval needed)
Student books lab      → → Faculty approval → confirmed
Student books auditorium → → Faculty approval → confirmed
Faculty books own dept → → auto-confirmed
Faculty books other dept → → Admin approval → confirmed
Admin books anything   → → auto-confirmed
```

---

## 5. A4 — QR Check-In Validation

### Purpose
When a user scans a QR code at the resource location, validate the QR payload and transition the booking to Completed.

### Algorithm

```
FUNCTION processCheckIn(bookingId, checkinToken, scannerUserId):
    BEGIN TRANSACTION

    // Step 1: Fetch the booking with lock
    booking = SELECT * FROM bookings
              WHERE id = bookingId
              FOR UPDATE OF bookings

    // Step 2: Validate booking exists
    IF booking IS NULL:
        ROLLBACK
        RETURN ERROR("Booking not found")

    // Step 3: Validate status must be CONFIRMED
    IF booking.status != 'confirmed':
        ROLLBACK
        RETURN ERROR("Only confirmed bookings can be checked in")

    // Step 4: Validate date is today (with 1-hour grace)
    IF booking.date != TODAY() AND booking.date != TODAY() - interval '1 day':
        ROLLBACK
        RETURN ERROR("QR code is not valid for today")

    // Step 5: Validate time window (with 15-min grace period)
    currentTime = NOW()::time
    IF currentTime < booking.start_time - interval '15 minutes':
        ROLLBACK
        RETURN ERROR("Check-in window opens in " ||
                     format_minutes(booking.start_time - currentTime) || " minutes")
    IF currentTime > booking.end_time + interval '15 minutes':
        ROLLBACK
        RETURN ERROR("Check-in window has closed for this booking")

    // Step 6: Validate single-use token
    IF booking.checkin_token IS NULL:
        ROLLBACK
        RETURN ERROR("This booking has already been checked in")
    IF booking.checkin_token != checkinToken:
        ROLLBACK
        RETURN ERROR("Invalid check-in token")

    // Step 7: Invalidate the token (prevents reuse)
    UPDATE bookings
    SET status = 'completed',
        checkin_token = NULL,
        checked_in_at = NOW(),
        updated_at = NOW()
    WHERE id = bookingId

    // Step 8: Log the check-in
    INSERT INTO audit_logs (booking_id, user_id, action, details, ip_address)
    VALUES (bookingId, scannerUserId, 'qr_checkin_success',
            'Checked in at resource ' || booking.resource_id ||
            ' on ' || booking.date || ' ' || booking.start_time || '-' || booking.end_time,
            get_client_ip())

    // Step 9: If there's a waitlist for this resource+date+time,
    // process the next person in line
    CALL processWaitlistForSlot(
        booking.resource_id, booking.date,
        booking.start_time, booking.end_time
    )

    COMMIT
    RETURN SUCCESS("Checked in successfully")

END FUNCTION
```

### Grace Period Logic

```
Check-in window = [start_time - 15min, end_time + 15min]

Example:
Booking: 10:00 - 12:00
Valid check-in window: 09:45 - 12:15

- Scanning at 09:30 → ERROR ("check-in window opens in 15 minutes")
- Scanning at 10:05 → SUCCESS → status = completed
- Scanning at 12:10 → SUCCESS → status = completed
- Scanning at 12:30 → ERROR ("check-in window has closed")
- Scanning again after 12:10 → ERROR ("already checked in")  ← token NULL now
```

---

## 6. A5 — Resource Search & Filtering

### Purpose
Given search parameters from the user, return matching resources sorted by relevance.

### Algorithm

```
FUNCTION searchResources(filters, user):
    baseQuery = "SELECT * FROM resources WHERE is_active = true"
    params = []
    paramIndex = 1

    // Step 1: Apply type filter
    IF filters.type IS NOT NULL:
        baseQuery += " AND type = $" + paramIndex
        params.append(filters.type)
        paramIndex++

    // Step 2: Apply location text search (ILIKE for case-insensitive match)
    IF filters.location IS NOT NULL AND filters.location != "":
        baseQuery += " AND location ILIKE $" + paramIndex
        params.append("%" + filters.location + "%")
        paramIndex++

    // Step 3: Apply capacity minimum filter
    IF filters.minCapacity IS NOT NULL:
        baseQuery += " AND capacity >= $" + paramIndex
        params.append(filters.minCapacity)
        paramIndex++

    // Step 4: RLS — restrict visibility by user role
    IF user.role != 'admin':
        // Students and faculty see only active resources
        // Faculty additionally see their own department's resources first
        baseQuery += " AND is_active = true"

    // Step 5: Apply text search on name
    IF filters.q IS NOT NULL AND filters.q != "":
        baseQuery += " AND (name ILIKE $" + paramIndex ||
                     " OR description ILIKE $" + paramIndex + ")"
        params.append("%" + filters.q + "%")
        paramIndex++

    // Step 6: Sort by relevance
    // 1. Resources matching the name exactly first
    // 2. Then by type match
    // 3. Then alphabetically
    baseQuery += " ORDER BY "
    IF filters.q IS NOT NULL:
        baseQuery += "(name ILIKE '" + filters.q + "') DESC, "
    baseQuery += "type, name ASC"

    // Step 7: Apply pagination
    baseQuery += " LIMIT $" + paramIndex
    params.append(filters.limit || 20)
    paramIndex++
    IF filters.page > 1:
        baseQuery += " OFFSET $" + paramIndex
        params.append((filters.page - 1) * (filters.limit || 20))

    // Step 8: Execute query (RLS automatically applied by Supabase)
    results = EXECUTE_QUERY(baseQuery, params)

    // Step 9: For each result, calculate current availability for the given date
    IF filters.date IS NOT NULL:
        FOR EACH resource IN results:
            // Count how many time slots are already booked in a day (e.g., by hour)
            bookedSlots = SELECT COUNT(*) FROM bookings
                          WHERE resource_id = resource.id
                            AND date = filters.date
                            AND status IN ('pending', 'confirmed')
            resource.availability = resource.total_slots - bookedSlots
            resource.is_available = (bookedSlots < resource.total_slots)
        END FOR

    RETURN results
END FUNCTION
```

### Overlap Detection in Availability Calculation

When calculating how many slots a resource has free on a given date, the algorithm considers a "slot" as a discrete time block (e.g., 30-minute or 1-hour intervals based on the resource's schedule).

```
FUNCTION calculateAvailability(resource, date):
    daySchedule = resource.schedule[getDayOfWeek(date)]
    IF daySchedule.active != true:
        RETURN 0  // Resource is closed that day

    totalSlots = divideRange(daySchedule.open, daySchedule.close, interval '1 hour')
    bookedCount = SELECT COUNT(*) FROM bookings
                  WHERE resource_id = resource.id
                    AND date = date
                    AND status IN ('pending', 'confirmed')
                    AND start_time >= daySchedule.open
                    AND end_time <= daySchedule.close

    // Use the conflict detection overlap formula to avoid counting overlapping
    // bookings as two separate usages
    actualBooked = SELECT COUNT(DISTINCT time_slot) FROM (
        SELECT generate_series(
            start_time, end_time, interval '1 hour'
        ) AS time_slot
        FROM bookings
        WHERE resource_id = resource.id
          AND date = date
          AND status IN ('pending', 'confirmed')
    ) AS slots

    RETURN totalSlots - actualBooked
END FUNCTION
```

---

## 7. A6 — Real-Time Notification Dispatch

### Purpose
When any booking's status changes, notify all affected users instantly without polling.

### Algorithm

```
FUNCTION dispatchBookingNotification(bookingId, oldStatus, newStatus):
    booking = SELECT * FROM bookings WHERE id = bookingId

    // Step 1: Determine who needs to be notified
    affectedUsers = []

    IF newStatus == 'confirmed':
        // The person who requested the booking gets notified
        affectedUsers.append(booking.requester_id)

    IF oldStatus == 'pending' AND newStatus == 'confirmed':
        // The person who approved it also knows (optional log)
        // admin/faculty who approved already know from their action
        pass

    IF oldStatus == 'pending' AND newStatus == 'cancelled':
        // The requester got rejected
        affectedUsers.append(booking.requester_id)

        // If they were on a waitlist elsewhere, no action needed here
        // If they need to retry, they'll see it on their dashboard

    IF oldStatus == 'confirmed' AND newStatus == 'completed':
        // Booking completed — no notification needed (user just checked in)
        pass

    IF oldStatus == 'cancelled' AND newStatus was never 'cancelled':
        // This case handled by waitlist allocation instead
        pass

    // Step 2: Push notifications to each affected user
    FOR EACH userId IN affectedUsers:
        notificationId = genUUID()
        INSERT INTO notifications (
            id, user_id, booking_id, type, message, read
        ) VALUES (
            notificationId, userId, bookingId,
            'booking_' || newStatus,
            getNotificationMessage(bookingId, newStatus),
            false
        )

        // Step 3: Real-time broadcast via Supabase Realtime channel
        broadcastEvent(channel = 'notifications:' || userId, event = {
            type: 'new_notification',
            notification: {
                id: notificationId,
                booking_id: bookingId,
                type: 'booking_' || newStatus,
                message: getNotificationMessage(bookingId, newStatus),
                timestamp: NOW()
            }
        })

        // Step 4: Optionally send email (async, non-blocking)
        IF user.prefers_email_notifications:
            ENQUEUE_EMAIL(userId,
                subject = 'Booking ' || newStatus,
                body = getEmailBody(bookingId))
    END FOR

    // Step 5: Also notify any users watching this resource's calendar
    // (e.g., faculty who have this resource on their schedule)
    followers = SELECT user_id FROM resource_followers
                WHERE resource_id = booking.resource_id
    FOR EACH followerId IN followers:
        IF followerId NOT IN affectedUsers:
            broadcastEvent(channel = 'notifications:' || followerId, event = {
                type: 'resource_update',
                resource_id: booking.resource_id,
                booking_id: bookingId,
                status: newStatus
            })
        END IF
    END FOR

END FUNCTION

// Helper: Generate human-readable notification message
FUNCTION getNotificationMessage(bookingId, status):
    booking = SELECT * FROM bookings WHERE id = bookingId
    resource = SELECT * FROM resources WHERE id = booking.resource_id

    SWITCH status:
        CASE 'confirmed':
            RETURN "Your booking for " || resource.name ||
                   " on " || booking.date || " is confirmed"
        CASE 'rejected':
            RETURN "Your booking for " || resource.name ||
                   " on " || booking.date || " was rejected"
        CASE 'cancelled':
            RETURN "Your booking for " || resource.name ||
                   " on " || booking.date || " was cancelled"
        CASE 'completed':
            RETURN "Booking for " || resource.name ||
                   " on " || booking.date || " is marked complete"
        DEFAULT:
            RETURN "Booking status updated to " || status
    END SWITCH
END FUNCTION
```

---

## 8. A7 — Session Validation

### Purpose
On every API request that requires authentication, verify the user's session is valid and extract their identity and role.

### Algorithm

```
FUNCTION validateSession(request):
    // Step 1: Extract token from Authorization header
    authHeader = request.headers.get("Authorization")
    IF authHeader IS NULL OR NOT authHeader.startsWith("Bearer "):
        THROW 401("Missing or invalid Authorization header")

    token = authHeader.substring(7)  // Remove "Bearer " prefix

    // Step 2: Verify token with Supabase Auth
    user = supabase.auth.getUser(token)
    IF user IS NULL OR user.error IS NOT NULL:
        THROW 401("Invalid or expired session token")

    // Step 3: Fetch user profile from database (for role and department)
    userProfile = SELECT id, email, role, name, department
                  FROM users WHERE id = user.id
    IF userProfile IS NULL:
        // Token is valid but user doesn't exist in our DB (shouldn't happen)
        THROW 403("User not registered in system")

    // Step 4: Attach user context to the request for downstream use
    request.user = {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        name: userProfile.name,
        department: userProfile.department
    }

    RETURN request  // Modified with user context
END FUNCTION

// Middleware usage in every API route:
FUNCTION apiHandler(request):
    userRequest = validateSession(request)

    // Route to the appropriate handler based on URL and method
    // The handler now has access to userRequest.user.id, userRequest.user.role, etc.
END FUNCTION
```

### Token Validation Time Complexity

The session validation involves:
1. **String operations** on the Authorization header → O(1)
2. **Supabase JWT verification** → O(1) (uses cached JWT public key)
3. **Database lookup** by primary key → O(1) (indexed on `id`)

Overall: **O(1)** per request.

---

## 9. A8 — Offline Sync Queue

### Purpose
When a user is offline (no network), store their intended actions locally and replay them when connectivity returns.

### Algorithm

```
// === SAVING AN ACTION OFFLINE ===

FUNCTION saveActionOffline(action):
    // action = { type: 'checkin', payload: {...} }
    action.id = genUUID()
    action.createdAt = NOW()
    action.status = 'pending'  // not yet synced

    // Store in IndexedDB
    db.offlineQueue.add(action)

    // Show offline indicator to user
    updateUI(showOfflineBanner: true)

    RETURN action.id
END FUNCTION

// === REPLAYING ACTIONS WHEN ONLINE ===

FUNCTION syncOfflineQueue():
    queue = db.offlineQueue.getAll()
    IF queue IS EMPTY:
        RETURN  // Nothing to sync

    FOR EACH action IN queue:
        TRY:
            IF action.type == 'checkin':
                response = POST /api/v1/checkin action.payload
            ELSE IF action.type == 'booking':
                response = POST /api/v1/bookings action.payload
            ELSE IF action.type == 'waitlist':
                response = POST /api/v1/waitlist action.payload

            IF response.status == 200:
                db.offlineQueue.remove(action.id)
                showToast("Synced: action completed")

            ELSE IF response.status == 409:
                // Conflict detected (e.g., slot was taken by someone else)
                db.offlineQueue.remove(action.id)
                showToast("Action failed: resource was booked by someone else")

            ELSE:
                // Other error — keep in queue for retry
                action.retryCount = (action.retryCount || 0) + 1
                IF action.retryCount >= 3:
                    db.offlineQueue.remove(action.id)
                    showToast("Action failed after 3 attempts. Please retry manually.")
                ELSE:
                    db.offlineQueue.update(action)
        CATCH network_error:
            // Still offline — will retry on next connection
            BREAK out of FOR loop  // no point continuing while offline
        END TRY
    END FOR

    IF db.offlineQueue.count() == 0:
        updateUI(showOfflineBanner: false)
END FUNCTION

// === CONFLICT DETECTION ON SYNC ===

FUNCTION resolveConflict(localAction, serverState):
    // When the server returns a conflict (e.g., booking was just taken)
    SWITCH localAction.type:
        CASE 'booking':
            IF serverState.conflictsExist:
                // Offer user the waitlist option again
                showWaitlistDialog(serverState.availableAlternatives)
            RETURN 'conflict_shown_to_user'

        CASE 'checkin':
            IF serverState.booking.status == 'completed':
                // Already checked in — no action needed
                RETURN 'already_completed'
            IF serverState.booking.status != 'confirmed':
                // Booking was cancelled by admin while offline
                showToast("Booking was cancelled before you could check in")
                RETURN 'booking_cancelled'
            RETURN 'checkin_failed'
    END SWITCH
END FUNCTION
```

### Offline Queue Storage Structure (IndexedDB)

```
IndexedDB Database: "crmp-offline"
  └── Object Store: "actionQueue"
        ├── key: actionId (auto-generated UUID)
        ├── value: {
        │     id: "uuid",
        │     type: "booking" | "checkin" | "waitlist",
        │     payload: { /* original request body */ },
        │     createdAt: ISO8601 timestamp,
        │     status: "pending" | "synced" | "failed",
        │     retryCount: 0-3
        │   }
        └── Index: "status" → "pending" (for efficient retrieval)
```

---

## 10. Algorithm Priority Summary

| Priority | Algorithm | When It Runs | Why It Matters |
|----------|-----------|-------------|----------------|
| P0 | A1 (Conflict Detection) | On every booking attempt | Core value: prevents double bookings |
| P0 | A3 (Approval Routing) | On every booking creation | Ensures the right person sees it |
| P0 | A4 (QR Check-In) | On every QR scan | Physical verification of usage |
| P0 | A7 (Session Validation) | On every API request | Security |
| P0 | A6 (Notification Dispatch) | On every status change | Users stay informed in real-time |
| P1 | A2 (Waitlist Allocation) | On cancellation/rejection | Maximizes resource utilization |
| P1 | A5 (Resource Search) | On every search/scroll | Makes resources discoverable |
| P1 | A8 (Offline Sync) | On reconnection | Handles poor campus connectivity |

---

## 11. Algorithm Interaction Diagram

```
User clicks "Book"
  │
  ▼
A3 (Approval Routing) → determines if approval needed
  │
  ▼
A1 (Conflict Detection) → SELECT FOR UPDATE, checks for overlap
  │
  ├──→ CONFLICT → A2 (offer waitlist option)
  │       User joins waitlist
  │       Later: someone cancels → A2 triggers → waitlist offer
  │       User accepts → new booking → back to A1
  │
  ├──→ NO CONFLICT + needs approval → A6 (notify approver)
  │       Approver approves → booking.confirmed → A6 (notify requester)
  │
  └──→ NO CONFLICT + auto-confirmed → A6 (notify requester)
          │
          │  (later)
          ▼
          User scans QR → A4 (validate check-in)
          │
          ├──→ SUCCESS → A6 (notify observers) → A2 (process waitlist for slot)
          │
          └──→ FAIL → A6 (notify user of failure reason)
```

---

*End of Algorithms Document*