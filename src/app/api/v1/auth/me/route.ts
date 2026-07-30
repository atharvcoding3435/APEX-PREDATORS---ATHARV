import { NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHENTICATED",
        message: "Please sign in to continue."
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}
