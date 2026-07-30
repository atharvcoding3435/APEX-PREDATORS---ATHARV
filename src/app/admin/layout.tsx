import { redirect } from "next/navigation";
import { getAuthenticatedUserFromCookies, isAuthEnforced } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthEnforced()) {
    return children;
  }

  const user = await getAuthenticatedUserFromCookies();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "admin" || !user.isActive) {
    redirect("/dashboard");
  }

  return children;
}
