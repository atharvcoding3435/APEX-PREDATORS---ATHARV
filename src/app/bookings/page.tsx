import Link from "next/link";
import { CalendarPlus, ChevronRight, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { findResourceById, getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const { bookings, resources } = await getAppData();
  const sortedBookings = bookings
    .slice()
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  return (
    <AppShell
      active="/bookings"
      eyebrow="Booking timeline"
      title="My bookings"
      description="Review upcoming reservations, status changes, resource details, and the next actions needed for each request."
      actions={
        <Link href="/bookings/new" className="inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white">
          <CalendarPlus size={18} aria-hidden="true" />
          Create Booking
        </Link>
      }
    >
      <section className="overflow-hidden rounded-lg border border-white/10 bg-ink-900">
        <div className="grid grid-cols-[1fr_130px_150px_120px] border-b border-white/10 px-4 py-3 text-sm font-bold text-[#A0A0B8] max-md:hidden">
          <span>Booking</span>
          <span>Time</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {sortedBookings.length > 0 ? sortedBookings.map((booking) => {
          const resource = findResourceById(resources, booking.resourceId);

          return (
            <article key={booking.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_130px_150px_120px] md:items-center">
              <div>
                <h3 className="font-bold">{resource?.name ?? "Unknown resource"}</h3>
                <p className="text-sm text-[#A0A0B8]">{booking.purpose}</p>
                <p className="mt-1 text-sm text-[#C9C9DA]">{booking.requester} · {booking.department}</p>
              </div>
              <p className="text-sm text-[#C9C9DA]">
                {booking.date}
                <span className="block text-[#A0A0B8]">{booking.startTime} - {booking.endTime}</span>
              </p>
              <StatusBadge kind="booking" status={booking.status} />
              <Link
                href={`/bookings/${booking.id}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 text-sm font-bold hover:bg-white/10"
              >
                View
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
            </article>
          );
        }) : (
          <div className="grid place-items-center px-4 py-14 text-center">
            <ClipboardList className="mb-3 text-signal-info" size={32} aria-hidden="true" />
            <h3 className="text-xl font-black">No bookings yet</h3>
            <p className="mt-2 max-w-md text-sm text-[#A0A0B8]">
              New resource requests and approved reservations will appear here.
            </p>
            <Link href="/bookings/new" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white">
              <CalendarPlus size={18} aria-hidden="true" />
              Create Booking
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
