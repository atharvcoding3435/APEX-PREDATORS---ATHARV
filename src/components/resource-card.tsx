import Link from "next/link";
import { LockKeyhole, MapPin, Users } from "lucide-react";
import type { Resource } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { titleCase } from "@/lib/utils";

type ResourceCardProps = {
  resource: Resource;
  canBook?: boolean;
  restrictionReason?: string;
};

export function ResourceCard({ resource, canBook = true, restrictionReason }: ResourceCardProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-ink-850 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{resource.name}</h3>
          <p className="text-sm text-[#A0A0B8]">{titleCase(resource.type)}</p>
        </div>
        <StatusBadge kind="resource" status={resource.status} />
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <p className="flex items-center gap-2 text-[#C9C9DA]">
          <MapPin size={16} aria-hidden="true" />
          {resource.location}
        </p>
        <p className="flex items-center gap-2 text-[#C9C9DA]">
          <Users size={16} aria-hidden="true" />
          {resource.capacity} capacity
        </p>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-[#A0A0B8]">Weekly utilization</span>
          <strong>{resource.utilization}%</strong>
        </div>
        <div className="h-2 overflow-hidden rounded bg-white/10">
          <div className="h-full rounded" style={{ width: `${resource.utilization}%`, backgroundColor: resource.color }} />
        </div>
      </div>
      {canBook ? (
        <Link
          className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded border border-white/10 bg-white/[0.03] text-sm font-bold hover:bg-white/10"
          href={`/bookings/new?resourceId=${resource.id}`}
        >
          View Slots
        </Link>
      ) : (
        <div className="mt-5 rounded border border-white/10 bg-white/[0.03] p-3 text-sm font-bold text-[#A0A0B8]">
          <p className="flex items-center gap-2">
            <LockKeyhole size={16} aria-hidden="true" />
            View only
          </p>
          {restrictionReason ? <p className="mt-2 text-xs font-medium leading-5">{restrictionReason}</p> : null}
        </div>
      )}
    </article>
  );
}
