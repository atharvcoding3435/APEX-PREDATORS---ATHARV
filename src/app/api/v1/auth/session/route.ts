import { NextResponse } from "next/server";
import { z } from "zod";
import { accessTokenCookie, appSessionCookie, getAuthenticatedUserFromRequest } from "@/lib/auth";

const sessionSchema = z.object({
  accessToken: z.string().min(20)
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

export async function POST(request: Request) {
  const parsed = sessionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_SESSION",
        message: "A valid Supabase access token is required."
      },
      { status: 400 }
    );
  }

  const user = await getAuthenticatedUserFromRequest(
    new Request(request.url, {
      headers: { authorization: `Bearer ${parsed.data.accessToken}` }
    })
  );

  if (!user || !user.isActive) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED_USER",
        message: "This account is not active in Resourcify."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true, data: user });
  response.cookies.set(accessTokenCookie, parsed.data.accessToken, cookieOptions);

  return response;
}

export function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(accessTokenCookie, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(appSessionCookie, "", { ...cookieOptions, maxAge: 0 });

  return response;
}
