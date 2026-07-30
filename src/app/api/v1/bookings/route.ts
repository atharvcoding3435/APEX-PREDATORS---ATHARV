import { NextResponse } from "next/server";
import { z } from "zod";
import { bookings, getResource } from "@/lib/mock-data";
import { findBookingConflict, getDefaultBookingStatus } from "@/lib/booking-rules";

const createBookingSchema = z.object({
  resourceId: z.string().min(1),
  requester: z.string().min(2),
  requesterRole: z.enum(["student", "faculty", "admin"]).default("student"),
  department: z.string().min(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  purpose: z.string().min(5).max(200)
});

export function GET() {
  return NextResponse.json({ data: bookings });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "Booking request is invalid.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const conflict = findBookingConflict(parsed.data, bookings);

  if (conflict) {
    return NextResponse.json(
      {
        error: "booking_conflict",
        message: "This resource is already booked for an overlapping slot.",
        conflict
      },
      { status: 409 }
    );
  }

  const resource = getResource(parsed.data.resourceId);

  return NextResponse.json(
    {
      data: {
        id: `preview-${Date.now()}`,
        ...parsed.data,
        status: getDefaultBookingStatus(parsed.data.requesterRole, resource),
        qrToken: "generated-after-confirmation"
      }
    },
    { status: 201 }
  );
}
