import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-utils";

const settingsSchema = z.object({
  maxBookingDurationHours: z.number().int().min(1).max(8),
  maxAdvanceBookingDays: z.number().int().min(1).max(120),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/),
  approvalRequired: z.boolean()
});

export function GET(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  return NextResponse.json({
    success: true,
    data: {
      maxBookingDurationHours: 4,
      maxAdvanceBookingDays: 30,
      workingHoursStart: "08:00",
      workingHoursEnd: "18:00",
      approvalRequired: true
    }
  });
}

export async function PATCH(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_SETTINGS",
        message: "Settings are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, data: parsed.data });
}
