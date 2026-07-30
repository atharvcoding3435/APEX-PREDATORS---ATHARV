import { Keyboard, QrCode, ScanLine } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { bookings, getBookingResource } from "@/lib/mock-data";

export default function CheckInPage() {
  const confirmedBooking = bookings.find((booking) => booking.status === "confirmed") ?? bookings[0];
  const resource = getBookingResource(confirmedBooking);

  return (
    <AppShell
      active="/checkin"
      eyebrow="QR attendance"
      title="Check-in station"
      description="Validate confirmed reservations at the room or equipment desk with QR and manual-code options."
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <div className="grid aspect-square place-items-center rounded-lg border border-white/10 bg-white">
            <div className="grid h-52 w-52 place-items-center rounded border-8 border-ink-950 text-ink-950">
              <QrCode size={128} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 text-center text-sm font-bold text-[#C9C9DA]">{confirmedBooking.qrToken}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-ink-900 p-5">
          <h3 className="text-2xl font-black">{resource?.name ?? "Confirmed booking"}</h3>
          <p className="mt-2 text-[#A0A0B8]">
            {confirmedBooking.requester} · {confirmedBooking.date} · {confirmedBooking.startTime} - {confirmedBooking.endTime}
          </p>
          <p className="mt-5 text-[#C9C9DA]">
            Scan the reservation QR or enter the booking code manually to complete attendance for a confirmed slot.
            Single-use token validation will connect to Supabase during the backend sprint.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-signal-success px-4 font-bold text-ink-950 hover:bg-white">
              <ScanLine size={19} aria-hidden="true" />
              Scan QR
            </button>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-white/10 bg-ink-850 px-4 font-bold hover:bg-white/5">
              <Keyboard size={19} aria-hidden="true" />
              Manual Code
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
