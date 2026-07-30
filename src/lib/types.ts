export type UserRole = "student" | "faculty" | "admin";

export type ResourceType = "classroom" | "lab" | "auditorium" | "equipment" | "sports";

export type BookingStatus = "pending" | "approved" | "active" | "completed" | "cancelled" | "rejected";

export type MaintenanceStatus = "available" | "maintenance" | "unavailable";

export type Resource = {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  building: string;
  floor: string;
  capacity: number;
  availableQuantity: number;
  department: string;
  status: "available" | "pending" | "booked";
  isActive: boolean;
  approvalRequired: boolean;
  maintenanceStatus: MaintenanceStatus;
  color: string;
  schedule: string;
  utilization: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  bookingCount: number;
  lastActive: string;
};

export type ActivityLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  tone: "success" | "warning" | "danger" | "info";
};

export type Booking = {
  id: string;
  resourceId: string;
  requester: string;
  role: UserRole;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
};

export type BookingRequest = {
  resourceId: string;
  requester: string;
  requesterRole: UserRole;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export type BookingAlternative = {
  id: string;
  label: string;
  resourceId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type WaitlistEntry = {
  id: string;
  resourceId: string;
  user: string;
  date: string;
  slot: string;
  position: number;
  status: "waiting" | "offered";
};
