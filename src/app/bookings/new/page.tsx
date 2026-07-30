"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  Radio,
  ShieldAlert,
  Sparkles,
  XCircle
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  findBookingConflict,
  formatTimeRange,
  getDefaultBookingStatus,
  getSlotStatus,
  isPastSlot,
  suggestBookingAlternatives,
  validateBookingRequest
} from "@/lib/booking-rules";
import { bookings, getBookingResource, resources } from "@/lib/mock-data";
import type { Booking, BookingAlternative, UserRole } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

type BookingPreview = Booking & {
  resourceName: string;
};

type ConflictResponse = {
  success: false;
  error: "RESOURCE_ALREADY_BOOKED";
  message: string;
  conflictingBooking: {
    id: string;
    resourceId: string;
    resourceName: string;
    startTime: string;
    endTime: string;
    timeRange: string;
    status: "pending" | "approved" | "active";
  };
  suggestions: BookingAlternative[];
};

const roleOptions: UserRole[] = ["student", "faculty", "admin"];
const slotStarts = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

function getSlotClass(status: string, isSelected: boolean) {
  if (isSelected) {
    return "border-white bg-white text-ink-950";
  }

  if (status === "available") {
    return "border-signal-success/40 bg-signal-success/10 text-signal-success hover:bg-signal-success/20";
  }

  if (status === "pending") {
    return "border-signal-warning/40 bg-signal-warning/10 text-signal-warning";
  }

  if (status === "booked") {
    return "border-signal-danger/40 bg-signal-danger/10 text-signal-danger";
  }

  return "border-white/10 bg-white/[0.04] text-[#7C7C90]";
}

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
  const [serverConflict, setServerConflict] = useState<ConflictResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedResource = resources.find((resource) => resource.id === resourceId);
  const bookingInput = { resourceId, date, startTime, endTime };
  const clientConflict = useMemo(() => findBookingConflict(bookingInput, bookings), [date, endTime, resourceId, startTime]);
  const conflict = serverConflict?.conflictingBooking ?? clientConflict;
  const conflictResource = clientConflict ? getBookingResource(clientConflict) : selectedResource;
  const validation = useMemo(() => validateBookingRequest(bookingInput), [date, endTime, resourceId, startTime]);
  const alternatives = useMemo(
    () => serverConflict?.suggestions ?? (clientConflict ? suggestBookingAlternatives(bookingInput, resources, bookings) : []),
    [clientConflict, date, endTime, resourceId, serverConflict, startTime]
  );
  const status = getDefaultBookingStatus(requesterRole, selectedResource);
  const slotStatus = getSlotStatus(bookingInput, bookings);
  const canSubmit = Boolean(
    selectedResource &&
      requester.trim().length >= 2 &&
      department.trim().length >= 2 &&
      purpose.trim().length >= 5 &&
      validation.valid &&
      !clientConflict &&
      !isSubmitting
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);
    setServerConflict(null);
    setPreview(null);

    if (!selectedResource || !validation.valid) {
      setToast(validation.errors[0] ?? "Please complete the booking form.");
      return;
    }

    if (clientConflict) {
      setToast("Resource unavailable. Please choose another time slot or use a suggested alternative.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resourceId,
          requester,
          requesterRole,
          department,
          date,
          startTime,
          endTime,
          purpose
        })
      });
      const payload = await response.json();

      if (response.status === 409) {
        setServerConflict(payload as ConflictResponse);
        setToast("Resource unavailable. Review the conflict details and suggested alternatives.");
        return;
      }

      if (!response.ok) {
        setToast(payload.message ?? "Booking could not be created. Please check the form.");
        return;
      }

      setPreview({
        ...payload.data,
        resourceName: selectedResource.name,
        role: requesterRole
      });
      setToast("Booking preview created successfully.");
    } catch {
      setToast("Network error while checking availability. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function applyAlternative(alternative: BookingAlternative) {
    setResourceId(alternative.resourceId);
    setStartTime(alternative.startTime);
    setEndTime(alternative.endTime);
    setServerConflict(null);
    setToast(null);
  }

  return (
    <AppShell
      active="/bookings"
      eyebrow="Booking creation"
      title="Create a booking"
      description="Choose a resource, time slot, requester role, and purpose. Availability is checked before submit and again by the API."
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
      {toast ? (
        <div
          className="mb-4 flex items-start gap-3 rounded-lg border border-white/10 bg-ink-900 p-4 text-sm font-bold text-white"
          role="status"
          aria-live="polite"
        >
          <ShieldAlert className="mt-0.5 shrink-0 text-signal-warning" size={18} aria-hidden="true" />
          {toast}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <form className="rounded-lg border border-white/10 bg-ink-900 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">Resource</span>
              <select
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none"
                value={resourceId}
                onChange={(event) => {
                  setResourceId(event.target.value);
                  setServerConflict(null);
                }}
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
                onChange={(event) => {
                  setDate(event.target.value);
                  setServerConflict(null);
                }}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">Start time</span>
              <input
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none"
                type="time"
                value={startTime}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  setServerConflict(null);
                }}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-[#C9C9DA]">End time</span>
              <input
                className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none"
                type="time"
                value={endTime}
                onChange={(event) => {
                  setEndTime(event.target.value);
                  setServerConflict(null);
                }}
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
                  className={cn(
                    "min-h-10 rounded border px-3 text-sm font-bold transition",
                    requesterRole === role
                      ? "border-signal-success bg-signal-success text-ink-950"
                      : "border-white/10 bg-ink-850 text-[#C9C9DA] hover:bg-white/5 hover:text-white"
                  )}
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

          {validation.errors.length > 0 ? (
            <div className="mt-4 rounded border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-sm font-bold text-signal-danger">
              {validation.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <button
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-signal-success px-5 font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canSubmit}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={19} aria-hidden="true" /> : <CalendarCheck size={19} aria-hidden="true" />}
            {isSubmitting ? "Checking Availability" : "Create Booking"}
          </button>
        </form>

        <aside className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <h3 className="text-xl font-black">Real-time availability</h3>
            <div
              className={cn(
                "mt-4 flex items-start gap-3 rounded-lg border p-4",
                slotStatus === "available" && "border-signal-success/30 bg-signal-success/10",
                slotStatus === "pending" && "border-signal-warning/30 bg-signal-warning/10",
                slotStatus === "booked" && "border-signal-danger/30 bg-signal-danger/10",
                slotStatus === "past" && "border-white/10 bg-white/[0.04]"
              )}
            >
              {slotStatus === "available" ? (
                <CheckCircle2 className="mt-1 shrink-0 text-signal-success" size={22} aria-hidden="true" />
              ) : slotStatus === "past" ? (
                <XCircle className="mt-1 shrink-0 text-[#7C7C90]" size={22} aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-1 shrink-0 text-signal-danger" size={22} aria-hidden="true" />
              )}
              <div>
                <p
                  className={cn(
                    "font-bold",
                    slotStatus === "available" && "text-signal-success",
                    slotStatus === "pending" && "text-signal-warning",
                    slotStatus === "booked" && "text-signal-danger",
                    slotStatus === "past" && "text-[#A0A0B8]"
                  )}
                >
                  {slotStatus === "available" ? "Available" : slotStatus === "pending" ? "Pending request exists" : slotStatus === "booked" ? "Already booked" : "Past slot"}
                </p>
                <p className="mt-1 text-sm text-[#C9C9DA]">
                  {slotStatus === "available"
                    ? "This slot is clear against active bookings. Supabase Realtime will refresh this status when connected."
                    : "Pending, approved, and active bookings block this selection."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <h3 className="text-xl font-black">Booking calendar</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {slotStarts.map((slotStart) => {
                const slotEnd = `${String(Number(slotStart.slice(0, 2)) + 1).padStart(2, "0")}:00`;
                const status = getSlotStatus({ resourceId, date, startTime: slotStart, endTime: slotEnd }, bookings);
                const conflictForSlot = findBookingConflict({ resourceId, date, startTime: slotStart, endTime: slotEnd }, bookings);
                const isSelected = startTime === slotStart && endTime === slotEnd;

                return (
                  <button
                    key={slotStart}
                    type="button"
                    className={cn("min-h-20 rounded border p-3 text-left text-sm font-bold transition", getSlotClass(status, isSelected))}
                    title={conflictForSlot ? `${conflictForSlot.requester}: ${formatTimeRange(conflictForSlot.startTime, conflictForSlot.endTime)}` : titleCase(status)}
                    onClick={() => {
                      if (!isPastSlot(date, slotEnd)) {
                        setStartTime(slotStart);
                        setEndTime(slotEnd);
                        setServerConflict(null);
                      }
                    }}
                  >
                    <span>{formatTimeRange(slotStart, slotEnd)}</span>
                    <span className="mt-1 block text-xs">{titleCase(status)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-[#A0A0B8] sm:grid-cols-4">
              <span className="rounded bg-signal-success/10 px-2 py-1 text-signal-success">Green: Available</span>
              <span className="rounded bg-signal-warning/10 px-2 py-1 text-signal-warning">Amber: Pending</span>
              <span className="rounded bg-signal-danger/10 px-2 py-1 text-signal-danger">Red: Booked</span>
              <span className="rounded bg-white/[0.04] px-2 py-1">Grey: Past</span>
            </div>
          </section>

          {conflict ? (
            <section className="rounded-lg border border-signal-danger/30 bg-signal-danger/10 p-4" role="alert">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 shrink-0 text-signal-danger" size={22} aria-hidden="true" />
                <div>
                  <h3 className="text-xl font-black text-signal-danger">Resource Unavailable</h3>
                  <p className="mt-2 text-sm text-[#F3D4D4]">
                    {conflictResource?.name ?? selectedResource?.name ?? "This resource"} is already booked from{" "}
                    {formatTimeRange(conflict.startTime, conflict.endTime)}.
                  </p>
                  <p className="mt-2 text-sm text-[#F3D4D4]">Please choose another time slot or join the waitlist.</p>
                </div>
              </div>
            </section>
          ) : null}

          {alternatives.length > 0 ? (
            <section className="rounded-lg border border-white/10 bg-ink-900 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-signal-success" size={20} aria-hidden="true" />
                <h3 className="text-xl font-black">Suggested alternatives</h3>
              </div>
              <div className="mt-4 space-y-2">
                {alternatives.map((alternative) => (
                  <button
                    key={alternative.id}
                    type="button"
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded border border-white/10 bg-ink-850 px-3 text-left text-sm font-bold hover:bg-white/5"
                    onClick={() => applyAlternative(alternative)}
                  >
                    <span>
                      <span className="text-signal-success">✓</span> {alternative.label}
                    </span>
                    <span className="text-xs text-[#A0A0B8]">{alternative.reason}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

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
                  Admins auto-approve. Faculty bookings for Computer Science auto-approve. Student classroom bookings auto-approve; other requests stay pending.
                </p>
              </div>
            </div>
          </section>

          {preview ? (
            <section className="rounded-lg border border-signal-success/30 bg-signal-success/10 p-4">
              <h3 className="text-xl font-black text-signal-success">Booking created</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A0A0B8]">Resource</dt>
                  <dd className="text-right font-bold">{preview.resourceName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A0A0B8]">Time</dt>
                  <dd className="text-right font-bold">
                    {preview.date}, {formatTimeRange(preview.startTime, preview.endTime)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A0A0B8]">Requester</dt>
                  <dd className="text-right font-bold">{preview.requester}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
