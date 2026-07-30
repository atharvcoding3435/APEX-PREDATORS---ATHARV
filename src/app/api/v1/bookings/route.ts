import { NextResponse } from "next/server";
import { z } from "zod";
import { bookings, getResource, resources } from "@/lib/mock-data";
import { requireAdmin } from "@/lib/admin-utils";
import { getBookingsData } from "@/lib/data";
import { isSupabaseServiceConfigured } from "@/lib/supabase";
import {
  findBookingConflict,
  formatTimeRange,
  getDefaultBookingStatus,
  suggestBookingAlternatives,
  validateBookingRequest
} from "@/lib/booking-rules";

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

const updateBookingSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "approved", "active", "completed", "cancelled", "rejected"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

function getRequestOriginDate(request: Request) {
  const demoNow = request.headers.get("x-demo-now");
  return demoNow ? new Date(demoNow) : new Date();
}

export async function GET() {
  return NextResponse.json({
    data: await getBookingsData(),
    source: isSupabaseServiceConfigured() ? "supabase" : "mock"
  });
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

  const validation = validateBookingRequest(parsed.data, getRequestOriginDate(request));

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_BOOKING_REQUEST",
        message: validation.errors[0] ?? "Booking request is invalid.",
        errors: validation.errors
      },
      { status: 400 }
    );
  }

  const resource = getResource(parsed.data.resourceId);

  if (!resource) {
    return NextResponse.json(
      {
        success: false,
        error: "RESOURCE_NOT_FOUND",
        message: "The selected resource could not be found."
      },
      { status: 404 }
    );
  }

  const conflict = findBookingConflict(parsed.data, bookings);

  if (conflict) {
    return NextResponse.json(
      {
        success: false,
        error: "RESOURCE_ALREADY_BOOKED",
        message: "This resource has already been booked for the selected time.",
        conflictingBooking: {
          id: conflict.id,
          resourceId: conflict.resourceId,
          resourceName: resource.name,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          timeRange: formatTimeRange(conflict.startTime, conflict.endTime),
          status: conflict.status
        },
        suggestions: suggestBookingAlternatives(parsed.data, resources, bookings)
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: `preview-${Date.now()}`,
        ...parsed.data,
        status: getDefaultBookingStatus(parsed.data.requesterRole, resource)
      }
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_BOOKING_UPDATE",
        message: "Booking update details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const existingBooking = bookings.find((booking) => booking.id === parsed.data.id);

  if (!existingBooking) {
    return NextResponse.json(
      {
        success: false,
        error: "BOOKING_NOT_FOUND",
        message: "The requested booking could not be found."
      },
      { status: 404 }
    );
  }

  const updatedBooking = {
    ...existingBooking,
    ...parsed.data
  };

  return NextResponse.json({
    success: true,
    data: updatedBooking
  });
}
