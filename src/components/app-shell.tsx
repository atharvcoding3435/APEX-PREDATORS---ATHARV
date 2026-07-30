import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
  Users,
  UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";

const userNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/resources", icon: UsersRound, label: "Resources" },
  { href: "/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/profile", icon: UserCircle, label: "Profile" }
];

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/resources", icon: UsersRound, label: "Resources" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/pending", icon: ShieldCheck, label: "Pending Approvals" },
  { href: "/admin/audit", icon: ClipboardCheck, label: "Audit Logs" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" }
];

type AppShellProps = {
  active: string;
  title: string;
  eyebrow: string;
  variant?: "user" | "admin";
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ active, title, eyebrow, variant, description, actions, children }: AppShellProps) {
  const isAdmin = variant === "admin" || active.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const consoleTitle = isAdmin ? "Admin Console" : "CRMP Console";
  const homeHref = isAdmin ? "/admin" : "/dashboard";

  return (
    <main className="min-h-screen bg-ink-950 pb-20 text-white lg:pb-0">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-ink-900 px-4 py-6 lg:block">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase text-signal-success">Resourcify</p>
            <h1 className="mt-1 text-xl font-black">{consoleTitle}</h1>
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
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4 lg:hidden">
            <Link href={homeHref} className="block">
              <p className="text-xs font-bold uppercase text-signal-success">Resourcify</p>
              <p className="font-black">{consoleTitle}</p>
            </Link>
            <span className="rounded border border-white/10 bg-ink-850 px-3 py-1 text-xs font-bold text-[#C9C9DA]">
              Team Preview
            </span>
          </div>

          <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase text-signal-info">{eyebrow}</p>
              <h2 className="text-3xl font-black leading-tight">{title}</h2>
              {description ? <p className="mt-2 text-sm text-[#A0A0B8]">{description}</p> : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </header>
          {children}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink-900/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded text-[11px] font-bold transition",
                active === item.href ? "bg-signal-success text-ink-950" : "text-[#A0A0B8] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
