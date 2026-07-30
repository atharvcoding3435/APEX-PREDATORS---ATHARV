import { AppShell } from "@/components/app-shell";
import { bookings } from "@/lib/mock-data";
import { titleCase } from "@/lib/utils";

export default function AdminUsersPage() {
  const users = Array.from(
    new Map(
      bookings.map((booking) => [
        booking.requester,
        {
          name: booking.requester,
          role: booking.role,
          department: booking.department,
          bookings: bookings.filter((item) => item.requester === booking.requester).length
        }
      ])
    ).values()
  );

  return (
    <AppShell
      active="/admin/users"
      eyebrow="User administration"
      title="Users"
      description="View role assignments and booking activity for campus users."
    >
      <section className="overflow-hidden rounded-lg border border-white/10 bg-ink-900">
        {users.map((user) => (
          <article key={user.name} className="grid gap-2 border-b border-white/10 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_160px_1fr_120px] md:items-center">
            <h3 className="font-bold">{user.name}</h3>
            <p className="text-sm font-bold text-signal-info">{titleCase(user.role)}</p>
            <p className="text-sm text-[#A0A0B8]">{user.department}</p>
            <p className="text-sm text-[#C9C9DA]">{user.bookings} bookings</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
