import { NextResponse } from "next/server";
import { z } from "zod";
import { accessTokenCookie, getProfileForUser } from "@/lib/auth";
import { createAnonSupabaseClient } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_LOGIN_PAYLOAD",
        message: "Enter a valid email and password."
      },
      { status: 400 }
    );
  }

  const supabase = createAnonSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.session?.access_token || !data.user) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Unable to sign in with these credentials. If this email was added from Supabase dashboard, use Create Account once to set its password."
      },
      { status: 401 }
    );
  }

  const profile = await getProfileForUser(data.user.id, data.user.email);

  if (!profile) {
    return NextResponse.json(
      {
        success: false,
        error: "PROFILE_NOT_FOUND",
        message: `Login worked, but no Resourcify user profile exists for ${data.user.email}. Add a public.users row with id ${data.user.id}.`
      },
      { status: 403 }
    );
  }

  if (!profile.isActive) {
    return NextResponse.json(
      {
        success: false,
        error: "USER_DISABLED",
        message: "This Resourcify account is disabled. Ask an admin to enable it."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true, data: profile });
  response.cookies.set(accessTokenCookie, data.session.access_token, cookieOptions);

  return response;
}
