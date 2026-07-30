# UI/UX Design Doc - Resourcify

**Last Updated:** 2026-07-31

## Design Direction

Resourcify uses a dark, operational dashboard style for repeated campus workflows. The UI should be dense enough for administrators, but still readable for students and faculty.

## Design Tokens

| Token | Value |
|---|---|
| Background | `#0F0F1A` |
| Surface | `#1A1A2E` |
| Elevated Surface | `#2A2A4E` |
| Text | `#FFFFFF` |
| Muted Text | `#A0A0B8` |
| Success | `#00FF88` |
| Warning | `#FFAA00` |
| Danger | `#FF4444` |
| Info | `#0088FF` |
| Radius | 8px cards, 4px controls |

## Core Screens

### Dashboard

- Resource availability summary
- Pending approval count
- Approved and active booking counts
- Waitlist demand
- Upcoming bookings list
- Resource utilization preview

### Public Resources

- Search
- Type filters
- Status filters
- Resource cards
- Availability status
- Book/view action
- No admin management controls

### Admin Resources

- Search and filters
- Resource table
- Add Resource action
- Edit action
- Deactivate/reactivate action
- Active/inactive status
- Confirmation dialog before deactivation

### Booking Form

- Resource selector
- Date and time inputs
- Requester role selector
- Purpose field
- Real-time availability card
- Color-coded booking calendar
- Conflict alert
- Suggested alternatives
- Booking preview after successful submit

### Booking Detail

- Booking metadata
- Status badge
- Resource location and schedule
- Cancel action where allowed
- Lifecycle timeline

## Responsive Behavior

- Desktop: sidebar plus main work area.
- Tablet: stacked content with comfortable tap targets.
- Mobile: bottom navigation, single-column cards, forms with full-width controls.

## Accessibility

- Buttons use clear labels or titles.
- Alerts use status/alert regions where appropriate.
- Color is paired with text status.
- Inputs have visible labels.
