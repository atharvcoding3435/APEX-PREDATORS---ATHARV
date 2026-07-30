import { ListFilter, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResourceCard } from "@/components/resource-card";
import { resources } from "@/lib/mock-data";

export default function ResourcesPage() {
  return (
    <AppShell
      active="/resources"
      eyebrow="Resource registry"
      title="Find and manage resources"
      actions={
        <button className="inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white">
          <Plus size={18} aria-hidden="true" />
          Add Resource
        </button>
      }
    >
      <section className="mb-5 flex flex-col gap-3 rounded-lg border border-white/10 bg-ink-900 p-4 md:flex-row md:items-center md:justify-between">
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-sm text-[#A0A0B8]">
          <Search size={18} aria-hidden="true" />
          <input className="w-full bg-transparent text-white outline-none placeholder:text-[#A0A0B8]" placeholder="Search by room, equipment, or location" />
        </label>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/10 bg-ink-850 px-4 text-sm font-bold hover:bg-white/5">
          <ListFilter size={18} aria-hidden="true" />
          Filters
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </section>
    </AppShell>
  );
}
