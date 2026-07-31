import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabaseClient, isSupabaseServiceConfigured } from "@/lib/supabase";

const settingsSchema = z.object({
  maxBookingDurationHours: z.number().int().min(1).max(8),
  maxAdvanceBookingDays: z.number().int().min(1).max(120),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/),
  approvalRequired: z.boolean()
});

type BookingSettings = z.infer<typeof settingsSchema>;

const defaultSettings: BookingSettings = {
  maxBookingDurationHours: 4,
  maxAdvanceBookingDays: 30,
  workingHoursStart: "08:00",
  workingHoursEnd: "18:00",
  approvalRequired: true
};

const globalSettings = globalThis as typeof globalThis & {
  __resourcifySettings?: BookingSettings;
};

function normalizeSettings(value: unknown): BookingSettings {
  const parsed = settingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultSettings;
}

async function readSettings() {
  if (!isSupabaseServiceConfigured()) {
    return { data: globalSettings.__resourcifySettings ?? defaultSettings, source: "memory" };
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "booking")
      .maybeSingle();

    if (error || !data) {
      return { data: globalSettings.__resourcifySettings ?? defaultSettings, source: "memory" };
    }

    return { data: normalizeSettings(data.value), source: "supabase" };
  } catch {
    return { data: globalSettings.__resourcifySettings ?? defaultSettings, source: "memory" };
  }
}

async function writeSettings(settings: BookingSettings) {
  globalSettings.__resourcifySettings = settings;

  if (!isSupabaseServiceConfigured()) {
    return "memory";
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "booking",
        value: settings,
        updated_at: new Date().toISOString()
      },
      { onConflict: "key" }
    );

    return error ? "memory" : "supabase";
  } catch {
    return "memory";
  }
}

export async function GET(request: Request) {
  const forbidden = await requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  const settings = await readSettings();

  return NextResponse.json({
    success: true,
    data: settings.data,
    source: settings.source
  });
}

export async function PATCH(request: Request) {
  const forbidden = await requireAdmin(request);

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

  const source = await writeSettings(parsed.data);

  return NextResponse.json({ success: true, data: parsed.data, source });
}
