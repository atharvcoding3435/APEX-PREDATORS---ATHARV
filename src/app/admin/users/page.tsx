import { AdminUsersClient } from "@/app/admin/users/users-client";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { bookings, users } = await getAppData();

  return <AdminUsersClient initialUsers={users} bookings={bookings} />;
}
