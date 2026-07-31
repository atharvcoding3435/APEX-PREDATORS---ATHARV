"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Loader2, Save, Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type BookingSettings = {
  maxBookingDurationHours: number;
  maxAdvanceBookingDays: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  approvalRequired: boolean;
};

const defaultSettings: BookingSettings = {
  maxBookingDurationHours: 4,
  maxAdvanceBookingDays: 30,
  workingHoursStart: "08:00",
  workingHoursEnd: "18:00",
  approvalRequired: true
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [source, setSource] = useState("default");

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/v1/admin/settings");
      const payload = await response.json();

      if (response.ok && payload?.data) {
        setSettings(payload.data);
        setSource(payload.source ?? "api");
      }
    }

    loadSettings()
      .catch(() => setMessage("Could not load saved settings. Defaults are shown."))
      .finally(() => setIsLoading(false));
  }, []);

  function updateSetting<Key extends keyof BookingSettings>(key: Key, value: BookingSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function saveSettings() {
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/v1/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload?.data) {
      setSettings(payload.data);
      setSource(payload.source ?? "api");
      setMessage(payload.source === "supabase" ? "Settings saved to Supabase." : "Settings saved for this deployment session.");
    } else {
      setMessage(payload?.message ?? "Settings could not be saved.");
    }

    setIsSaving(false);
  }

  const isInvalidRange = settings.workingHoursStart >= settings.workingHoursEnd;

  return (
    <AppShell
      active="/admin/settings"
      eyebrow="System settings"
      title="Booking settings"
      description="Configure the small set of booking rules admins need for the MVP."
    >
      {message || isLoading ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900 p-3 text-sm font-bold text-[#C9C9DA]" role="status">
          {isLoading ? <Loader2 className="animate-spin text-signal-info" size={18} aria-hidden="true" /> : <Check size={18} className="text-signal-success" aria-hidden="true" />}
          {isLoading ? "Loading settings" : message}
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
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" min={1} max={8} type="number" value={settings.maxBookingDurationHours} onChange={(event) => updateSetting("maxBookingDurationHours", Number(event.target.value))} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Maximum advance booking days
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" min={1} max={120} type="number" value={settings.maxAdvanceBookingDays} onChange={(event) => updateSetting("maxAdvanceBookingDays", Number(event.target.value))} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Working hours start
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" type="time" value={settings.workingHoursStart} onChange={(event) => updateSetting("workingHoursStart", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Working hours end
              <input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white" type="time" value={settings.workingHoursEnd} onChange={(event) => updateSetting("workingHoursEnd", event.target.value)} />
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded border border-white/10 bg-ink-850 px-3 text-sm font-bold text-[#C9C9DA] md:col-span-2">
              <input type="checkbox" checked={settings.approvalRequired} onChange={(event) => updateSetting("approvalRequired", event.target.checked)} />
              Require approval for labs, auditoriums, sports facilities, and department-restricted resources
            </label>
          </div>

          {isInvalidRange ? (
            <div className="mt-4 rounded border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-sm font-bold text-signal-danger">
              Working hours end must be after the start time.
            </div>
          ) : null}

          <button type="button" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white disabled:opacity-60" disabled={isSaving || isInvalidRange} onClick={saveSettings}>
            {isSaving ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
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
              <dd className="mt-1 font-bold">{settings.maxBookingDurationHours} hours</dd>
            </div>
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Advance window</dt>
              <dd className="mt-1 font-bold">{settings.maxAdvanceBookingDays} days</dd>
            </div>
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Working hours</dt>
              <dd className="mt-1 font-bold">{settings.workingHoursStart} - {settings.workingHoursEnd}</dd>
            </div>
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Approval defaults</dt>
              <dd className="mt-1 font-bold">{settings.approvalRequired ? "Enabled" : "Disabled"}</dd>
            </div>
            <div className="rounded border border-white/10 bg-ink-850 p-3">
              <dt className="text-[#A0A0B8]">Storage</dt>
              <dd className="mt-1 font-bold">{source === "supabase" ? "Supabase" : "Deployment session"}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </AppShell>
  );
}
