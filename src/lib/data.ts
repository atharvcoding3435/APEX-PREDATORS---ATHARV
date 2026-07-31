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

async function getAuthUserStates() {
  if (!isSupabaseServiceConfigured()) {
    return new Map<string, Pick<AdminUser, "email" | "isActive" | "lastActive">>();
  }

  const supabase = createServiceSupabaseClient();
  const states = new Map<string, Pick<AdminUser, "email" | "isActive" | "lastActive">>();
  let page = 1;

  while (page <= 5) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });

    if (error || !data) {
      break;
    }

    data.users.forEach((user) => {
      const bannedUntil = user.banned_until ? new Date(user.banned_until).getTime() : 0;
      const isBanned = bannedUntil > Date.now();

      states.set(user.id, {
        email: user.email ?? "",
        isActive: !isBanned,
        lastActive: user.last_sign_in_at ? formatRelativeDate(user.last_sign_in_at) : "Not yet"
      });
    });

    if (data.users.length < 1000) {
      break;
    }

    page += 1;
  }

  return states;
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

function formatRelativeDate(value: string) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function activityToneForStatus(status: BookingStatus): ActivityLog["tone"] {
  if (status === "approved" || status === "active" || status === "completed") {
    return "success";
  }

  if (status === "pending") {
    return "warning";
  }

  if (status === "cancelled" || status === "rejected") {
    return "danger";
  }

  return "info";
}

function activityActionForStatus(status: BookingStatus) {
  if (status === "approved") return "approved booking for";
  if (status === "active") return "started booking for";
  if (status === "completed") return "completed booking for";
  if (status === "cancelled") return "cancelled booking for";
  if (status === "rejected") return "rejected booking for";
  return "requested";
}

function generateActivityFromBookings(bookings: Booking[], resources: Resource[]): ActivityLog[] {
  return bookings
    .slice()
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
    .slice(0, 8)
    .map((booking) => {
      const resource = findResourceById(resources, booking.resourceId);

      return {
        id: `booking-activity-${booking.id}`,
        actor: booking.requester,
        action: activityActionForStatus(booking.status),
        target: resource?.name ?? "Unknown resource",
        time: `${booking.date} · ${booking.startTime}-${booking.endTime}`,
        tone: activityToneForStatus(booking.status)
      };
    });
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
    const authUserStates = await getAuthUserStates();
    const counts = bookingRows.reduce<Map<string, number>>((map, booking) => {
      const requesterId = asString(booking.requester_id ?? booking.requesterId);
      map.set(requesterId, (map.get(requesterId) ?? 0) + 1);
      return map;
    }, new Map());

    return userRows.map((user) => {
      const mappedUser = mapUser(user, counts.get(asString(user.id)) ?? 0);
      const authState = authUserStates.get(mappedUser.id);

      if (!authState) {
        return mappedUser;
      }

      return {
        ...mappedUser,
        email: mappedUser.email || authState.email,
        isActive: asBoolean(user.is_active ?? user.isActive, authState.isActive),
        lastActive: mappedUser.lastActive === "Not yet" ? authState.lastActive : mappedUser.lastActive
      };
    });
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
      const [bookings, resources] = await Promise.all([getBookingsData(), getResourcesData()]);
      return generateActivityFromBookings(bookings, resources);
    }

    return rows.slice(-8).reverse().map((row, index) => ({
      id: asString(row.id, `activity-${index}`),
      actor: asString(row.user_id, "System"),
      action: asString(row.action, "updated"),
      target: asString(row.booking_id, "platform"),
      time: formatRelativeDate(asString(row.created_at, "Recently")),
      tone: "info"
    }));
  } catch {
    const [bookings, resources] = await Promise.all([getBookingsData(), getResourcesData()]);
    const generatedActivity = generateActivityFromBookings(bookings, resources);
    return generatedActivity.length > 0 ? generatedActivity : activityLogs;
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
