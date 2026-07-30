import type { Booking, Resource, UserRole } from "@/lib/types";

type BookingInput = {
  resourceId: string;
  requesterRole: UserRole;
  date: string;
  startTime: string;
  endTime: string;
};

export function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export function findBookingConflict(input: BookingInput, existingBookings: Booking[]) {
  return existingBookings.find(
    (booking) =>
      booking.resourceId === input.resourceId &&
      booking.date === input.date &&
      ["pending", "confirmed"].includes(booking.status) &&
      timesOverlap(input.startTime, input.endTime, booking.startTime, booking.endTime)
  );
}

export function getDefaultBookingStatus(role: UserRole, resource?: Resource) {
  if (role === "admin") {
    return "confirmed";
  }

  if (role === "faculty" && resource?.department === "Computer Science") {
    return "confirmed";
  }

  if (role === "student" && resource?.type === "classroom") {
    return "confirmed";
  }

  return "pending";
}
