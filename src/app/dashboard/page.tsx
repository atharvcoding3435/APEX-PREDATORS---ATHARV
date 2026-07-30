import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  ListFilter,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  UsersRound
} from "lucide-react";

const resources = [
  {
    name: "Science Lab 101",
    type: "Lab",
    location: "Science Block",
    capacity: 40,
    status: "Pending",
    tone: "text-signal-warning",
    fill: "bg-signal-warning/15"
  },
  {
    name: "Auditorium A",
    type: "Hall",
    location: "Main Campus",
    capacity: 220,
    status: "Booked",
    tone: "text-signal-danger",
    fill: "bg-signal-danger/15"
  },
  {
    name: "Projector Kit 04",
    type: "Equipment",
    location: "Admin Desk",
    capacity: 1,
    status: "Available",
    tone: "text-signal-success",
    fill: "bg-signal-success/15"
  }
];

const bookings = [
  { resource: "Projector Kit 04", time: "09:00 - 11:00", owner: "Ananya", status: "Confirmed" },
  { resource: "Science Lab 101", time: "12:00 - 14:00", owner: "Dr. Rahul", status: "Pending" },
  { resource: "Seminar Room B", time: "15:00 - 16:00", owner: "Priya", status: "Completed" }
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: CalendarDays, label: "Bookings" },
  { icon: UsersRound, label: "Resources" },
  { icon: ShieldCheck, label: "Approvals" },
  { icon: QrCode, label: "Check-in" }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-ink-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-ink-900 px-4 py-6 lg:block">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase text-signal-success">Resourcify</p>
            <h1 className="mt-1 text-xl font-black">CRMP Console</h1>
          </div>
          <nav className="space-y-1">
            {navItems.map((item, index) => (
              <button
                key={item.label}
                className={`flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-sm font-bold transition ${
                  index === 0 ? "bg-signal-success text-ink-950" : "text-[#C9C9DA] hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={18} aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-signal-info">Live dashboard</p>
              <h2 className="text-3xl font-black">Campus resource control</h2>
            </div>
            <div className="flex gap-2">
              <button className="grid min-h-11 w-11 place-items-center rounded border border-white/10 bg-ink-850 text-white hover:bg-white/5" title="Notifications">
                <Bell size={19} aria-hidden="true" />
              </button>
              <button className="inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white">
                <Plus size={18} aria-hidden="true" />
                New Booking
              </button>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Available", "18", "text-signal-success"],
              ["Pending", "12", "text-signal-warning"],
              ["Confirmed", "38", "text-signal-info"],
              ["Conflicts", "0", "text-signal-danger"]
            ].map(([label, value, tone]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-ink-850 p-4">
                <p className={`text-3xl font-black ${tone}`}>{value}</p>
                <p className="text-sm text-[#A0A0B8]">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-lg border border-white/10 bg-ink-850 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-bold">Resource availability</h3>
                <div className="flex gap-2">
                  <label className="flex min-h-10 items-center gap-2 rounded border border-white/10 bg-ink-900 px-3 text-sm text-[#A0A0B8]">
                    <Search size={17} aria-hidden="true" />
                    <input className="w-36 bg-transparent text-white outline-none placeholder:text-[#A0A0B8]" placeholder="Search" />
                  </label>
                  <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-900 hover:bg-white/5" title="Filter">
                    <ListFilter size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {resources.map((resource) => (
                  <article key={resource.name} className="rounded-lg border border-white/10 bg-ink-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold">{resource.name}</h4>
                        <p className="text-sm text-[#A0A0B8]">{resource.type} · {resource.location}</p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-bold ${resource.fill} ${resource.tone}`}>
                        {resource.status}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-[#A0A0B8]">Capacity</span>
                      <strong>{resource.capacity}</strong>
                    </div>
                    <button className="mt-4 min-h-10 w-full rounded border border-white/10 bg-white/[0.03] text-sm font-bold hover:bg-white/10">
                      View Slots
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-ink-850 p-4">
              <h3 className="text-xl font-bold">Upcoming bookings</h3>
              <div className="mt-4 space-y-3">
                {bookings.map((booking) => (
                  <article key={`${booking.resource}-${booking.time}`} className="rounded-lg border border-white/10 bg-ink-900 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold">{booking.resource}</h4>
                        <p className="text-sm text-[#A0A0B8]">{booking.time} · {booking.owner}</p>
                      </div>
                      {booking.status === "Confirmed" ? (
                        <CheckCircle2 className="text-signal-success" size={19} aria-hidden="true" />
                      ) : (
                        <Clock3 className="text-signal-warning" size={19} aria-hidden="true" />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
