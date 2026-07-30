import type { UserRole } from "@/lib/types";

export const userRoles: UserRole[] = ["student", "faculty", "club", "guest", "admin"];
export const publicSignupRoles: UserRole[] = ["student", "faculty", "club", "guest"];

export function isUserRole(role: string): role is UserRole {
  return userRoles.includes(role as UserRole);
}
