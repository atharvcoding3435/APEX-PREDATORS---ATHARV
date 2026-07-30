import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-utils";
import { users } from "@/lib/mock-data";

const updateUserSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean()
});

export function GET(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  return NextResponse.json({ success: true, data: users });
}

export async function PATCH(request: Request) {
  const forbidden = requireAdmin(request);

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

  const user = users.find((item) => item.id === parsed.data.id);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "USER_NOT_FOUND", message: "The requested user could not be found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { ...user, isActive: parsed.data.isActive } });
}
