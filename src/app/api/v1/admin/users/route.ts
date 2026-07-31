import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getUsersData } from "@/lib/data";
import { users } from "@/lib/mock-data";
import { createServiceSupabaseClient, isSupabaseServiceConfigured } from "@/lib/supabase";

const updateUserSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean()
});

export async function GET(request: Request) {
  const forbidden = await requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  return NextResponse.json({ success: true, data: await getUsersData() });
}

export async function PATCH(request: Request) {
  const forbidden = await requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_USER_UPDATE",
        message: "User update details are incomplete or invalid.",
        issues: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const liveUsers = await getUsersData();
  const user = liveUsers.find((item) => item.id === parsed.data.id) ?? users.find((item) => item.id === parsed.data.id);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "USER_NOT_FOUND", message: "The requested user could not be found." },
      { status: 404 }
    );
  }

  if (isSupabaseServiceConfigured()) {
    const supabase = createServiceSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .update({ is_active: parsed.data.isActive })
      .eq("id", parsed.data.id)
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json({
        success: true,
        data: {
          ...user,
          name: String(data.name ?? data.full_name ?? user.name),
          email: String(data.email ?? user.email),
          role: user.role,
          department: String(data.department ?? user.department),
          isActive: Boolean(data.is_active ?? parsed.data.isActive),
          lastActive: String(data.last_login_at ?? user.lastActive)
        },
        source: "supabase"
      });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(parsed.data.id, {
      ban_duration: parsed.data.isActive ? "none" : "87600h"
    });

    if (!authError && authData.user) {
      return NextResponse.json({
        success: true,
        data: {
          ...user,
          email: authData.user.email ?? user.email,
          isActive: parsed.data.isActive
        },
        source: "supabase-auth"
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...user, isActive: parsed.data.isActive },
      source: "session",
      message: "User status updated in the UI. Apply the user status migration for database persistence."
    });
  }

  return NextResponse.json({ success: true, data: { ...user, isActive: parsed.data.isActive }, source: "mock" });
}
