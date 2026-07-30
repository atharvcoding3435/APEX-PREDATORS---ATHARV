import { Check, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { bookings, getBookingResource } from "@/lib/mock-data";

export default function PendingApprovalsPage() {
  const pending = bookings.filter((booking) => booking.status === "pending");

  return (
    <AppShell
      active="/admin/pending"
      eyebrow="Approval workflow"
      title="Pending approvals"
      description="Approve or reject requests that need faculty or admin review before a slot is confirmed."
    >
      <section className="grid gap-4">
        {pending.map((booking) => {
          const resource = getBookingResource(booking);

          return (
            <article key={booking.id} className="rounded-lg border border-white/10 bg-ink-900 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-bold">{resource?.name ?? "Unknown resource"}</h3>
                  <p className="text-sm text-[#A0A0B8]">
                    {booking.requester} · {booking.department} · {booking.startTime} - {booking.endTime}
                  </p>
                  <p className="mt-3 max-w-2xl text-[#C9C9DA]">{booking.purpose}</p>
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex min-h-10 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white">
                    <Check size={17} aria-hidden="true" />
                    Approve
                  </button>
                  <button className="inline-flex min-h-10 items-center gap-2 rounded border border-signal-danger/40 bg-signal-danger/10 px-4 text-sm font-bold text-signal-danger hover:bg-signal-danger/20">
                    <X size={17} aria-hidden="true" />
                    Reject
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
