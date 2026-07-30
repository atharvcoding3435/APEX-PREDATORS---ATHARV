import { ResourcesClient } from "@/app/resources/resources-client";
import { getResourcesData } from "@/lib/data";

export default async function ResourcesPage() {
  const resources = await getResourcesData();

  return <ResourcesClient resources={resources.filter((resource) => resource.isActive)} />;
}
