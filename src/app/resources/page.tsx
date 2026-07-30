"use client";

import { useMemo, useState } from "react";
import { ListFilter, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResourceCard } from "@/components/resource-card";
import { resources } from "@/lib/mock-data";
import type { Resource, ResourceType } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

type ResourceTypeFilter = "all" | ResourceType;
type ResourceStatusFilter = "all" | Resource["status"];

const typeFilters: ResourceTypeFilter[] = ["all", "classroom", "lab", "auditorium", "equipment", "sports"];
const statusFilters: ResourceStatusFilter[] = ["all", "available", "pending", "booked"];

function filterResources(search: string, type: ResourceTypeFilter, status: ResourceStatusFilter) {
  const normalizedSearch = search.trim().toLowerCase();

  return resources.filter((resource) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [resource.name, resource.type, resource.location, resource.department]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    const matchesType = type === "all" || resource.type === type;
    const matchesStatus = status === "all" || resource.status === status;

    return matchesSearch && matchesType && matchesStatus;
  });
}

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ResourceTypeFilter>("all");
  const [status, setStatus] = useState<ResourceStatusFilter>("all");

  const filteredResources = useMemo(() => filterResources(search, type, status), [search, type, status]);
  const hasActiveFilters = search.trim().length > 0 || type !== "all" || status !== "all";

  const stats = [
    { label: "Total", value: resources.length, tone: "text-white" },
    { label: "Available", value: resources.filter((resource) => resource.status === "available").length, tone: "text-signal-success" },
    { label: "Pending", value: resources.filter((resource) => resource.status === "pending").length, tone: "text-signal-warning" },
    { label: "Booked", value: resources.filter((resource) => resource.status === "booked").length, tone: "text-signal-danger" }
  ];

  function resetFilters() {
    setSearch("");
    setType("all");
    setStatus("all");
  }

  return (
    <AppShell
      active="/resources"
      eyebrow="Resource registry"
      title="Find resources"
      description="Browse classrooms, labs, equipment, and event spaces with clear capacity, location, and availability indicators."
    >
      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <p className={cn("text-3xl font-black", stat.tone)}>{stat.value}</p>
            <p className="text-sm text-[#A0A0B8]">{stat.label} resources</p>
          </div>
        ))}
      </section>

      <section className="mb-5 rounded-lg border border-white/10 bg-ink-900 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-sm text-[#A0A0B8]">
            <Search size={18} aria-hidden="true" />
            <input
              className="w-full bg-transparent text-white outline-none placeholder:text-[#A0A0B8]"
              placeholder="Search by room, type, department, or location"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex flex-wrap gap-2">
              {typeFilters.map((filter) => (
                <button
                  key={filter}
                  className={cn(
                    "min-h-10 rounded border px-3 text-sm font-bold transition",
                    type === filter
                      ? "border-signal-success bg-signal-success text-ink-950"
                      : "border-white/10 bg-ink-850 text-[#C9C9DA] hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => setType(filter)}
                >
                  {titleCase(filter)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  className={cn(
                    "min-h-10 rounded border px-3 text-sm font-bold transition",
                    status === filter
                      ? "border-signal-info bg-signal-info text-white"
                      : "border-white/10 bg-ink-850 text-[#C9C9DA] hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => setStatus(filter)}
                >
                  {titleCase(filter)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-[#C9C9DA]">
            <ListFilter size={17} aria-hidden="true" />
            Showing {filteredResources.length} of {resources.length} resources
          </p>
          {hasActiveFilters ? (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 text-sm font-bold hover:bg-white/10"
              onClick={resetFilters}
            >
              <X size={17} aria-hidden="true" />
              Clear Filters
            </button>
          ) : null}
        </div>
      </section>

      {filteredResources.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-white/20 bg-ink-900 p-8 text-center">
          <h3 className="text-xl font-black">No matching resources</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#A0A0B8]">
            Try a broader search, switch the resource type, or clear the current availability filter.
          </p>
          <button
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white"
            onClick={resetFilters}
          >
            <X size={17} aria-hidden="true" />
            Clear Filters
          </button>
        </section>
      )}
    </AppShell>
  );
}
