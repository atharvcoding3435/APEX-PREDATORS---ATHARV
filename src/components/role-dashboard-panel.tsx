"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useDemoRole } from "@/components/demo-role-switcher";
import { getBookableTypes, getRoleDescription } from "@/lib/role-access";
import { titleCase } from "@/lib/utils";

export function RoleDashboardPanel() {
  const { role } = useDemoRole();
  const bookableTypes = getBookableTypes(role);

  return (
    <section className="mb-6 rounded-lg border border-signal-info/30 bg-signal-info/10 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-signal-info">{titleCase(role)} portal</p>
          <h3 className="mt-1 text-xl font-black">Personalized resource access</h3>
          <p className="mt-2 max-w-3xl text-sm text-[#C9C9DA]">{getRoleDescription(role)}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white">
            <LockKeyhole size={16} aria-hidden="true" />
            Can request: {bookableTypes.length > 0 ? bookableTypes.map(titleCase).join(", ") : "No direct booking"}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/10 bg-ink-850 px-4 text-sm font-bold hover:bg-white/5"
          href="/resources"
        >
          Browse Role Resources
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
