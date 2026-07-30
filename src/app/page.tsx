import Link from "next/link";
import { ArrowRight, BarChart3, CalendarCheck, LockKeyhole, UsersRound } from "lucide-react";

const signals = [
  { label: "Live resources", value: "24", tone: "text-signal-info" },
  { label: "Bookings today", value: "68", tone: "text-signal-success" },
  { label: "Pending approvals", value: "12", tone: "text-signal-warning" },
  { label: "Conflict blocks", value: "0", tone: "text-signal-danger" }
];

const features = [
  {
    icon: CalendarCheck,
    title: "Live availability",
    copy: "A calendar-first view shows free, pending, approved, and active slots across classrooms, labs, auditoriums, and equipment."
  },
  {
    icon: LockKeyhole,
    title: "Conflict lock",
    copy: "Booking rules are designed around database-backed overlap checks so the same resource slot cannot be double booked."
  },
  {
    icon: UsersRound,
    title: "Role workflows",
    copy: "Students request slots, faculty approve department bookings, and admins manage resources, audits, and utilization."
  },
  {
    icon: BarChart3,
    title: "Booking insights",
    copy: "Dashboards surface utilization, pending approvals, active bookings, and waitlist demand for better planning."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-bold uppercase text-signal-success">APEX PREDATORS</p>
            <h1 className="text-2xl font-bold">Resourcify</h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 transition hover:bg-white"
          >
            Open App
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase text-signal-info">
              Campus Resource Management Platform
            </p>
            <h2 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Book campus spaces without ledger chaos.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-[#C9C9DA]">
              A dark, real-time booking workspace for classrooms, labs, equipment, and halls with approvals,
              waitlists, lifecycle tracking, and audit trails built into the flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center gap-2 rounded bg-signal-success px-5 font-bold text-ink-950 transition hover:bg-white"
              >
                Launch Workspace
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <a
                href="#features"
                className="inline-flex min-h-12 items-center rounded border border-white/15 px-5 font-bold text-white transition hover:border-white/40 hover:bg-white/5"
              >
                View System
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-ink-850 p-4 shadow-glow">
            <div className="grid grid-cols-2 gap-3">
              {signals.map((signal) => (
                <div key={signal.label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
                  <p className={`text-3xl font-black ${signal.tone}`}>{signal.value}</p>
                  <p className="mt-1 text-sm text-[#A0A0B8]">{signal.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-ink-900 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">Today&apos;s slots</h3>
                <span className="rounded bg-signal-success/15 px-2 py-1 text-xs font-bold text-signal-success">
                  Live
                </span>
              </div>
              <div className="space-y-3">
                {["Science Lab 101", "Seminar Hall A", "Projector Kit 04"].map((name, index) => (
                  <div key={name} className="grid grid-cols-[1fr_auto] gap-3 rounded border border-white/10 bg-white/[0.03] p-3">
                    <div>
                      <p className="font-bold">{name}</p>
                      <p className="text-sm text-[#A0A0B8]">{index + 10}:00 - {index + 11}:00</p>
                    </div>
                    <span className="self-center rounded bg-signal-info/15 px-2 py-1 text-xs font-bold text-signal-info">
                      Available
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="grid gap-4 pb-10 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-lg border border-white/10 bg-ink-850 p-5">
              <feature.icon className="mb-4 text-signal-success" size={24} aria-hidden="true" />
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#A0A0B8]">{feature.copy}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
