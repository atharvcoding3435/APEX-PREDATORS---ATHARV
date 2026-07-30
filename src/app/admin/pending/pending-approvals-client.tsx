"use client";

import { AdminBookingActions } from "@/components/admin-booking-actions";
import { AppShell } from "@/components/app-shell";
import { findResourceById } from "@/lib/data";
import type { Booking, Resource } from "@/lib/types";

export function PendingApprovalsClient({ initialBookings, resources }: { initialBookings: Booking[]; resources: Resource[] }) {
  const pending = initialBookings.filter((booking) => booking.status === "pending");

  return (
    <AppShell
      active="/admin/pending"
      eyebrow="Approval workflow"
      title="Pending approvals"
      description="Approve or reject requests that need faculty or admin review before a slot is reserved."
    >
      <section className="grid gap-4">
        {pending.length > 0 ? (
          pending.map((booking) => {
            const resource = findResourceById(resources, booking.resourceId);

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
                  <AdminBookingActions booking={booking} onUpdated={() => window.location.reload()} />
                </div>
              </article>
            );
          })
        ) : (
          <section className="rounded-lg border border-dashed border-white/20 bg-ink-900 p-8 text-center">
            <h3 className="text-xl font-black">No pending approvals</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#A0A0B8]">
              New requests that require administrator review will appear here.
            </p>
          </section>
        )}
      </section>
    </AppShell>
  );
}
