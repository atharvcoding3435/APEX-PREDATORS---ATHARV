"use client";

import { useMemo, useState } from "react";
import { Check, ListFilter, Loader2, Pencil, Plus, Power, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import type { MaintenanceStatus, Resource, ResourceType } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

type TypeFilter = "all" | ResourceType;
type ActiveFilter = "all" | "active" | "inactive";
type FormState = Pick<
  Resource,
  | "name"
  | "type"
  | "building"
  | "floor"
  | "location"
  | "capacity"
  | "availableQuantity"
  | "department"
  | "status"
  | "schedule"
  | "approvalRequired"
  | "maintenanceStatus"
>;

const typeFilters: TypeFilter[] = ["all", "classroom", "lab", "auditorium", "equipment", "sports"];
const activeFilters: ActiveFilter[] = ["all", "active", "inactive"];

const emptyForm: FormState = {
  name: "",
  type: "classroom",
  building: "",
  floor: "Ground",
  location: "",
  capacity: 1,
  availableQuantity: 1,
  department: "",
  status: "available",
  schedule: "Mon-Fri, 08:00-17:00",
  approvalRequired: false,
  maintenanceStatus: "available"
};

export function AdminResourcesClient({ initialResources }: { initialResources: Resource[] }) {
  const [managedResources, setManagedResources] = useState<Resource[]>(initialResources);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Resource | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return managedResources.filter((resource) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [resource.name, resource.type, resource.location, resource.department, resource.building]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesType = type === "all" || resource.type === type;
      const matchesActive = active === "all" || (active === "active" ? resource.isActive : !resource.isActive);

      return matchesSearch && matchesType && matchesActive;
    });
  }, [active, managedResources, search, type]);

  const activeCount = managedResources.filter((resource) => resource.isActive).length;
  const inactiveCount = managedResources.length - activeCount;

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
  }

  function openEditForm(resource: Resource) {
    setForm({
      name: resource.name,
      type: resource.type,
      location: resource.location,
      building: resource.building,
      floor: resource.floor,
      capacity: resource.capacity,
      availableQuantity: resource.availableQuantity,
      department: resource.department,
      status: resource.status,
      schedule: resource.schedule,
      approvalRequired: resource.approvalRequired,
      maintenanceStatus: resource.maintenanceStatus
    });
    setEditingId(resource.id);
    setIsFormOpen(true);
  }

  async function saveResource() {
    if (!form.name.trim() || !form.building.trim() || !form.location.trim() || !form.department.trim() || form.capacity < 1) {
      setMessage("Please complete resource name, building, location, department, and capacity.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/v1/resources", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...form,
          capacity: Number(form.capacity),
          availableQuantity: Number(form.availableQuantity),
          isActive: form.maintenanceStatus === "available"
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.data) {
        setMessage(payload?.message ?? "Resource could not be saved.");
        return;
      }

      const savedResource = payload.data as Resource;

      if (editingId) {
        setManagedResources((current) => current.map((resource) => (resource.id === editingId ? savedResource : resource)));
      } else {
        setManagedResources((current) => [savedResource, ...current]);
      }

      setIsFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setMessage("Resource saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deactivateResource() {
    if (!confirmTarget) {
      return;
    }

    const response = await fetch(`/api/v1/resources?id=${encodeURIComponent(confirmTarget.id)}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload?.data) {
      setManagedResources((current) =>
        current.map((resource) => (resource.id === confirmTarget.id ? payload.data : resource))
      );
      setConfirmTarget(null);
      setMessage("Resource deactivated.");
    } else {
      setMessage(payload?.message ?? "Resource could not be deactivated.");
    }
  }

  async function activateResource(resourceId: string) {
    const resource = managedResources.find((item) => item.id === resourceId);

    if (!resource) return;

    const response = await fetch("/api/v1/resources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...resource, isActive: true, maintenanceStatus: "available" })
    });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload?.data) {
      setManagedResources((current) => current.map((item) => (item.id === resourceId ? payload.data : item)));
      setMessage("Resource activated.");
    } else {
      setMessage(payload?.message ?? "Resource could not be activated.");
    }
  }

  async function updateMaintenance(resourceId: string, maintenanceStatus: MaintenanceStatus) {
    const resource = managedResources.find((item) => item.id === resourceId);

    if (!resource) return;

    const nextResource = {
      ...resource,
      maintenanceStatus,
      isActive: maintenanceStatus === "available",
      status: maintenanceStatus === "available" ? resource.status : "booked"
    };

    setManagedResources((current) => current.map((item) => (item.id === resourceId ? nextResource : item)));

    const response = await fetch("/api/v1/resources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextResource)
    });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload?.data) {
      setManagedResources((current) => current.map((item) => (item.id === resourceId ? payload.data : item)));
      setMessage("Maintenance status saved.");
    } else {
      setManagedResources((current) => current.map((item) => (item.id === resourceId ? resource : item)));
      setMessage(payload?.message ?? "Maintenance status could not be saved.");
    }
  }

  return (
    <AppShell
      active="/admin/resources"
      eyebrow="Admin resource management"
      title="Resources"
      description="Create, edit, deactivate, and monitor campus resources, quantities, approvals, and maintenance status."
      actions={
        <button className="inline-flex min-h-11 items-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white" onClick={openAddForm}>
          <Plus size={18} aria-hidden="true" />
          Add Resource
        </button>
      }
    >
      <section className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          ["Total", managedResources.length, "text-white"],
          ["Active", activeCount, "text-signal-success"],
          ["Inactive", inactiveCount, "text-[#A0A0B8]"],
          ["Maintenance", managedResources.filter((resource) => resource.maintenanceStatus === "maintenance").length, "text-signal-warning"]
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-ink-900 p-4">
            <p className={cn("text-3xl font-black", tone)}>{value}</p>
            <p className="text-sm text-[#A0A0B8]">{label} resources</p>
          </div>
        ))}
      </section>

      {message ? (
        <div className="mb-5 rounded-lg border border-white/10 bg-ink-900 p-3 text-sm font-bold text-[#C9C9DA]" role="status">
          {message}
        </div>
      ) : null}

      <section className="mb-5 rounded-lg border border-white/10 bg-ink-900 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-sm text-[#A0A0B8]">
            <Search size={18} aria-hidden="true" />
            <input className="w-full bg-transparent text-white outline-none placeholder:text-[#A0A0B8]" placeholder="Search by resource, department, type, building, or location" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <button key={filter} className={cn("min-h-10 rounded border px-3 text-sm font-bold transition", type === filter ? "border-signal-success bg-signal-success text-ink-950" : "border-white/10 bg-ink-850 text-[#C9C9DA] hover:bg-white/5 hover:text-white")} onClick={() => setType(filter)}>
                {titleCase(filter)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button key={filter} className={cn("min-h-10 rounded border px-3 text-sm font-bold transition", active === filter ? "border-signal-info bg-signal-info text-white" : "border-white/10 bg-ink-850 text-[#C9C9DA] hover:bg-white/5 hover:text-white")} onClick={() => setActive(filter)}>
                {titleCase(filter)}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 inline-flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-bold text-[#C9C9DA]">
          <ListFilter size={17} aria-hidden="true" />
          Showing {filteredResources.length} of {managedResources.length} resources
        </p>
      </section>

      {isFormOpen ? (
        <section className="mb-5 rounded-lg border border-white/10 bg-ink-900 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">{editingId ? "Edit resource" : "Add resource"}</h3>
            <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" onClick={() => setIsFormOpen(false)} title="Close form">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Resource name<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Type<select className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ResourceType }))}>{typeFilters.filter((filter) => filter !== "all").map((filter) => <option key={filter} value={filter}>{titleCase(filter)}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Building<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.building} onChange={(event) => setForm((current) => ({ ...current, building: event.target.value }))} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Floor<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.floor} onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Capacity<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" min={1} type="number" value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: Number(event.target.value) }))} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Available quantity<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" min={0} type="number" value={form.availableQuantity} onChange={(event) => setForm((current) => ({ ...current, availableQuantity: Number(event.target.value) }))} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Status<select className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Resource["status"] }))}><option value="available">Available</option><option value="pending">Pending</option><option value="booked">Booked</option></select></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Department<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Location<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">Maintenance status<select className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.maintenanceStatus} onChange={(event) => setForm((current) => ({ ...current, maintenanceStatus: event.target.value as MaintenanceStatus }))}><option value="available">Available</option><option value="maintenance">Under Maintenance</option><option value="unavailable">Unavailable</option></select></label>
            <label className="flex min-h-11 items-center gap-3 rounded border border-white/10 bg-ink-850 px-3 text-sm font-bold text-[#C9C9DA] md:mt-7"><input type="checkbox" checked={form.approvalRequired} onChange={(event) => setForm((current) => ({ ...current, approvalRequired: event.target.checked }))} />Approval required</label>
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA] md:col-span-2">Schedule<input className="min-h-11 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none" value={form.schedule} onChange={(event) => setForm((current) => ({ ...current, schedule: event.target.value }))} /></label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.03] px-4 text-sm font-bold hover:bg-white/10" onClick={() => setIsFormOpen(false)}><X size={17} aria-hidden="true" />Cancel</button>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-signal-success px-4 text-sm font-bold text-ink-950 hover:bg-white disabled:opacity-60" disabled={isSaving} onClick={saveResource}>
              {isSaving ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
              Save Resource
            </button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-white/10 bg-ink-900">
        <div className="hidden grid-cols-[1.3fr_110px_100px_90px_120px_120px_120px_150px_180px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase text-[#A0A0B8] xl:grid">
          <span>Resource</span><span>Type</span><span>Status</span><span>Capacity</span><span>Quantity</span><span>Department</span><span>Building</span><span>Maintenance</span><span>Actions</span>
        </div>
        {filteredResources.map((resource) => (
          <article key={resource.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 xl:grid-cols-[1.3fr_110px_100px_90px_120px_120px_120px_150px_180px] xl:items-center">
            <div><h3 className="font-bold">{resource.name}</h3><p className="text-sm text-[#A0A0B8]">{resource.schedule}</p></div>
            <p className="text-sm font-bold text-[#C9C9DA]">{titleCase(resource.type)}</p>
            <StatusBadge kind="resource" status={resource.status} />
            <p className="text-sm text-[#C9C9DA]">{resource.capacity}</p>
            <p className="text-sm text-[#C9C9DA]">{resource.availableQuantity}</p>
            <p className="text-sm text-[#C9C9DA]">{resource.department}</p>
            <p className="text-sm text-[#C9C9DA]">{resource.building}, Floor {resource.floor}</p>
            <select className="min-h-10 rounded border border-white/10 bg-ink-850 px-2 text-sm font-bold text-white outline-none" value={resource.maintenanceStatus} onChange={(event) => updateMaintenance(resource.id, event.target.value as MaintenanceStatus)}>
              <option value="available">Available</option><option value="maintenance">Maintenance</option><option value="unavailable">Unavailable</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <button className="grid min-h-10 w-10 place-items-center rounded border border-white/10 bg-ink-850 hover:bg-white/5" onClick={() => openEditForm(resource)} title={`Edit ${resource.name}`}><Pencil size={17} aria-hidden="true" /></button>
              {resource.isActive ? (
                <button className="grid min-h-10 w-10 place-items-center rounded border border-signal-danger/40 bg-signal-danger/10 text-signal-danger hover:bg-signal-danger/20" onClick={() => setConfirmTarget(resource)} title={`Deactivate ${resource.name}`}><Power size={17} aria-hidden="true" /></button>
              ) : (
                <button className="inline-flex min-h-10 items-center gap-2 rounded border border-signal-success/40 bg-signal-success/10 px-3 text-sm font-bold text-signal-success hover:bg-signal-success/20" onClick={() => activateResource(resource.id)}><Power size={17} aria-hidden="true" />Activate</button>
              )}
            </div>
          </article>
        ))}
      </section>

      {confirmTarget ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink-950/80 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg border border-white/10 bg-ink-900 p-5 shadow-2xl">
            <h3 className="text-xl font-black">Deactivate resource?</h3>
            <p className="mt-2 text-sm text-[#A0A0B8]">{confirmTarget.name} will be hidden from active scheduling while remaining visible in admin records.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button className="inline-flex min-h-10 items-center justify-center rounded border border-white/10 bg-white/[0.03] px-4 text-sm font-bold hover:bg-white/10" onClick={() => setConfirmTarget(null)}>Cancel</button>
              <button className="inline-flex min-h-10 items-center justify-center rounded bg-signal-danger px-4 text-sm font-bold text-white hover:bg-signal-danger/80" onClick={deactivateResource}>Deactivate</button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
