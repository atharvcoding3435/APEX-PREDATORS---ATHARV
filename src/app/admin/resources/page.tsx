import { AdminResourcesClient } from "@/app/admin/resources/resources-client";
import { getResourcesData } from "@/lib/data";

export default async function AdminResourcesPage() {
  const resources = await getResourcesData();

  return <AdminResourcesClient initialResources={resources} />;
}
