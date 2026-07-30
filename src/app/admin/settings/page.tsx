"use client";

import { useState } from "react";
import { Check, Clock3, Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export default function AdminSettingsPage() {
  const [maxDuration, setMaxDuration] = useState(4);
  const [advanceDays, setAdvanceDays] = useState(30);
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [saved, setSaved] = useState(false);

  async function saveSettings() {
    const response = await fetch("/api/v1/admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin"
      },
      body: JSON.stringify({
        maxBookingDurationHours: maxDuration,
        maxAdvanceBookingDays: advanceDays,
        workingHoursStart: openTime,
        workingHoursEnd: closeTime,
        approvalRequired
      })
    });

    if (response.ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <AppShell
      active="/admin/settings"
      eyebrow="System settings"
      title="Booking settings"
      description="Configure the small set of booking rules admins need for the MVP."
    >
      {saved ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-signal-success/30 bg-signal-success/10 p-3 text-sm font-bold text-signal-success" role="status">
          <Check size={18} aria-hidden="true" />
          Settings saved for this demo session.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <form className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <div className="mb-5 flex items-center gap-3">
            <Settings className="text-signal-success" size={22} aria-hidden="true" />
            <h3 className="text-xl font-black">Booking rules</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Maximum booking duration
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" min={1} max={8} type="number" value={maxDuration} onChange={(event) => setMaxDuration(Number(event.target.value))} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Maximum advance booking days
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" min={1} max={120} type="number" value={advanceDays} onChange={(event) => setAdvanceDays(Number(event.target.value))} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Working hours start
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" type="time" value={openTime} onChange={(event) => setOpenTime(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Working hours end
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" type="time" value={closeTime} onChange={(event) => setCloseTime(event.target.value)} />
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded border border-white/10 bg-ink-850 px-3 text-sm font-bold text-[#C9C9DA] md:col-span-2">
              <input type="checkbox" checked={approvalRequired} onChange={(event) => setApprovalRequired(event.target.checked)} />
              Require approval for labs, auditoriums, sports facilities, and department-restricted resources
            </label>
          </div>
          <button type="button" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white" onClick={saveSettings}>
            <Check size={18} aria-hidden="true" />
            Save Settings
          </button>
        </form>

        <aside className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <div className="mb-5 flex items-center gap-3">
            <Clock3 className="text-signal-info" size={22} aria-hidden="true" />
            <h3 className="text-xl font-black">Current policy</h3>
          </div>
          <dl className="grid gap-3 text-sm">
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Duration limit</dt>
              <dd className="mt-1 font-bold">{maxDuration} hours</dd>
            </div>
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Advance window</dt>
              <dd className="mt-1 font-bold">{advanceDays} days</dd>
            </div>
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Working hours</dt>
              <dd className="mt-1 font-bold">{openTime} - {closeTime}</dd>
            </div>
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Approval defaults</dt>
              <dd className="mt-1 font-bold">{approvalRequired ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </AppShell>
  );
}
