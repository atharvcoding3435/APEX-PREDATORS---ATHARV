import type { Booking, BookingAlternative, BookingRequest, BookingStatus, Resource, UserRole } from "@/lib/types";

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["pending", "approved", "active"];
export const MAX_BOOKING_DURATION_MINUTES = 240;
const SLOT_STEP_MINUTES = 30;
const BUSINESS_OPEN = "08:00";
const BUSINESS_CLOSE = "18:00";

type ConflictInput = Pick<BookingRequest, "resourceId" | "date" | "startTime" | "endTime">;

type BookingValidationResult = {
  valid: boolean;
  errors: string[];
};

export function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export function isActiveBookingStatus(status: BookingStatus) {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTime(time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteText} ${suffix}`;
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export function getDurationMinutes(startTime: string, endTime: string) {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

export function isPastSlot(date: string, endTime: string, now = new Date()) {
  const slotEnd = new Date(`${date}T${endTime}:00`);
  return Number.isNaN(slotEnd.getTime()) || slotEnd.getTime() < now.getTime();
}

export function validateBookingRequest(input: ConflictInput, now = new Date()): BookingValidationResult {
  const errors: string[] = [];
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^\d{2}:\d{2}$/;

  if (!datePattern.test(input.date)) {
    errors.push("Choose a valid booking date.");
  }

  if (!timePattern.test(input.startTime) || !timePattern.test(input.endTime)) {
    errors.push("Choose valid start and end times.");
  }

  if (timePattern.test(input.startTime) && timePattern.test(input.endTime)) {
    const duration = getDurationMinutes(input.startTime, input.endTime);

    if (duration <= 0) {
      errors.push("End time must be after start time.");
    }

    if (duration > MAX_BOOKING_DURATION_MINUTES) {
      errors.push("Booking duration cannot exceed 4 hours.");
    }

    if (isPastSlot(input.date, input.endTime, now)) {
      errors.push("Booking cannot be made for a past time slot.");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function findBookingConflict(input: ConflictInput, existingBookings: Booking[]) {
  return existingBookings.find(
    (booking) =>
      booking.resourceId === input.resourceId &&
      booking.date === input.date &&
      isActiveBookingStatus(booking.status) &&
      timesOverlap(input.startTime, input.endTime, booking.startTime, booking.endTime)
  );
}

export function getSlotStatus(input: ConflictInput, existingBookings: Booking[], now = new Date()) {
  if (isPastSlot(input.date, input.endTime, now)) {
    return "past";
  }

  const conflict = findBookingConflict(input, existingBookings);

  if (!conflict) {
    return "available";
  }

  return conflict.status === "pending" ? "pending" : "booked";
}

export function getDefaultBookingStatus(role: UserRole, resource?: Resource) {
  if (role === "admin") {
    return "approved";
  }

  if (role === "faculty" && resource?.department === "Computer Science") {
    return "approved";
  }

  if (role === "student" && resource?.type === "classroom") {
    return "approved";
  }

  return "pending";
}

function hasConflict(resourceId: string, date: string, startTime: string, endTime: string, bookings: Booking[]) {
  return Boolean(findBookingConflict({ resourceId, date, startTime, endTime }, bookings));
}

export function suggestBookingAlternatives(input: ConflictInput, resources: Resource[], bookings: Booking[]) {
  const selectedResource = resources.find((resource) => resource.id === input.resourceId);
  const duration = Math.max(SLOT_STEP_MINUTES, getDurationMinutes(input.startTime, input.endTime));
  const requestedStart = timeToMinutes(input.startTime);
  const suggestions: BookingAlternative[] = [];

  if (!selectedResource) {
    return suggestions;
  }

  const pushSuggestion = (resource: Resource, startMinutes: number, reason: string) => {
    if (suggestions.length >= 3) {
      return;
    }

    const startTime = minutesToTime(startMinutes);
    const endTime = minutesToTime(startMinutes + duration);

    if (startMinutes < timeToMinutes(BUSINESS_OPEN) || startMinutes + duration > timeToMinutes(BUSINESS_CLOSE)) {
      return;
    }

    if (hasConflict(resource.id, input.date, startTime, endTime, bookings)) {
      return;
    }

    if (suggestions.some((suggestion) => suggestion.resourceId === resource.id && suggestion.startTime === startTime)) {
      return;
    }

    suggestions.push({
      id: `${resource.id}-${startTime}-${endTime}`,
      label: `${resource.name} (${formatTimeRange(startTime, endTime)})`,
      resourceId: resource.id,
      resourceName: resource.name,
      startTime,
      endTime,
      reason
    });
  };

  for (let start = requestedStart - duration; start >= timeToMinutes(BUSINESS_OPEN); start -= SLOT_STEP_MINUTES) {
    pushSuggestion(selectedResource, start, "Earlier available slot");
    if (suggestions.length >= 1) break;
  }

  for (let start = requestedStart + duration; start + duration <= timeToMinutes(BUSINESS_CLOSE); start += SLOT_STEP_MINUTES) {
    pushSuggestion(selectedResource, start, "Next available slot");
    if (suggestions.some((suggestion) => suggestion.reason === "Next available slot")) break;
  }

  const similarResources = resources
    .filter((resource) => resource.id !== selectedResource.id)
    .filter((resource) => resource.type === selectedResource.type)
    .filter((resource) => resource.capacity >= Math.max(1, selectedResource.capacity * 0.75))
    .sort((a, b) => {
      const departmentScoreA = a.department === selectedResource.department ? 0 : 1;
      const departmentScoreB = b.department === selectedResource.department ? 0 : 1;
      return departmentScoreA - departmentScoreB || a.capacity - b.capacity;
    });

  for (const resource of similarResources) {
    pushSuggestion(resource, requestedStart, resource.department === selectedResource.department ? "Similar resource in same department" : "Similar resource");
  }

  return suggestions.slice(0, 3);
}
