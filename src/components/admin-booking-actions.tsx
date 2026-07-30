"use client";

import { useState } from "react";
import { CalendarClock, Check, Loader2, X } from "lucide-react";
import type { Booking, BookingStatus } from "@/lib/types";

type AdminBookingActionsProps = {
  booking: Booking;
  compact?: boolean;
  onUpdated?: (booking: Booking) => void;
  onReschedule?: (booking: Booking) => void;
};

async function updateBooking(payload: { id: string; status?: BookingStatus; date?: string; startTime?: string; endTime?: string }) {
  const response = await fetch("/api/v1/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Booking could not be updated.");
  }

  return data.data as Booking;
}

export function AdminBookingActions({ booking, compact, onUpdated, onReschedule }: AdminBookingActionsProps) {
  const [pendingAction, setPendingAction] = useState<BookingStatus | "reschedule" | null>(null);
  const [message, setMessage] = useState("");

  async function updateStatus(status: BookingStatus) {
    setPendingAction(status);
    setMessage("");

    try {
      const updated = await updateBooking({ id: booking.id, status });
      onUpdated?.(updated);
      setMessage(`${status[0].toUpperCase()}${status.slice(1)} saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking could not be updated.");
    } finally {
      setPendingAction(null);
    }
  }

  const buttonClass = compact
    ? "grid min-h-10 w-10 place-items-center rounded border text-sm font-bold"
    : "inline-flex min-h-10 items-center justify-center gap-2 rounded px-4 text-sm font-bold";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          className={`${buttonClass} border-signal-success/40 bg-signal-success/10 text-signal-success hover:bg-signal-success/20`}
          disabled={Boolean(pendingAction)}
          onClick={() => updateStatus("approved")}
          title="Approve"
          type="button"
        >
          {pendingAction === "approved" ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
          {!compact ? "Approve" : null}
        </button>
        <button
          className={`${buttonClass} border-signal-danger/40 bg-signal-danger/10 text-signal-danger hover:bg-signal-danger/20`}
          disabled={Boolean(pendingAction)}
          onClick={() => updateStatus("rejected")}
          title="Reject"
          type="button"
        >
          {pendingAction === "rejected" ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
          {!compact ? "Reject" : null}
        </button>
        <button
          className={`${buttonClass} border-white/10 bg-ink-850 hover:bg-white/5`}
          disabled={Boolean(pendingAction)}
          onClick={() => updateStatus("cancelled")}
          title="Cancel"
          type="button"
        >
          {pendingAction === "cancelled" ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
          {!compact ? "Cancel" : null}
        </button>
        {onReschedule ? (
          <button
            className={`${buttonClass} border-white/10 bg-ink-850 hover:bg-white/5`}
            disabled={Boolean(pendingAction)}
            onClick={() => onReschedule(booking)}
            title="Reschedule"
            type="button"
          >
            <CalendarClock size={17} aria-hidden="true" />
            {!compact ? "Reschedule" : null}
          </button>
        ) : null}
      </div>
      {message ? <p className="mt-2 text-xs font-bold text-[#A0A0B8]">{message}</p> : null}
    </div>
  );
}
