"use client";

import { useMemo, useState } from "react";
import { Eye, Power, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import type { AdminUser, Booking, UserRole } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

type RoleFilter = "all" | UserRole;

const roleFilters: RoleFilter[] = ["all", "student", "faculty", "admin"];

export function AdminUsersClient({ initialUsers, bookings }: { initialUsers: AdminUser[]; bookings: Booking[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch = !query || [user.name, user.email, user.department, user.role].join(" ").toLowerCase().includes(query);
      const matchesRole = role === "all" || user.role === role;
      return matchesSearch && matchesRole;
    });
  }, [role, search, users]);

  async function toggleUser(userId: string) {
    const user = users.find((item) => item.id === userId);

    if (!user) return;

    const nextActive = !user.isActive;
    const response = await fetch("/api/v1/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-role": "admin" },
      body: JSON.stringify({ id: userId, isActive: nextActive })
    });

    if (response.ok) {
      setUsers((current) => current.map((item) => (item.id === userId ? { ...item, isActive: nextActive } : item)));
    }
  }

  return (
    <AppShell active="/admin/users" eyebrow="User management" title="Users" description="Search users, filter by role, review booking activity, and enable or disable access.">
      <section className="mb-5 grid gap-3 md:grid-cols-4">
        {[
          ["Total", users.length, "text-white"],
          ["Students", users.filter((user) => user.role === "student").length, "text-signal-info"],
          ["Faculty", users.filter((user) => user.role === "faculty").length, "text-signal-success"],
          ["Disabled", users.filter((user) => !user.isActive).length, "text-signal-danger"]
        ].map(([label, value, tone]) => (
          <article key={label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <p className={cn("text-3xl font-black", tone)}>{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label} users</p>
          </article>
        ))}
      </section>

      <section className="mb-5 rounded-lg border border-white/10 bg-ink-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-sm text-[#A0A0B8]">
            <Search size={18} aria-hidden="true" />
            <input className="w-full bg-transparent text-white outline-none" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            {roleFilters.map((filter) => (
              <button key={filter} className={cn("min-h-10 rounded border px-3 text-sm font-bold", role === filter ? "border-signal-success bg-signal-success text-ink-950" : "border-white/10 bg-ink-850 text-[#C9C9DA]")} onClick={() => setRole(filter)}>
                {titleCase(filter)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/10 bg-ink-900">
        <div className="hidden grid-cols-[1.2fr_120px_1fr_120px_120px_140px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase text-[#A0A0B8] lg:grid">
          <span>User</span><span>Role</span><span>Department</span><span>Bookings</span><span>Status</span><span>Actions</span>
        </div>
        {filteredUsers.map((user) => (
          <article key={user.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 lg:grid-cols-[1.2fr_120px_1fr_120px_120px_140px] lg:items-center">
            <div><h3 className="font-bold">{user.name}</h3><p className="text-sm text-[#A0A0B8]">{user.email}</p></div>
            <p className="text-sm font-bold text-signal-info">{titleCase(user.role)}</p>
            <p className="text-sm text-[#C9C9DA]">{user.department}</p>
            <p className="text-sm text-[#C9C9DA]">{user.bookingCount}</p>
            <span className={cn("w-fit rounded border px-2 py-1 text-xs font-bold", user.isActive ? "border-signal-success/40 bg-signal-success/10 text-signal-success" : "border-signal-danger/40 bg-signal-danger/10 text-signal-danger")}>{user.isActive ? "Enabled" : "Disabled"}</span>
            <div className="flex gap-2">
              <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" onClick={() => setSelectedUser(user)} title="View booking history"><Eye size={17} aria-hidden="true" /></button>
              <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" onClick={() => toggleUser(user.id)} title={user.isActive ? "Disable user" : "Enable user"}><Power size={17} aria-hidden="true" /></button>
            </div>
          </article>
        ))}
      </section>

      {selectedUser ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink-950/80 px-4 backdrop-blur-sm">
          <section className="w-full max-w-xl rounded-lg border border-white/10 bg-ink-900 p-5">
            <h3 className="text-xl font-black">{selectedUser.name}</h3>
            <p className="text-sm text-[#A0A0B8]">{selectedUser.department} · Last active {selectedUser.lastActive}</p>
            <div className="mt-4 space-y-2">
              {bookings.filter((booking) => booking.requester === selectedUser.name).map((booking) => (
                <article key={booking.id} className="rounded border border-white/10 bg-ink-850 p-3">
                  <p className="font-bold">{booking.purpose}</p>
                  <p className="text-sm text-[#A0A0B8]">{booking.date} · {booking.status}</p>
                </article>
              ))}
            </div>
            <button className="mt-5 min-h-10 rounded border border-white/10 px-4 text-sm font-bold" onClick={() => setSelectedUser(null)}>Close</button>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
