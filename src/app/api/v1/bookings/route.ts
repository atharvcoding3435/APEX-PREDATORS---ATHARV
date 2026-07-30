import { NextResponse } from "next/server";
import { z } from "zod";
import { bookings, getResource, resources } from "@/lib/mock-data";
import { requireAdmin } from "@/lib/auth";
import { getBookingsData, getResourcesData } from "@/lib/data";
import { getResourceAccess } from "@/lib/role-access";
import { userRoles } from "@/lib/roles";
import { createServiceSupabaseClient, isSupabaseServiceConfigured } from "@/lib/supabase";
import {
  findBookingConflict,
  formatTimeRange,
  getDefaultBookingStatus,
  suggestBookingAlternatives,
  validateBookingRequest
} from "@/lib/booking-rules";
import type { Booking, UserRole } from "@/lib/types";

const createBookingSchema = z.object({
  resourceId: z.string().min(1),
  requester: z.string().min(2),
  requesterRole: z.enum(userRoles as [string, ...string[]]).default("student"),
  department: z.string().min(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  purpose: z.string().min(5).max(200)
});

const updateBookingSchema = z.object({
  id: z.string().min(1),
  resourceId: z.string().min(1).optional(),
  status: z.enum(["pending", "approved", "active", "completed", "cancelled", "rejected"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

function getRequestOriginDate(request: Request) {
  const demoNow = request.headers.get("x-demo-now");
  return demoNow ? new Date(demoNow) : new Date();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
}

async function upsertDemoRequester(input: z.infer<typeof createBookingSchema>) {
  const supabase = createServiceSupabaseClient();
  const email = `${slugify(input.requester) || "demo"}.${input.requesterRole}@demo.resourcify.local`;
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        email,
        name: input.requester,
        role: input.requesterRole,
        department: input.department
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error ?? new Error("Unable to prepare requester profile.");
  }

  return String(data.id);
}

async function insertSupabaseBooking(input: z.infer<typeof createBookingSchema>, status: string) {
  const supabase = createServiceSupabaseClient();
  const requesterId = await upsertDemoRequester(input);
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      resource_id: input.resourceId,
      requester_id: requesterId,
      created_by: requesterId,
      status: toDatabaseStatus(status as Booking["status"]),
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      purpose: input.purpose
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create booking.");
  }

  return {
    id: String(data.id),
    resourceId: input.resourceId,
    requester: input.requester,
    role: input.requesterRole as UserRole,
    department: input.department,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    purpose: input.purpose,
    status
  };
}

function toApiBooking(row: Record<string, unknown>, fallback: Booking): Booking {
  const rawStatus = String(row.status ?? fallback.status);
  const status = rawStatus === "confirmed" ? "approved" : rawStatus;

  return {
    ...fallback,
    id: String(row.id ?? fallback.id),
    resourceId: String(row.resource_id ?? fallback.resourceId),
    date: String(row.date ?? fallback.date),
    startTime: String(row.start_time ?? fallback.startTime).slice(0, 5),
    endTime: String(row.end_time ?? fallback.endTime).slice(0, 5),
    purpose: String(row.purpose ?? fallback.purpose),
    status: status as Booking["status"]
  };
}

function toDatabaseStatus(status: Booking["status"]) {
  return status === "approved" ? "confirmed" : status;
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

  const liveResources = await getResourcesData();
  const liveBookings = await getBookingsData();
  const resource = liveResources.find((item) => item.id === parsed.data.resourceId) ?? getResource(parsed.data.resourceId);

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

  const access = getResourceAccess(parsed.data.requesterRole as UserRole, resource);

  if (!access.canBook) {
    return NextResponse.json(
      {
        success: false,
        error: "RESOURCE_NOT_ALLOWED_FOR_ROLE",
        message: access.reason
      },
      { status: 403 }
    );
  }

  const activeBookings = isSupabaseServiceConfigured() ? liveBookings : bookings;
  const activeResources = isSupabaseServiceConfigured() ? liveResources : resources;
  const conflict = findBookingConflict(parsed.data, activeBookings);

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
        suggestions: suggestBookingAlternatives(parsed.data, activeResources, activeBookings)
      },
      { status: 409 }
    );
  }

  const status = getDefaultBookingStatus(parsed.data.requesterRole as UserRole, resource);

  if (isSupabaseServiceConfigured()) {
    try {
      const data = await insertSupabaseBooking(parsed.data, status);

      return NextResponse.json(
        {
          success: true,
          data,
          source: "supabase"
        },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "BOOKING_CREATE_FAILED",
          message: error instanceof Error ? error.message : "Booking could not be saved."
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: `preview-${Date.now()}`,
        ...parsed.data,
        status
      },
      source: "mock"
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const forbidden = await requireAdmin(request);

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

  const liveBookings = await getBookingsData();
  const existingBooking = liveBookings.find((booking) => booking.id === parsed.data.id) ?? bookings.find((booking) => booking.id === parsed.data.id);

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

  if (isSupabaseServiceConfigured()) {
    const updatePayload: Record<string, string> = {};

    if (parsed.data.status) updatePayload.status = toDatabaseStatus(parsed.data.status);
    if (parsed.data.resourceId) updatePayload.resource_id = parsed.data.resourceId;
    if (parsed.data.date) updatePayload.date = parsed.data.date;
    if (parsed.data.startTime) updatePayload.start_time = parsed.data.startTime;
    if (parsed.data.endTime) updatePayload.end_time = parsed.data.endTime;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ success: true, data: existingBooking, source: "supabase" });
    }

    const nextBooking = { ...existingBooking, ...parsed.data };
    const rescheduleConflict =
      parsed.data.resourceId || parsed.data.date || parsed.data.startTime || parsed.data.endTime
        ? findBookingConflict(nextBooking, liveBookings.filter((booking) => booking.id !== parsed.data.id))
        : null;

    if (rescheduleConflict) {
      return NextResponse.json(
        {
          success: false,
          error: "RESOURCE_ALREADY_BOOKED",
          message: "This resource has already been booked for the selected time.",
          conflictingBooking: {
            id: rescheduleConflict.id,
            resourceId: rescheduleConflict.resourceId,
            startTime: rescheduleConflict.startTime,
            endTime: rescheduleConflict.endTime,
            timeRange: formatTimeRange(rescheduleConflict.startTime, rescheduleConflict.endTime),
            status: rescheduleConflict.status
          }
        },
        { status: 409 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", parsed.data.id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: "BOOKING_UPDATE_FAILED",
          message: error?.message ?? "Booking could not be updated."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toApiBooking(data as Record<string, unknown>, updatedBooking),
      source: "supabase"
    });
  }

  return NextResponse.json({
    success: true,
    data: updatedBooking,
    source: "mock"
  });
}
