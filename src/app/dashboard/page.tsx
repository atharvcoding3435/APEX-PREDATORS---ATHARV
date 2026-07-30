import Link from "next/link";
import { Bell, CheckCircle2, Clock3, ListFilter, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResourceCard } from "@/components/resource-card";
import { StatusBadge } from "@/components/status-badge";
import { bookings, getBookingResource, resources, waitlist } from "@/lib/mock-data";

export default function DashboardPage() {
  const availableCount = resources.filter((resource) => resource.status === "available").length;
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const approvedCount = bookings.filter((booking) => booking.status === "approved").length;
  const activeCount = bookings.filter((booking) => booking.status === "active").length;

  return (
    <AppShell
      active="/dashboard"
      eyebrow="Live dashboard"
      title="Campus resource control"
      description="Monitor resource availability, pending approvals, active bookings, and waitlist demand from one shared workspace."
      actions={
        <div className="flex gap-2">
          <button className="grid min-h-11 w-11 place-items-center rounded border border-white/10 bg-ink-850 text-white hover:bg-white/5" title="Notifications">
            <Bell size={19} aria-hidden="true" />
          </button>
          <Link href="/bookings/new" className="inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white">
            <Plus size={18} aria-hidden="true" />
            New Booking
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Available", availableCount, "text-signal-success"],
          ["Pending", pendingCount, "text-signal-warning"],
          ["Approved", approvedCount, "text-signal-info"],
          ["Active", activeCount, "text-signal-success"],
          ["Waitlist", waitlist.length, "text-white"]
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-ink-850 p-4">
            <p className={`text-3xl font-black ${tone}`}>{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-bold">Resource availability</h3>
            <div className="flex gap-2">
              <label className="flex min-h-10 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-sm text-[#A0A0B8]">
                <Search size={17} aria-hidden="true" />
                <input className="w-36 bg-transparent text-white outline-none placeholder:text-[#A0A0B8]" placeholder="Search" />
              </label>
              <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" title="Filter">
                <ListFilter size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {resources.slice(0, 3).map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
          <h3 className="text-xl font-bold">Upcoming bookings</h3>
          <div className="mt-4 space-y-3">
            {bookings.map((booking) => {
              const resource = getBookingResource(booking);

              return (
                <article key={booking.id} className="rounded-lg border border-white/10 bg-ink-850 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold">{resource?.name ?? "Unknown resource"}</h4>
                      <p className="text-sm text-[#A0A0B8]">
                        {booking.startTime} - {booking.endTime} · {booking.requester}
                      </p>
                    </div>
                    {booking.status === "approved" || booking.status === "active" ? (
                      <CheckCircle2 className="text-signal-success" size={19} aria-hidden="true" />
                    ) : (
                      <Clock3 className="text-signal-warning" size={19} aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3">
                    <StatusBadge kind="booking" status={booking.status} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
