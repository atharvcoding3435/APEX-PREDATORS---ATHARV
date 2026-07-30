import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Plus,
  Search,
  Settings,
  Users,
  Wrench
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { findResourceById, getAppData } from "@/lib/data";
import { findBookingConflict, formatTimeRange } from "@/lib/booking-rules";

export default async function AdminDashboardPage() {
  const { activities, bookings, resources, users } = await getAppData();
  const today = "2026-08-01";
  const activeResources = resources.filter((resource) => resource.isActive);
  const activeBookings = bookings.filter((booking) => booking.status === "approved" || booking.status === "active");
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const maintenanceResources = resources.filter((resource) => resource.maintenanceStatus === "maintenance");
  const todaysBookings = bookings.filter((booking) => booking.date === today);
  const conflicts = bookings
    .map((booking) => ({ booking, conflict: findBookingConflict(booking, bookings.filter((item) => item.id !== booking.id)) }))
    .filter((item) => item.conflict);

  const stats = [
    { label: "Total Resources", value: resources.length, icon: ClipboardList, tone: "text-white" },
    { label: "Active Resources", value: activeResources.length, icon: CalendarCheck, tone: "text-signal-success" },
    { label: "Total Users", value: users.length, icon: Users, tone: "text-signal-info" },
    { label: "Active Bookings", value: activeBookings.length, icon: CalendarDays, tone: "text-signal-success" },
    { label: "Pending Approvals", value: pendingBookings.length, icon: AlertTriangle, tone: "text-signal-warning" },
    { label: "Maintenance", value: maintenanceResources.length, icon: Wrench, tone: "text-signal-danger" },
    { label: "Today's Bookings", value: todaysBookings.length, icon: CalendarDays, tone: "text-white" }
  ];

  const quickActions = [
    { label: "Add Resource", href: "/admin/resources", icon: Plus },
    { label: "Pending Approvals", href: "/admin/pending", icon: AlertTriangle },
    { label: "Manage Bookings", href: "/admin/bookings", icon: CalendarDays },
    { label: "Manage Users", href: "/admin/users", icon: Users },
    { label: "View Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings }
  ];

  return (
    <AppShell
      active="/admin"
      eyebrow="Admin portal"
      title="Resource allocation command center"
      description="Monitor resources, bookings, approvals, conflicts, and platform activity from one focused dashboard."
      actions={
        <label className="flex min-h-11 w-full min-w-72 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-sm text-[#A0A0B8]">
          <Search size={18} aria-hidden="true" />
          <input
            className="w-full bg-transparent text-white outline-none placeholder:text-[#A0A0B8]"
            placeholder="Search resources, bookings, users"
          />
        </label>
      }
    >
      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <Icon className="mb-4 text-signal-success" size={21} aria-hidden="true" />
            <p className={`text-3xl font-black ${tone}`}>{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label}</p>
          </article>
        ))}
      </section>

      <section className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {quickActions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-white/10 bg-ink-900 px-3 text-sm font-bold hover:bg-white/5"
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">Today's bookings</h3>
            <Link href="/admin/bookings" className="text-sm font-bold text-signal-success hover:text-white">
              Manage all
            </Link>
          </div>
          <div className="space-y-3">
            {todaysBookings.map((booking) => {
              const resource = findResourceById(resources, booking.resourceId);

              return (
                <article key={booking.id} className="grid gap-3 rounded border border-white/10 bg-ink-850 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <h4 className="font-bold">{resource?.name ?? "Unknown resource"}</h4>
                    <p className="text-sm text-[#A0A0B8]">
                      {booking.requester} · {formatTimeRange(booking.startTime, booking.endTime)}
                    </p>
                  </div>
                  <StatusBadge kind="booking" status={booking.status} />
                  <Link href={`/bookings/${booking.id}`} className="text-sm font-bold text-signal-info hover:text-white">
                    Details
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">Recent activity</h3>
            <Link href="/admin/audit" className="text-sm font-bold text-signal-success hover:text-white">
              Audit logs
            </Link>
          </div>
          <div className="space-y-3">
            {activities.map((activity) => (
              <article key={activity.id} className="rounded border border-white/10 bg-ink-850 p-3">
                <p className="font-bold">
                  {activity.actor} {activity.action} {activity.target}
                </p>
                <p className="text-sm text-[#A0A0B8]">{activity.time}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-signal-warning/30 bg-signal-warning/10 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black text-signal-warning">Conflict center</h3>
            <p className="mt-1 text-sm text-[#F5E4C3]">
              {conflicts.length > 0 ? `${conflicts.length} potential conflict needs review.` : "No active conflicts in the current mock data."}
            </p>
          </div>
          <Link
            href="/admin/conflicts"
            className="inline-flex min-h-11 items-center justify-center rounded bg-signal-warning px-4 text-sm font-bold text-ink-950 hover:bg-white"
          >
            Open Conflicts
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
