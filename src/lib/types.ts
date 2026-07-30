export type UserRole = "student" | "faculty" | "admin";

export type ResourceType = "classroom" | "lab" | "auditorium" | "equipment" | "sports";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Resource = {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  capacity: number;
  department: string;
  status: "available" | "pending" | "booked";
  color: string;
  schedule: string;
  utilization: number;
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
  qrToken: string;
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
