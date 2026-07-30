"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarCheck, CheckCircle2, Clock3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { findBookingConflict, getDefaultBookingStatus } from "@/lib/booking-rules";
import { bookings, getBookingResource, resources } from "@/lib/mock-data";
import type { Booking, UserRole } from "@/lib/types";
import { titleCase } from "@/lib/utils";

type BookingPreview = Booking & {
  resourceName: string;
};

const roleOptions: UserRole[] = ["student", "faculty", "admin"];

export default function NewBookingPage() {
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "");
  const [date, setDate] = useState("2026-08-01");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [requester, setRequester] = useState("Ananya Sharma");
  const [department, setDepartment] = useState("Computer Science");
  const [requesterRole, setRequesterRole] = useState<UserRole>("student");
  const [purpose, setPurpose] = useState("Project demo rehearsal");
  const [preview, setPreview] = useState<BookingPreview | null>(null);

  const selectedResource = resources.find((resource) => resource.id === resourceId);
  const conflict = useMemo(
    () => findBookingConflict({ resourceId, requesterRole, date, startTime, endTime }, bookings),
    [date, endTime, requesterRole, resourceId, startTime]
  );
  const conflictResource = conflict ? getBookingResource(conflict) : undefined;
  const status = getDefaultBookingStatus(requesterRole, selectedResource);
  const isTimeValid = startTime < endTime;
  const canSubmit = Boolean(selectedResource && requester.trim() && purpose.trim().length >= 5 && isTimeValid && !conflict);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedResource || !canSubmit) {
      return;
    }

    setPreview({
      id: `preview-${Math.floor(Date.now() / 1000)}`,
      resourceId,
      resourceName: selectedResource.name,
      requester,
      role: requesterRole,
      department,
      date,
      startTime,
      endTime,
      purpose,
      status,
      qrToken: status === "confirmed" ? "RSFY-PREVIEW-QR" : "Generated after approval"
    });
  }

  return (
    <AppShell
      active="/bookings"
      eyebrow="Booking creation"
      title="Create a booking"
      description="Choose a resource, time slot, requester role, and purpose. The preview checks active mock bookings for conflicts."
      actions={
        <Link
          href="/bookings"
          className="inline-flex min-h-11 items-center gap-2 rounded border border-white/10 bg-ink-850 px-4 text-sm font-bold hover:bg-white/5"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Bookings
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form className="rounded-lg border border-white/10 bg-ink-900 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">Resource</span>
              <select
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none"
                value={resourceId}
                onChange={(event) => setResourceId(event.target.value)}
              >
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} - {titleCase(resource.type)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">Date</span>
              <input
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">Start time</span>
              <input
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">End time</span>
              <input
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">Requester</span>
              <input
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none placeholder:text-[#A0A0B8]"
                value={requester}
                onChange={(event) => setRequester(event.target.value)}
                placeholder="Full name"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">Department</span>
              <input
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none placeholder:text-[#A0A0B8]"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="Department"
              />
            </label>
          </div>

          <fieldset className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <legend className="px-1 text-sm font-bold text-[#C9C9DA]">Requester role</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`min-h-10 rounded border px-3 text-sm font-bold transition ${
                    requesterRole === role
                      ? "border-signal-success bg-signal-success text-ink-950"
                      : "border-white/10 bg-ink-850 text-[#C9C9DA] hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => setRequesterRole(role)}
                >
                  {titleCase(role)}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-bold text-[#C9C9DA]">Purpose</span>
            <textarea
              className="min-h-28 resize-y rounded border border-white/10 bg-ink-850 px-3 py-3 text-white outline-none placeholder:text-[#A0A0B8]"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="What is this booking for?"
              maxLength={200}
            />
          </label>

          {!isTimeValid ? (
            <p className="mt-4 rounded border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-sm font-bold text-signal-danger">
              End time must be after start time.
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-signal-success px-5 font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canSubmit}
          >
            <CalendarCheck size={19} aria-hidden="true" />
            Preview Booking
          </button>
        </form>

        <aside className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <h3 className="text-xl font-black">Slot check</h3>
            {conflict ? (
              <div className="mt-4 rounded-lg border border-signal-danger/30 bg-signal-danger/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 shrink-0 text-signal-danger" size={22} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-signal-danger">Conflict detected</p>
                    <p className="mt-1 text-sm text-[#C9C9DA]">
                      {conflictResource?.name ?? "This resource"} is already held from {conflict.startTime} to{" "}
                      {conflict.endTime} by {conflict.requester}.
                    </p>
                    <p className="mt-3 text-sm text-[#A0A0B8]">Choose a different time to continue. Waitlist handling arrives in Sprint 6.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-signal-success/30 bg-signal-success/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 shrink-0 text-signal-success" size={22} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-signal-success">No active conflict</p>
                    <p className="mt-1 text-sm text-[#C9C9DA]">This slot is clear against pending and confirmed mock bookings.</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <h3 className="text-xl font-black">Approval preview</h3>
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-white/10 bg-ink-850 p-4">
              <Clock3 className="mt-1 shrink-0 text-signal-warning" size={22} aria-hidden="true" />
              <div>
                <p className="font-bold">Booking will be marked</p>
                <div className="mt-2">
                  <StatusBadge kind="booking" status={status} />
                </div>
                <p className="mt-3 text-sm text-[#A0A0B8]">
                  Admins auto-confirm. Faculty bookings for Computer Science auto-confirm. Student classroom bookings auto-confirm; other requests stay pending.
                </p>
              </div>
            </div>
          </section>

          {preview ? (
            <section className="rounded-lg border border-signal-success/30 bg-signal-success/10 p-4">
              <h3 className="text-xl font-black text-signal-success">Booking preview created</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A0A0B8]">Resource</dt>
                  <dd className="font-bold text-right">{preview.resourceName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A0A0B8]">Time</dt>
                  <dd className="font-bold text-right">
                    {preview.date}, {preview.startTime} - {preview.endTime}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A0A0B8]">Requester</dt>
                  <dd className="font-bold text-right">{preview.requester}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A0A0B8]">QR token</dt>
                  <dd className="font-bold text-right">{preview.qrToken}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
