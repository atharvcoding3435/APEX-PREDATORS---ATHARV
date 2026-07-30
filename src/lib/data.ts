import { createServiceSupabaseClient, isSupabaseServiceConfigured } from "@/lib/supabase";
import { activityLogs, bookings as mockBookings, resources as mockResources, users as mockUsers } from "@/lib/mock-data";
import { isUserRole } from "@/lib/roles";
import type { ActivityLog, AdminUser, Booking, BookingStatus, MaintenanceStatus, Resource, ResourceType, UserRole } from "@/lib/types";

type DbResource = Record<string, unknown>;
type DbBooking = Record<string, unknown>;
type DbUser = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asTime(value: unknown) {
  return asString(value).slice(0, 5);
}

function normalizeResourceType(value: unknown): ResourceType {
  const type = asString(value, "classroom");

  if (["classroom", "lab", "auditorium", "equipment", "sports"].includes(type)) {
    return type as ResourceType;
  }

  return "classroom";
}

function normalizeBookingStatus(value: unknown): BookingStatus {
  const status = asString(value, "pending");

  if (["pending", "approved", "active", "completed", "cancelled", "rejected"].includes(status)) {
    return status as BookingStatus;
  }

  if (status === "confirmed") {
    return "approved";
  }

  return "pending";
}

function normalizeMaintenanceStatus(value: unknown, isActive: boolean): MaintenanceStatus {
  const status = asString(value, isActive ? "available" : "unavailable");

  if (["available", "maintenance", "unavailable"].includes(status)) {
    return status as MaintenanceStatus;
  }

  return isActive ? "available" : "unavailable";
}

function resourceStatus(row: DbResource, isActive: boolean): Resource["status"] {
  const explicit = asString(row.status);

  if (explicit === "available" || explicit === "pending" || explicit === "booked") {
    return explicit;
  }

  return isActive ? "available" : "booked";
}

function mapResource(row: DbResource): Resource {
  const isActive = asBoolean(row.is_active ?? row.isActive, true);
  const maintenanceStatus = normalizeMaintenanceStatus(row.maintenance_status ?? row.maintenanceStatus, isActive);
  const location = asString(row.location, "Campus");
  const [buildingPart, floorPart] = location.split(",").map((part) => part.trim());
  const schedule =
    typeof row.schedule === "string"
      ? row.schedule
      : row.schedule && typeof row.schedule === "object" && "label" in row.schedule
        ? asString((row.schedule as Record<string, unknown>).label, "Mon-Fri, 08:00-17:00")
        : "Mon-Fri, 08:00-17:00";

  return {
    id: asString(row.id),
    name: asString(row.name, "Unnamed Resource"),
    type: normalizeResourceType(row.type),
    location,
    building: asString(row.building, buildingPart || "Campus"),
    floor: asString(row.floor, floorPart?.replace(/floor/i, "").trim() || "Ground"),
    capacity: asNumber(row.capacity, 1),
    availableQuantity: asNumber(row.available_quantity ?? row.availableQuantity, 1),
    department: asString(row.department, "Shared"),
    status: resourceStatus(row, isActive && maintenanceStatus === "available"),
    isActive: isActive && maintenanceStatus === "available",
    approvalRequired: asBoolean(row.approval_required ?? row.approvalRequired, false),
    maintenanceStatus,
    color: asString(row.color, "#00FF88"),
    schedule,
    utilization: asNumber(row.utilization, 0)
  };
}

function mapUser(row: DbUser, bookingCount = 0): AdminUser {
  const role = asString(row.role, "student") as UserRole;

  return {
    id: asString(row.id),
    name: asString(row.name, "Campus User"),
    email: asString(row.email, "user@campus.edu"),
    role: isUserRole(role) ? role : "student",
    department: asString(row.department, "Unassigned"),
    isActive: asBoolean(row.is_active ?? row.isActive, true),
    bookingCount,
    lastActive: asString(row.last_login_at ?? row.lastActive, "Not yet")
  };
}

function mapBooking(row: DbBooking, usersById: Map<string, AdminUser>): Booking {
  const requesterId = asString(row.requester_id ?? row.requesterId);
  const user = usersById.get(requesterId);

  return {
    id: asString(row.id),
    resourceId: asString(row.resource_id ?? row.resourceId),
    requester: user?.name ?? asString(row.requester, "Campus User"),
    role: user?.role ?? "student",
    department: user?.department ?? asString(row.department, "Unassigned"),
    date: asString(row.date),
    startTime: asTime(row.start_time ?? row.startTime),
    endTime: asTime(row.end_time ?? row.endTime),
    purpose: asString(row.purpose, "Campus resource booking"),
    status: normalizeBookingStatus(row.status)
  };
}

async function readSupabaseTable<T extends DbResource>(table: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from(table).select("*");

  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

export async function getResourcesData(): Promise<Resource[]> {
  if (!isSupabaseServiceConfigured()) {
    return mockResources;
  }

  try {
    const rows = await readSupabaseTable<DbResource>("resources");
    return rows.map(mapResource);
  } catch {
    return mockResources;
  }
}

export async function getUsersData(): Promise<AdminUser[]> {
  if (!isSupabaseServiceConfigured()) {
    return mockUsers;
  }

  try {
    const [userRows, bookingRows] = await Promise.all([
      readSupabaseTable<DbUser>("users"),
      readSupabaseTable<DbBooking>("bookings")
    ]);
    const counts = bookingRows.reduce<Map<string, number>>((map, booking) => {
      const requesterId = asString(booking.requester_id ?? booking.requesterId);
      map.set(requesterId, (map.get(requesterId) ?? 0) + 1);
      return map;
    }, new Map());

    return userRows.map((user) => mapUser(user, counts.get(asString(user.id)) ?? 0));
  } catch {
    return mockUsers;
  }
}

export async function getBookingsData(): Promise<Booking[]> {
  if (!isSupabaseServiceConfigured()) {
    return mockBookings;
  }

  try {
    const [bookingRows, users] = await Promise.all([
      readSupabaseTable<DbBooking>("bookings"),
      getUsersData()
    ]);
    const usersById = new Map(users.map((user) => [user.id, user]));

    return bookingRows.map((booking) => mapBooking(booking, usersById));
  } catch {
    return mockBookings;
  }
}

export async function getActivityData(): Promise<ActivityLog[]> {
  if (!isSupabaseServiceConfigured()) {
    return activityLogs;
  }

  try {
    const rows = await readSupabaseTable<Record<string, unknown>>("audit_logs");

    if (rows.length === 0) {
      return activityLogs;
    }

    return rows.slice(-8).reverse().map((row, index) => ({
      id: asString(row.id, `activity-${index}`),
      actor: asString(row.user_id, "System"),
      action: asString(row.action, "updated"),
      target: asString(row.booking_id, "platform"),
      time: asString(row.created_at, "Recently"),
      tone: "info"
    }));
  } catch {
    return activityLogs;
  }
}

export async function getAppData() {
  const [resources, bookings, users, activities] = await Promise.all([
    getResourcesData(),
    getBookingsData(),
    getUsersData(),
    getActivityData()
  ]);

  return { resources, bookings, users, activities };
}

export function findResourceById(resources: Resource[], resourceId: string) {
  return resources.find((resource) => resource.id === resourceId);
}
