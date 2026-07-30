import type { BookingStatus, Resource } from "@/lib/types";
import { bookingStatusTone, cn, resourceStatusTone, titleCase } from "@/lib/utils";

type StatusBadgeProps =
  | {
      kind: "booking";
      status: BookingStatus;
    }
  | {
      kind: "resource";
      status: Resource["status"];
    };

export function StatusBadge(props: StatusBadgeProps) {
  const tone = props.kind === "booking" ? bookingStatusTone(props.status) : resourceStatusTone(props.status);

  return (
    <span className={cn("inline-flex min-h-7 items-center rounded px-2 text-xs font-bold", tone)}>
      {titleCase(props.status)}
    </span>
  );
}
