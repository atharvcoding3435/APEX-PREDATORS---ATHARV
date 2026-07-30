import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isUserRole } from "@/lib/roles";
import { createServiceSupabaseClient, isSupabaseServiceConfigured } from "@/lib/supabase";
import type { AdminUser, UserRole } from "@/lib/types";

export const accessTokenCookie = "resourcify-access-token";
export const appSessionCookie = "resourcify-app-session";

type AuthProfileRow = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  is_active?: boolean | null;
  last_login_at?: string | null;
};

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  const rawCookie = request.headers.get("cookie") ?? "";
  const match = rawCookie.match(new RegExp(`${accessTokenCookie}=([^;]+)`));

  return match ? decodeURIComponent(match[1]) : null;
}

function getRequestCookie(request: Request, name: string) {
  const rawCookie = request.headers.get("cookie") ?? "";
  const match = rawCookie.match(new RegExp(`${name}=([^;]+)`));

  return match ? decodeURIComponent(match[1]) : null;
}

function getSessionSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "resourcify-dev-session";
}

function signUserId(userId: string) {
  return createHmac("sha256", getSessionSecret()).update(userId).digest("hex");
}

export function createSignedAppSession(userId: string) {
  return `${userId}.${signUserId(userId)}`;
}

function verifySignedAppSession(value: string | null) {
  if (!value) {
    return null;
  }

  const [userId, signature] = value.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expected = signUserId(userId);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return userId;
}

function mapProfile(row: AuthProfileRow): AdminUser {
  const role = isUserRole(String(row.role)) ? (row.role as UserRole) : "student";

  return {
    id: row.id,
    name: row.name ?? row.full_name ?? row.email ?? "Campus User",
    email: row.email ?? "",
    role,
    department: row.department ?? "Unassigned",
    isActive: row.is_active ?? true,
    bookingCount: 0,
    lastActive: row.last_login_at ?? "Not yet"
  };
}

export async function getProfileForUser(userId: string, fallbackEmail?: string | null) {
  if (!isSupabaseServiceConfigured()) {
    return null;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error || !data) {
    return null;
  }

  const profile = mapProfile(data as AuthProfileRow);
  return {
    ...profile,
    email: profile.email || fallbackEmail || ""
  };
}

export async function getAuthenticatedUserFromToken(token: string | null) {
  if (!token || !isSupabaseServiceConfigured()) {
    return null;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return getProfileForUser(data.user.id, data.user.email);
}

export async function getAuthenticatedUserFromRequest(request: Request) {
  const tokenUser = await getAuthenticatedUserFromToken(getBearerToken(request));

  if (tokenUser) {
    return tokenUser;
  }

  const userId = verifySignedAppSession(getRequestCookie(request, appSessionCookie));

  return userId ? getProfileForUser(userId) : null;
}

export async function getAuthenticatedUserFromCookies() {
  const token = cookies().get(accessTokenCookie)?.value ?? null;
  const tokenUser = await getAuthenticatedUserFromToken(token);

  if (tokenUser) {
    return tokenUser;
  }

  const userId = verifySignedAppSession(cookies().get(appSessionCookie)?.value ?? null);

  return userId ? getProfileForUser(userId) : null;
}

export async function requireAdmin(request: Request) {
  const user = await getAuthenticatedUserFromRequest(request);

  if (user?.role === "admin" && user.isActive) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: user ? "FORBIDDEN" : "UNAUTHENTICATED",
      message: user ? "Only administrators can perform this action." : "Please sign in as an administrator."
    },
    { status: user ? 403 : 401 }
  );
}
