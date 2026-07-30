import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/resources", icon: UsersRound, label: "Resources" },
  { href: "/admin/pending", icon: ShieldCheck, label: "Approvals" },
  { href: "/checkin", icon: QrCode, label: "Check-in" },
  { href: "/admin/audit", icon: ClipboardCheck, label: "Audit" }
];

type AppShellProps = {
  active: string;
  title: string;
  eyebrow: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ active, title, eyebrow, actions, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-ink-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-ink-900 px-4 py-6 lg:block">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase text-signal-success">Resourcify</p>
            <h1 className="mt-1 text-xl font-black">CRMP Console</h1>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-sm font-bold transition",
                  active === item.href
                    ? "bg-signal-success text-ink-950"
                    : "text-[#C9C9DA] hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-signal-info">{eyebrow}</p>
              <h2 className="text-3xl font-black">{title}</h2>
            </div>
            {actions}
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
