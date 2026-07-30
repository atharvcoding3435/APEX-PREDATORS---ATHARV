import { AppShell } from "@/components/app-shell";
import { bookings, getBookingResource, resources } from "@/lib/mock-data";
import { cn, titleCase } from "@/lib/utils";

function Bar({ label, value, max, tone = "bg-signal-success" }: { label: string; value: number; max: number; tone?: string }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-bold text-[#C9C9DA]">{label}</span>
        <span className="text-[#A0A0B8]">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded bg-white/10">
        <div className={cn("h-full rounded", tone)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const mostBooked = resources.reduce((top, resource) => (resource.utilization > top.utilization ? resource : top), resources[0]);
  const leastUsed = resources.reduce((low, resource) => (resource.utilization < low.utilization ? resource : low), resources[0]);
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
  const maxStatus = Math.max(...Object.values(statusCounts), 1);
  const maxDepartment = Math.max(...Object.values(departmentUsage), 1);
  const maxHour = Math.max(...Object.values(peakHours), 1);

  return (
    <AppShell
      active="/admin/analytics"
      eyebrow="Analytics"
      title="Usage insights"
      description="Simple charts for resource utilization, booking status, department usage, and peak booking hours."
    >
      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <p className="text-sm font-bold uppercase text-[#A0A0B8]">Most booked resource</p>
          <h3 className="mt-2 text-2xl font-black">{mostBooked.name}</h3>
          <p className="text-sm text-signal-success">{mostBooked.utilization}% weekly utilization</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <p className="text-sm font-bold uppercase text-[#A0A0B8]">Least used resource</p>
          <h3 className="mt-2 text-2xl font-black">{leastUsed.name}</h3>
          <p className="text-sm text-signal-warning">{leastUsed.utilization}% weekly utilization</p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="mb-4 text-xl font-black">Booking status distribution</h3>
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Bar key={status} label={titleCase(status)} value={count} max={maxStatus} tone={status === "pending" ? "bg-signal-warning" : status === "rejected" || status === "cancelled" ? "bg-signal-danger" : "bg-signal-success"} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="mb-4 text-xl font-black">Department usage</h3>
          <div className="space-y-4">
            {Object.entries(departmentUsage).map(([department, count]) => (
              <Bar key={department} label={department} value={count} max={maxDepartment} tone="bg-signal-info" />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="mb-4 text-xl font-black">Peak booking hours</h3>
          <div className="space-y-4">
            {Object.entries(peakHours).map(([hour, count]) => {
              const resource = getBookingResource(bookings.find((booking) => booking.startTime === hour)!);
              return <Bar key={hour} label={`${hour} · ${resource?.type ?? "resource"}`} value={count} max={maxHour} />;
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
