import { BarChart3, ClipboardCheck, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { bookings, resources } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const activeResources = resources.filter((resource) => resource.isActive).length;
  const stats = [
    { label: "Active Resources", value: activeResources, icon: UsersRound },
    { label: "Pending Approvals", value: pendingCount, icon: ShieldCheck },
    { label: "Audit Events", value: bookings.length, icon: ClipboardCheck },
    { label: "Tracked Metrics", value: 4, icon: BarChart3 }
  ];

  return (
    <AppShell
      active="/admin"
      eyebrow="Admin dashboard"
      title="Administrative control center"
      description="Review campus resource health, pending approvals, user administration, and system activity."
    >
      <section className="grid gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <Icon className="mb-4 text-signal-success" size={22} aria-hidden="true" />
            <p className="text-3xl font-black">{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
