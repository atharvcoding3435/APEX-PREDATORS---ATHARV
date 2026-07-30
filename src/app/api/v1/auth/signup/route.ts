import { NextResponse } from "next/server";
import { z } from "zod";
import { accessTokenCookie, appSessionCookie, createSignedAppSession, getProfileForUser } from "@/lib/auth";
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

async function findAuthUserByEmail(email: string) {
  const supabase = createServiceSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw error;
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);

    if (user || data.users.length < 1000) {
      return user ?? null;
    }
  }

  return null;
}

async function createOrRepairAuthUser(input: z.infer<typeof signupSchema>) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      role: input.role,
      department: input.department
    }
  });

  if (!error && data.user) {
    return { userId: data.user.id, created: true };
  }

  const existingUser = await findAuthUserByEmail(input.email);

  if (!existingUser) {
    throw new Error(error?.message ?? "Unable to create this account.");
  }

  const existingProfile = await getProfileForUser(existingUser.id, existingUser.email);

  if (existingProfile?.role === "admin") {
    throw new Error("Admin accounts cannot be repaired from public signup. Use the existing admin password or update it in Supabase.");
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      role: input.role,
      department: input.department
    }
  });

  if (updateError) {
    throw updateError;
  }

  return { userId: existingUser.id, created: false };
}

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
  let authUser: { userId: string; created: boolean };

  try {
    authUser = await createOrRepairAuthUser(parsed.data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "SIGNUP_FAILED",
        message: error instanceof Error ? error.message : "Unable to create this account."
      },
      { status: 400 }
    );
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: authUser.userId,
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    department: parsed.data.department
  });

  if (profileError) {
    if (authUser.created) {
      await supabase.auth.admin.deleteUser(authUser.userId);
    }

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
    const response = NextResponse.json({
      success: true,
      data: await getProfileForUser(authUser.userId, parsed.data.email),
      message: "Account is ready."
    });
    response.cookies.set(appSessionCookie, createSignedAppSession(authUser.userId), cookieOptions);

    return response;
  }

  const profile = await getProfileForUser(authUser.userId, parsed.data.email);
  const response = NextResponse.json({ success: true, data: profile });
  response.cookies.set(accessTokenCookie, sessionData.session.access_token, cookieOptions);
  response.cookies.set(appSessionCookie, createSignedAppSession(authUser.userId), cookieOptions);

  return response;
}
