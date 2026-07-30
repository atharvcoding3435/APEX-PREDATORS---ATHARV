import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BookingStatus, Resource } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resourceStatusTone(status: Resource["status"]) {
  if (status === "available") {
    return "bg-signal-success/15 text-signal-success";
  }

  if (status === "pending") {
    return "bg-signal-warning/15 text-signal-warning";
  }

  return "bg-signal-danger/15 text-signal-danger";
}

export function bookingStatusTone(status: BookingStatus) {
  if (status === "approved" || status === "active") {
    return "bg-signal-success/15 text-signal-success";
  }

  if (status === "pending") {
    return "bg-signal-warning/15 text-signal-warning";
  }

  if (status === "cancelled") {
    return "bg-signal-danger/15 text-signal-danger";
  }

  return "bg-signal-info/15 text-signal-info";
}
