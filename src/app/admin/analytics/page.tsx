import { AppShell } from "@/components/app-shell";
import { bookings, resources, waitlist } from "@/lib/mock-data";

export default function AdminAnalyticsPage() {
  const utilizationAverage = Math.round(
    resources.reduce((total, resource) => total + resource.utilization, 0) / resources.length
  );

  return (
    <AppShell
      active="/admin/analytics"
      eyebrow="Operational analytics"
      title="Analytics"
      description="Track resource utilization, approval load, and waitlist demand across the campus."
    >
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Avg. Utilization", `${utilizationAverage}%`, "text-signal-success"],
          ["Total Bookings", bookings.length, "text-white"],
          ["Pending Queue", bookings.filter((booking) => booking.status === "pending").length, "text-signal-warning"],
          ["Waitlist Demand", waitlist.length, "text-signal-info"]
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <p className={`text-3xl font-black ${tone}`}>{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
