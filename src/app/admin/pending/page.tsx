import { PendingApprovalsClient } from "@/app/admin/pending/pending-approvals-client";
import { getAppData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PendingApprovalsPage() {
  const { bookings, resources } = await getAppData();

  return <PendingApprovalsClient initialBookings={bookings} resources={resources} />;
}
