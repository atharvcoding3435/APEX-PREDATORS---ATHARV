import { BarChart3, CalendarClock, ClipboardList, TrendingUp, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { findResourceById, getAppData } from "@/lib/data";
import { cn, titleCase } from "@/lib/utils";

function Bar({ label, value, max, tone = "bg-signal-success" }: { label: string; value: number; max: number; tone?: string }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="truncate font-bold text-[#C9C9DA]">{label}</span>
        <span className="shrink-0 text-[#A0A0B8]">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded bg-white/10">
        <div className={cn("h-full rounded", tone)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded border border-white/10 bg-ink-850 p-5 text-center">
      <div>
        <ClipboardList className="mx-auto mb-3 text-signal-info" size={28} aria-hidden="true" />
        <p className="text-sm font-bold text-[#A0A0B8]">{label}</p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const { bookings, resources } = await getAppData();
  const bookingCountsByResource = bookings.reduce<Record<string, number>>((counts, booking) => {
    counts[booking.resourceId] = (counts[booking.resourceId] ?? 0) + 1;
    return counts;
  }, {});
  const resourcesWithCounts = resources.map((resource) => ({
    ...resource,
    bookingCount: bookingCountsByResource[resource.id] ?? 0
  }));
  const mostBooked = resourcesWithCounts.slice().sort((a, b) => b.bookingCount - a.bookingCount || b.utilization - a.utilization)[0];
  const leastUsed = resourcesWithCounts.slice().sort((a, b) => a.bookingCount - b.bookingCount || a.utilization - b.utilization)[0];
  const statusCounts = bookings.reduce<Record<string, number>>((counts, booking) => {
    counts[booking.status] = (counts[booking.status] ?? 0) + 1;
    return counts;
  }, {});
  const departmentUsage = bookings.reduce<Record<string, number>>((counts, booking) => {
    counts[booking.department] = (counts[booking.department] ?? 0) + 1;
    return counts;
  }, {});
  const peakHours = bookings.reduce<Record<string, number>>((counts, booking) => {
    counts[booking.startTime] = (counts[booking.startTime] ?? 0) + 1;
    return counts;
  }, {});
  const resourceTypeUsage = bookings.reduce<Record<string, number>>((counts, booking) => {
    const resource = findResourceById(resources, booking.resourceId);
    const type = resource ? titleCase(resource.type) : "Unknown";
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});
  const maxStatus = Math.max(...Object.values(statusCounts), 1);
  const maxDepartment = Math.max(...Object.values(departmentUsage), 1);
  const maxHour = Math.max(...Object.values(peakHours), 1);
  const maxType = Math.max(...Object.values(resourceTypeUsage), 1);
  const activeBookingCount = bookings.filter((booking) => ["pending", "approved", "active"].includes(booking.status)).length;
  const completionRate = bookings.length > 0 ? Math.round((bookings.filter((booking) => booking.status === "completed").length / bookings.length) * 100) : 0;
  const kpiCards: Array<{ label: string; value: string | number; tone: string; icon: LucideIcon }> = [
    { label: "Total bookings", value: bookings.length, tone: "text-white", icon: BarChart3 },
    { label: "Active queue", value: activeBookingCount, tone: "text-signal-warning", icon: CalendarClock },
    { label: "Resources tracked", value: resources.length, tone: "text-signal-info", icon: ClipboardList },
    { label: "Completion rate", value: `${completionRate}%`, tone: "text-signal-success", icon: TrendingUp }
  ];

  return (
    <AppShell
      active="/admin/analytics"
      eyebrow="Analytics"
      title="Usage insights"
      description="Simple charts for resource utilization, booking status, department usage, and peak booking hours."
    >
      <section className="mb-6 grid gap-3 md:grid-cols-4">
        {kpiCards.map(({ label, value, tone, icon: Icon }) => (
          <article key={label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <Icon className="mb-4 text-signal-success" size={21} aria-hidden="true" />
            <p className={cn("text-3xl font-black", tone)}>{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label}</p>
          </article>
        ))}
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <p className="text-sm font-bold uppercase text-[#A0A0B8]">Most booked resource</p>
          <h3 className="mt-2 text-2xl font-black">{mostBooked?.name ?? "No resource data"}</h3>
          <p className="text-sm text-signal-success">{mostBooked ? `${mostBooked.bookingCount} bookings · ${mostBooked.utilization}% utilization` : "Create bookings to populate this insight."}</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <p className="text-sm font-bold uppercase text-[#A0A0B8]">Least used resource</p>
          <h3 className="mt-2 text-2xl font-black">{leastUsed?.name ?? "No resource data"}</h3>
          <p className="text-sm text-signal-warning">{leastUsed ? `${leastUsed.bookingCount} bookings · ${leastUsed.utilization}% utilization` : "Create resources to populate this insight."}</p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="mb-4 text-xl font-black">Booking status distribution</h3>
          <div className="space-y-4">
            {Object.entries(statusCounts).length > 0 ? Object.entries(statusCounts).map(([status, count]) => (
              <Bar key={status} label={titleCase(status)} value={count} max={maxStatus} tone={status === "pending" ? "bg-signal-warning" : status === "rejected" || status === "cancelled" ? "bg-signal-danger" : "bg-signal-success"} />
            )) : <EmptyChart label="No booking status data yet." />}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="mb-4 text-xl font-black">Department usage</h3>
          <div className="space-y-4">
            {Object.entries(departmentUsage).length > 0 ? Object.entries(departmentUsage).map(([department, count]) => (
              <Bar key={department} label={department} value={count} max={maxDepartment} tone="bg-signal-info" />
            )) : <EmptyChart label="No department usage data yet." />}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="mb-4 text-xl font-black">Peak booking hours</h3>
          <div className="space-y-4">
            {Object.entries(peakHours).length > 0 ? Object.entries(peakHours).sort(([a], [b]) => a.localeCompare(b)).map(([hour, count]) => (
              <Bar key={hour} label={hour} value={count} max={maxHour} />
            )) : <EmptyChart label="No peak-hour data yet." />}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="mb-4 text-xl font-black">Resource type demand</h3>
          <div className="space-y-4">
            {Object.entries(resourceTypeUsage).length > 0 ? Object.entries(resourceTypeUsage).map(([type, count]) => (
              <Bar key={type} label={type} value={count} max={maxType} tone="bg-signal-warning" />
            )) : <EmptyChart label="No resource demand data yet." />}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
