"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  QrCode,
  XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getBooking, getBookingResource } from "@/lib/mock-data";
import type { BookingStatus } from "@/lib/types";
import { titleCase } from "@/lib/utils";

function getStatusCopy(status: BookingStatus) {
  if (status === "pending") {
    return {
      icon: Clock3,
      title: "Waiting for approval",
      body: "This request is queued for faculty or admin review before the slot becomes confirmed."
    };
  }

  if (status === "confirmed") {
    return {
      icon: QrCode,
      title: "Ready for QR check-in",
      body: "This booking is confirmed. The requester can use the QR token at the resource check-in station."
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
    title: "Booking cancelled",
    body: "This booking is no longer active. The slot can be offered again or processed through waitlist rules."
  };
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const originalBooking = getBooking(params.id);
  const [localStatus, setLocalStatus] = useState<BookingStatus | null>(null);

  if (!originalBooking) {
    notFound();
  }

  const booking = {
    ...originalBooking,
    status: localStatus ?? originalBooking.status
  };
  const resource = getBookingResource(booking);
  const statusCopy = getStatusCopy(booking.status);
  const StatusIcon = statusCopy.icon;
  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  const timeline = useMemo(() => {
    const events = [
      {
        title: "Booking created",
        body: `${booking.requester} requested ${resource?.name ?? "this resource"} for ${booking.date}.`,
        tone: "text-signal-info"
      }
    ];

    if (originalBooking.status === "pending") {
      events.push({
        title: "Approval requested",
        body: "The request is waiting for an authorized reviewer.",
        tone: "text-signal-warning"
      });
    }

    if (originalBooking.status === "confirmed") {
      events.push({
        title: "Booking confirmed",
        body: "The slot was approved and the QR token became available.",
        tone: "text-signal-success"
      });
      events.push({
        title: "QR token generated",
        body: originalBooking.qrToken,
        tone: "text-signal-info"
      });
    }

    if (originalBooking.status === "completed") {
      events.push({
        title: "Booking confirmed",
        body: "The slot was approved for use.",
        tone: "text-signal-success"
      });
      events.push({
        title: "Checked in",
        body: "The booking was marked completed at the check-in station.",
        tone: "text-signal-success"
      });
    }

    if (booking.status === "cancelled") {
      events.push({
        title: "Booking cancelled",
        body: localStatus ? "Cancelled in this demo session. Persistence will connect during the Supabase sprint." : "The booking is inactive.",
        tone: "text-signal-danger"
      });
    }

    return events;
  }, [booking.date, booking.requester, booking.status, localStatus, originalBooking.qrToken, originalBooking.status, resource?.name]);

  return (
    <AppShell
      active="/bookings"
      eyebrow="Booking detail"
      title={resource?.name ?? "Booking detail"}
      description="Review booking state, requester information, QR readiness, and audit-style lifecycle events."
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
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#A0A0B8]">Booking ID</p>
              <h3 className="text-2xl font-black">{booking.id}</h3>
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
              onClick={() => setLocalStatus("cancelled")}
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
            <h3 className="text-xl font-black">QR readiness</h3>
            <div className="mt-4 grid aspect-square max-h-80 place-items-center rounded-lg border border-white/10 bg-white">
              <div className="grid h-44 w-44 place-items-center rounded border-8 border-ink-950 text-ink-950">
                <QrCode size={104} aria-hidden="true" />
              </div>
            </div>
            <p className="mt-4 break-all rounded border border-white/10 bg-ink-850 px-3 py-2 text-center text-sm font-bold text-[#C9C9DA]">
              {booking.status === "confirmed" ? booking.qrToken : "Available after confirmation"}
            </p>
          </section>

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
