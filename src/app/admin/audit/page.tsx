import { AppShell } from "@/components/app-shell";
import { findResourceById, getAppData } from "@/lib/data";

export default async function AuditPage() {
  const { bookings, resources } = await getAppData();

  return (
    <AppShell
      active="/admin/audit"
      eyebrow="Audit trail"
      title="Immutable activity log"
      description="Track booking, approval, cancellation, and completion events for transparent campus resource accountability."
    >
      <section className="overflow-hidden rounded-lg border border-white/10 bg-ink-900">
        {bookings.map((booking) => {
          const resource = findResourceById(resources, booking.resourceId);

          return (
            <article key={booking.id} className="grid gap-2 border-b border-white/10 px-4 py-4 last:border-b-0 md:grid-cols-[180px_1fr_180px] md:items-center">
              <p className="text-sm font-bold text-[#A0A0B8]">{booking.date}</p>
              <div>
                <h3 className="font-bold">{booking.status === "completed" ? "Booking completed" : `Booking ${booking.status}`}</h3>
                <p className="text-sm text-[#A0A0B8]">{resource?.name ?? "Unknown resource"} · {booking.requester}</p>
              </div>
              <p className="text-sm text-[#C9C9DA]">{booking.startTime} - {booking.endTime}</p>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
