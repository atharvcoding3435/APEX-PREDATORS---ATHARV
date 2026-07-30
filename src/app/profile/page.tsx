import { AppShell } from "@/components/app-shell";

export default function ProfilePage() {
  return (
    <AppShell
      active="/profile"
      eyebrow="My account"
      title="Profile"
      description="Review your role, department, and account preferences for the Resourcify workspace."
    >
      <section className="grid gap-4 md:grid-cols-[280px_1fr]">
        <article className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <div className="grid h-20 w-20 place-items-center rounded bg-signal-success text-3xl font-black text-ink-950">
            AS
          </div>
          <h3 className="mt-4 text-xl font-black">Apex Student</h3>
          <p className="text-sm text-[#A0A0B8]">Student · Computer Science</p>
        </article>

        <article className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="text-xl font-black">Access</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Browse Resources", "Create Bookings", "QR Check-In"].map((permission) => (
              <div key={permission} className="rounded border border-signal-success/30 bg-signal-success/10 p-3 text-sm font-bold text-signal-success">
                {permission}
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
