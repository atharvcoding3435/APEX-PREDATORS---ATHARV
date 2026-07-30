import { NextResponse } from "next/server";
import { z } from "zod";
import { accessTokenCookie, getProfileForUser } from "@/lib/auth";
import { publicSignupRoles } from "@/lib/roles";
import { createAnonSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
  role: z.enum(publicSignupRoles as [string, ...string[]]),
  department: z.string().trim().min(2)
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_SIGNUP_PAYLOAD",
        message: "Enter your name, email, password, role, and department."
      },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      name: parsed.data.name,
      role: parsed.data.role,
      department: parsed.data.department
    }
  });

  if (error || !data.user) {
    return NextResponse.json(
      {
        success: false,
        error: "SIGNUP_FAILED",
        message: error?.message ?? "Unable to create this account."
      },
      { status: 400 }
    );
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: data.user.id,
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    department: parsed.data.department
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);

    return NextResponse.json(
      {
        success: false,
        error: "PROFILE_CREATE_FAILED",
        message: profileError.message.includes("users_role_check")
          ? "Your Supabase users.role constraint must include club and guest before this role can be used."
          : profileError.message
      },
      { status: 400 }
    );
  }

  const anonSupabase = createAnonSupabaseClient();
  const { data: sessionData, error: loginError } = await anonSupabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (loginError || !sessionData.session?.access_token) {
    return NextResponse.json({
      success: true,
      data: await getProfileForUser(data.user.id, parsed.data.email),
      message: "Account created. Please sign in with your new credentials."
    });
  }

  const profile = await getProfileForUser(data.user.id, parsed.data.email);
  const response = NextResponse.json({ success: true, data: profile });
  response.cookies.set(accessTokenCookie, sessionData.session.access_token, cookieOptions);

  return response;
}
