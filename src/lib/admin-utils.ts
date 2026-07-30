import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["student", "faculty", "admin"];

export function getRequestRole(request: Request): UserRole {
  const role = request.headers.get("x-user-role")?.toLowerCase();

  return roles.includes(role as UserRole) ? (role as UserRole) : "student";
}

export function requireAdmin(request: Request) {
  if (getRequestRole(request) === "admin") {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: "FORBIDDEN",
      message: "Only administrators can perform this action."
    },
    { status: 403 }
  );
}

export function matchesSearch(values: Array<string | number | boolean>, search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return values.join(" ").toLowerCase().includes(query);
}
