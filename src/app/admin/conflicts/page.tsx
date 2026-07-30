"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Shuffle, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { bookings as initialBookings, resources as initialResources } from "@/lib/mock-data";
import { findBookingConflict, formatTimeRange, suggestBookingAlternatives } from "@/lib/booking-rules";
import type { Booking, BookingStatus, Resource } from "@/lib/types";

export default function AdminConflictsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [resources, setResources] = useState<Resource[]>(initialResources);

  useEffect(() => {
    async function loadData() {
      const [bookingResponse, resourceResponse] = await Promise.all([
        fetch("/api/v1/bookings"),
        fetch("/api/v1/resources")
      ]);
      const [bookingPayload, resourcePayload] = await Promise.all([
        bookingResponse.json(),
        resourceResponse.json()
      ]);

      if (Array.isArray(bookingPayload.data)) setBookings(bookingPayload.data);
      if (Array.isArray(resourcePayload.data)) setResources(resourcePayload.data);
    }

    loadData().catch(() => undefined);
  }, []);

  const conflicts = useMemo(
    () =>
      bookings
        .map((booking) => ({
          booking,
          resource: resources.find((resource) => resource.id === booking.resourceId),
          conflict: findBookingConflict(booking, bookings.filter((item) => item.id !== booking.id))
        }))
        .filter((item) => item.conflict),
    [bookings, resources]
  );

  function updateStatus(bookingId: string, status: BookingStatus) {
    setBookings((current) => current.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)));
    fetch("/api/v1/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bookingId, status })
    }).catch(() => undefined);
  }

  function reschedule(booking: Booking) {
    const suggestion = suggestBookingAlternatives(booking, resources, bookings)[0];

    if (!suggestion) {
      updateStatus(booking.id, "rejected");
      return;
    }

    const updatedBooking = { ...booking, resourceId: suggestion.resourceId, startTime: suggestion.startTime, endTime: suggestion.endTime };

    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? updatedBooking
          : item
      )
    );
    fetch("/api/v1/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: booking.id,
        resourceId: suggestion.resourceId,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime
      })
    }).catch(() => undefined);
  }

  return (
    <AppShell
      active="/admin/conflicts"
      eyebrow="Conflict center"
      title="Resolve booking conflicts"
      description="Review overlapping requests, compare the affected bookings, and resolve conflicts with clear admin actions."
    >
      <section className="mb-5 rounded-lg border border-signal-warning/30 bg-signal-warning/10 p-4">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-1 shrink-0 text-signal-warning" size={22} aria-hidden="true" />
          <div>
            <h3 className="text-xl font-black text-signal-warning">{conflicts.length} conflicts detected</h3>
            <p className="mt-1 text-sm text-[#F5E4C3]">
              Pending, approved, and active bookings are compared using the overlap rule. Resolve one request at a time to keep the schedule clean.
            </p>
          </div>
        </div>
      </section>

      {conflicts.length > 0 ? (
        <section className="grid gap-4">
          {conflicts.map(({ booking, resource, conflict }) => {
            if (!conflict) return null;
            const conflictingResource = resources.find((resource) => resource.id === conflict.resourceId);
            const suggestions = suggestBookingAlternatives(booking, resources, bookings);

            return (
              <article key={`${booking.id}-${conflict.id}`} className="rounded-lg border border-white/10 bg-ink-900 p-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_1fr_280px]">
                  <section className="rounded border border-signal-warning/30 bg-signal-warning/10 p-4">
                    <p className="text-xs font-black uppercase text-signal-warning">Requested booking</p>
                    <h3 className="mt-2 text-xl font-black">{resource?.name ?? "Unknown resource"}</h3>
                    <p className="text-sm text-[#F5E4C3]">{booking.requester} · {booking.department}</p>
                    <p className="mt-3 font-bold">{booking.date}, {formatTimeRange(booking.startTime, booking.endTime)}</p>
                    <div className="mt-3"><StatusBadge kind="booking" status={booking.status} /></div>
                  </section>

                  <section className="rounded border border-signal-danger/30 bg-signal-danger/10 p-4">
                    <p className="text-xs font-black uppercase text-signal-danger">Conflicting booking</p>
                    <h3 className="mt-2 text-xl font-black">{conflictingResource?.name ?? "Unknown resource"}</h3>
                    <p className="text-sm text-[#F3D4D4]">{conflict.requester} · {conflict.department}</p>
                    <p className="mt-3 font-bold">{conflict.date}, {formatTimeRange(conflict.startTime, conflict.endTime)}</p>
                    <div className="mt-3"><StatusBadge kind="booking" status={conflict.status} /></div>
                  </section>

                  <section className="rounded border border-white/10 bg-ink-850 p-4">
                    <p className="text-sm font-black">Suggested resolution</p>
                    <p className="mt-2 text-sm text-[#A0A0B8]">
                      {suggestions[0]?.label ?? "Reject the lower-priority request or manually reschedule after checking availability."}
                    </p>
                    <div className="mt-4 grid gap-2">
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-signal-success px-3 text-sm font-bold text-ink-950" onClick={() => updateStatus(booking.id, "approved")}>
                        <Check size={17} aria-hidden="true" />
                        Approve Requested
                      </button>
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-signal-danger/40 bg-signal-danger/10 px-3 text-sm font-bold text-signal-danger" onClick={() => updateStatus(conflict.id, "rejected")}>
                        <X size={17} aria-hidden="true" />
                        Reject Conflict
                      </button>
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 text-sm font-bold hover:bg-white/10" onClick={() => reschedule(booking)}>
                        <Shuffle size={17} aria-hidden="true" />
                        Reschedule
                      </button>
                    </div>
                  </section>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-white/20 bg-ink-900 p-8 text-center">
          <h3 className="text-xl font-black">No conflicts to resolve</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#A0A0B8]">
            The active booking schedule is clean. New conflicts will appear here when overlapping requests are detected.
          </p>
        </section>
      )}
    </AppShell>
  );
}
