"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Eye, ListFilter, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { bookings as initialBookings, resources as initialResources } from "@/lib/mock-data";
import type { Booking, BookingStatus, Resource } from "@/lib/types";
import { formatTimeRange } from "@/lib/booking-rules";
import { cn, titleCase } from "@/lib/utils";

type StatusFilter = "all" | BookingStatus;

const statusFilters: StatusFilter[] = ["all", "pending", "approved", "active", "completed", "cancelled", "rejected"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [department, setDepartment] = useState("all");
  const [date, setDate] = useState("");
  const [resourceId, setResourceId] = useState("all");
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

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

  const departments = Array.from(new Set(bookings.map((booking) => booking.department)));

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const resource = resources.find((item) => item.id === booking.resourceId);
      const matchesSearch =
        !query ||
        [booking.id, booking.requester, booking.department, booking.purpose, resource?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = status === "all" || booking.status === status;
      const matchesDepartment = department === "all" || booking.department === department;
      const matchesDate = !date || booking.date === date;
      const matchesResource = resourceId === "all" || booking.resourceId === resourceId;

      return matchesSearch && matchesStatus && matchesDepartment && matchesDate && matchesResource;
    });
  }, [bookings, date, department, resourceId, resources, search, status]);

  function updateStatus(bookingId: string, nextStatus: BookingStatus) {
    setBookings((current) =>
      current.map((booking) => (booking.id === bookingId ? { ...booking, status: nextStatus } : booking))
    );
  }

  function saveReschedule() {
    if (!rescheduleBooking) {
      return;
    }

    setBookings((current) =>
      current.map((booking) => (booking.id === rescheduleBooking.id ? rescheduleBooking : booking))
    );
    setRescheduleBooking(null);
  }

  return (
    <AppShell
      active="/admin/bookings"
      eyebrow="Booking management"
      title="Bookings"
      description="Approve, reject, cancel, reschedule, and review bookings from one administrator view."
    >
      <section className="mb-5 grid gap-3 md:grid-cols-4">
        {[
          ["Total", bookings.length, "text-white"],
          ["Pending", bookings.filter((booking) => booking.status === "pending").length, "text-signal-warning"],
          ["Approved", bookings.filter((booking) => booking.status === "approved").length, "text-signal-success"],
          ["Cancelled", bookings.filter((booking) => booking.status === "cancelled").length, "text-signal-danger"]
        ].map(([label, value, tone]) => (
          <article key={label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <p className={cn("text-3xl font-black", tone)}>{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label} bookings</p>
          </article>
        ))}
      </section>

      <section className="mb-5 rounded-lg border border-white/10 bg-ink-900 p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_180px]">
          <label className="flex min-h-11 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-sm text-[#A0A0B8]">
            <Search size={18} aria-hidden="true" />
            <input
              className="w-full bg-transparent text-white outline-none placeholder:text-[#A0A0B8]"
              placeholder="Search requester, resource, booking id"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-sm font-bold text-white" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            {statusFilters.map((filter) => (
              <option key={filter} value={filter}>{titleCase(filter)}</option>
            ))}
          </select>
          <select className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-sm font-bold text-white" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="all">All Departments</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-sm font-bold text-white" value={resourceId} onChange={(event) => setResourceId(event.target.value)}>
            <option value="all">All Resources</option>
            {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
          </select>
          <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-sm font-bold text-white" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <p className="mt-4 inline-flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-bold text-[#C9C9DA]">
          <ListFilter size={17} aria-hidden="true" />
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/10 bg-ink-900">
        <div className="hidden grid-cols-[1fr_150px_130px_130px_210px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase text-[#A0A0B8] xl:grid">
          <span>Booking</span>
          <span>Department</span>
          <span>Time</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {filteredBookings.map((booking) => {
          const resource = resources.find((item) => item.id === booking.resourceId);

          return (
            <article key={booking.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 xl:grid-cols-[1fr_150px_130px_130px_210px] xl:items-center">
              <div>
                <h3 className="font-bold">{resource?.name ?? "Unknown resource"}</h3>
                <p className="text-sm text-[#A0A0B8]">{booking.requester} · {booking.purpose}</p>
              </div>
              <p className="text-sm text-[#C9C9DA]">{booking.department}</p>
              <p className="text-sm text-[#C9C9DA]">{formatTimeRange(booking.startTime, booking.endTime)}</p>
              <StatusBadge kind="booking" status={booking.status} />
              <div className="flex flex-wrap gap-2">
                <button className="grid min-h-10 w-10 place-items-center rounded border border-signal-success/40 bg-signal-success/10 text-signal-success" onClick={() => updateStatus(booking.id, "approved")} title="Approve">
                  <Check size={17} aria-hidden="true" />
                </button>
                <button className="grid min-h-10 w-10 place-items-center rounded border border-signal-danger/40 bg-signal-danger/10 text-signal-danger" onClick={() => updateStatus(booking.id, "rejected")} title="Reject">
                  <X size={17} aria-hidden="true" />
                </button>
                <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" onClick={() => updateStatus(booking.id, "cancelled")} title="Cancel">
                  <X size={17} aria-hidden="true" />
                </button>
                <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" onClick={() => setRescheduleBooking(booking)} title="Reschedule">
                  <CalendarClock size={17} aria-hidden="true" />
                </button>
                <a className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" href={`/bookings/${booking.id}`} title="View details">
                  <Eye size={17} aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </section>

      {rescheduleBooking ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink-950/80 px-4 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-lg border border-white/10 bg-ink-900 p-5">
            <h3 className="text-xl font-black">Reschedule booking</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" type="date" value={rescheduleBooking.date} onChange={(event) => setRescheduleBooking({ ...rescheduleBooking, date: event.target.value })} />
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" type="time" value={rescheduleBooking.startTime} onChange={(event) => setRescheduleBooking({ ...rescheduleBooking, startTime: event.target.value })} />
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" type="time" value={rescheduleBooking.endTime} onChange={(event) => setRescheduleBooking({ ...rescheduleBooking, endTime: event.target.value })} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="min-h-10 rounded border border-white/10 px-4 text-sm font-bold" onClick={() => setRescheduleBooking(null)}>Close</button>
              <button className="min-h-10 rounded bg-signal-success px-4 text-sm font-bold text-ink-950" onClick={saveReschedule}>Save</button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
