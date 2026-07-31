"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  MapPin,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getBooking, getBookingResource } from "@/lib/mock-data";
import type { Booking, BookingStatus, Resource } from "@/lib/types";
import { titleCase } from "@/lib/utils";

function getStatusCopy(status: BookingStatus) {
  if (status === "pending") {
    return {
      icon: Clock3,
      title: "Waiting for approval",
      body: "This request is queued for faculty or admin review before the slot becomes approved."
    };
  }

  if (status === "approved") {
    return {
      icon: CheckCircle2,
      title: "Booking approved",
      body: "This booking has been approved and is ready for use during the reserved time slot."
    };
  }

  if (status === "active") {
    return {
      icon: CalendarClock,
      title: "Booking active",
      body: "This reservation is currently in progress for the approved time window."
    };
  }

  if (status === "completed") {
    return {
      icon: CheckCircle2,
      title: "Booking completed",
      body: "This booking has finished and is retained for audit and utilization history."
    };
  }

  return {
    icon: XCircle,
    title: status === "rejected" ? "Booking rejected" : "Booking cancelled",
    body: "This booking is no longer active. The slot is available for future eligible requests."
  };
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const initialBooking = getBooking(params.id) ?? null;
  const initialResource = initialBooking ? getBookingResource(initialBooking) ?? null : null;
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [resource, setResource] = useState<Resource | null>(initialResource);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadBookingDetail() {
      const [bookingResponse, resourceResponse] = await Promise.all([
        fetch("/api/v1/bookings"),
        fetch("/api/v1/resources")
      ]);
      const [bookingPayload, resourcePayload] = await Promise.all([
        bookingResponse.json(),
        resourceResponse.json()
      ]);
      const liveBooking = Array.isArray(bookingPayload.data)
        ? (bookingPayload.data as Booking[]).find((item) => item.id === params.id) ?? null
        : null;
      const liveResource = liveBooking && Array.isArray(resourcePayload.data)
        ? (resourcePayload.data as Resource[]).find((item) => item.id === liveBooking.resourceId) ?? null
        : null;

      setBooking(liveBooking ?? initialBooking);
      setResource(liveResource ?? initialResource);
    }

    loadBookingDetail()
      .catch(() => setMessage("Could not refresh live booking details. Showing the latest local data available."))
      .finally(() => setIsLoading(false));
  }, [initialBooking, initialResource, params.id]);

  const timeline = useMemo(() => {
    if (!booking) {
      return [];
    }

    const events = [
      {
        title: "Booking created",
        body: `${booking.requester} requested ${resource?.name ?? "this resource"} for ${booking.date}.`,
        tone: "text-signal-info"
      }
    ];

    if (booking.status === "pending") {
      events.push({
        title: "Approval requested",
        body: "The request is waiting for an authorized reviewer.",
        tone: "text-signal-warning"
      });
    }

    if (booking.status === "approved" || booking.status === "active" || booking.status === "completed") {
      events.push({
        title: "Booking approved",
        body: "The slot was approved for use.",
        tone: "text-signal-success"
      });
    }

    if (booking.status === "active") {
      events.push({
        title: "Booking active",
        body: "The approved reservation is currently inside its scheduled time window.",
        tone: "text-signal-info"
      });
    }

    if (booking.status === "completed") {
      events.push({
        title: "Booking completed",
        body: "The reservation finished and was retained for reporting.",
        tone: "text-signal-success"
      });
    }

    if (booking.status === "cancelled" || booking.status === "rejected") {
      events.push({
        title: booking.status === "rejected" ? "Booking rejected" : "Booking cancelled",
        body: "The booking is inactive and no longer blocks this slot.",
        tone: "text-signal-danger"
      });
    }

    return events;
  }, [booking, resource?.name]);

  if (!booking) {
    return (
      <AppShell
        active="/bookings"
        eyebrow="Booking detail"
        title="Booking not found"
        description="The requested booking could not be found in the current booking data."
        actions={
          <Link href="/bookings" className="inline-flex min-h-11 items-center gap-2 rounded border border-white/10 bg-ink-850 px-4 text-sm font-bold hover:bg-white/5">
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Bookings
          </Link>
        }
      >
        <section className="rounded-lg border border-white/10 bg-ink-900 p-8 text-center">
          <ClipboardList className="mx-auto mb-3 text-signal-info" size={34} aria-hidden="true" />
          <h3 className="text-xl font-black">No matching booking</h3>
          <p className="mt-2 text-sm text-[#A0A0B8]">It may have been removed, or the live data could not be loaded.</p>
        </section>
      </AppShell>
    );
  }

  const statusCopy = getStatusCopy(booking.status);
  const StatusIcon = statusCopy.icon;
  const canCancel = booking.status === "pending" || booking.status === "approved";

  return (
    <AppShell
      active="/bookings"
      eyebrow="Booking detail"
      title={resource?.name ?? "Booking detail"}
      description="Review booking state, requester information, resource details, and audit-style lifecycle events."
      actions={
        <Link
          href="/bookings"
          className="inline-flex min-h-11 items-center gap-2 rounded border border-white/10 bg-ink-850 px-4 text-sm font-bold hover:bg-white/5"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Bookings
        </Link>
      }
    >
      {message || isLoading ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900 p-3 text-sm font-bold text-[#C9C9DA]" role="status">
          {isLoading ? <Loader2 className="animate-spin text-signal-info" size={17} aria-hidden="true" /> : <AlertTriangle className="text-signal-warning" size={17} aria-hidden="true" />}
          {isLoading ? "Refreshing booking details" : message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#A0A0B8]">Booking ID</p>
              <h3 className="break-all text-2xl font-black">{booking.id}</h3>
            </div>
            <StatusBadge kind="booking" status={booking.status} />
          </div>

          <dl className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ["Requester", booking.requester],
              ["Role", titleCase(booking.role)],
              ["Department", booking.department],
              ["Purpose", booking.purpose],
              ["Date", booking.date],
              ["Time", `${booking.startTime} - ${booking.endTime}`],
              ["Resource type", resource ? titleCase(resource.type) : "Unknown"],
              ["Capacity", resource ? `${resource.capacity}` : "Unknown"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-ink-850 p-3">
                <dt className="text-xs font-bold uppercase text-[#A0A0B8]">{label}</dt>
                <dd className="mt-1 font-bold">{value}</dd>
              </div>
            ))}
          </dl>

          {resource ? (
            <div className="mt-5 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[#C9C9DA] md:grid-cols-2">
              <p className="flex items-center gap-2">
                <MapPin size={17} aria-hidden="true" />
                {resource.location}
              </p>
              <p className="flex items-center gap-2">
                <CalendarClock size={17} aria-hidden="true" />
                {resource.schedule}
              </p>
            </div>
          ) : null}

          <div className="mt-5 rounded-lg border border-white/10 bg-ink-850 p-4">
            <div className="flex items-start gap-3">
              <StatusIcon className="mt-1 shrink-0 text-signal-success" size={24} aria-hidden="true" />
              <div>
                <h4 className="text-lg font-black">{statusCopy.title}</h4>
                <p className="mt-1 text-sm text-[#A0A0B8]">{statusCopy.body}</p>
              </div>
            </div>
          </div>

          {canCancel ? (
            <button
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded border border-signal-danger/40 bg-signal-danger/10 px-4 text-sm font-bold text-signal-danger hover:bg-signal-danger/20"
              onClick={() => setBooking((current) => (current ? { ...current, status: "cancelled" } : current))}
            >
              <AlertTriangle size={18} aria-hidden="true" />
              Cancel Booking
            </button>
          ) : (
            <p className="mt-5 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold text-[#A0A0B8]">
              This booking is read-only because it is {booking.status}.
            </p>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList size={20} className="text-signal-info" aria-hidden="true" />
              <h3 className="text-xl font-black">Lifecycle timeline</h3>
            </div>
            <div className="space-y-3">
              {timeline.map((event) => (
                <article key={`${event.title}-${event.body}`} className="rounded-lg border border-white/10 bg-ink-850 p-3">
                  <p className={`font-bold ${event.tone}`}>{event.title}</p>
                  <p className="mt-1 text-sm text-[#A0A0B8]">{event.body}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
