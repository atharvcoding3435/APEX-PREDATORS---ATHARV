import type { ActivityLog, AdminUser, Booking, Resource, WaitlistEntry } from "@/lib/types";

export const resources: Resource[] = [
  {
    id: "lab-101",
    name: "Science Lab 101",
    type: "lab",
    location: "Science Block, Floor 1",
    building: "Science Block",
    floor: "1",
    capacity: 40,
    availableQuantity: 1,
    department: "Computer Science",
    status: "pending",
    isActive: true,
    approvalRequired: true,
    maintenanceStatus: "available",
    color: "#FFAA00",
    schedule: "Mon-Fri, 08:00-18:00",
    utilization: 74
  },
  {
    id: "aud-a",
    name: "Auditorium A",
    type: "auditorium",
    location: "Main Campus",
    building: "Central Hall",
    floor: "Ground",
    capacity: 220,
    availableQuantity: 1,
    department: "Administration",
    status: "booked",
    isActive: true,
    approvalRequired: true,
    maintenanceStatus: "available",
    color: "#FF4444",
    schedule: "Mon-Sat, 09:00-20:00",
    utilization: 86
  },
  {
    id: "eq-proj-04",
    name: "Projector Kit 04",
    type: "equipment",
    location: "Admin Desk",
    building: "Administration",
    floor: "Ground",
    capacity: 1,
    availableQuantity: 4,
    department: "Shared",
    status: "available",
    isActive: true,
    approvalRequired: false,
    maintenanceStatus: "available",
    color: "#00FF88",
    schedule: "Mon-Fri, 08:00-17:00",
    utilization: 43
  },
  {
    id: "room-b",
    name: "Seminar Room B",
    type: "classroom",
    location: "Library Wing",
    building: "Library Wing",
    floor: "2",
    capacity: 32,
    availableQuantity: 1,
    department: "Humanities",
    status: "available",
    isActive: true,
    approvalRequired: false,
    maintenanceStatus: "available",
    color: "#0088FF",
    schedule: "Mon-Fri, 10:00-19:00",
    utilization: 51
  },
  {
    id: "court-02",
    name: "Indoor Court 02",
    type: "sports",
    location: "Sports Complex",
    building: "Sports Complex",
    floor: "Ground",
    capacity: 24,
    availableQuantity: 1,
    department: "Physical Education",
    status: "available",
    isActive: true,
    approvalRequired: true,
    maintenanceStatus: "maintenance",
    color: "#00FF88",
    schedule: "Mon-Sat, 06:00-21:00",
    utilization: 39
  },
  {
    id: "room-305",
    name: "Lecture Room 305",
    type: "classroom",
    location: "Academic Block, Floor 3",
    building: "Academic Block",
    floor: "3",
    capacity: 60,
    availableQuantity: 1,
    department: "Electronics",
    status: "booked",
    isActive: false,
    approvalRequired: false,
    maintenanceStatus: "unavailable",
    color: "#FF4444",
    schedule: "Mon-Fri, 08:00-17:00",
    utilization: 68
  }
];

export const users: AdminUser[] = [
  {
    id: "user-001",
    name: "Ananya Sharma",
    email: "ananya@campus.edu",
    role: "student",
    department: "Computer Science",
    isActive: true,
    bookingCount: 5,
    lastActive: "Today"
  },
  {
    id: "user-002",
    name: "Dr. Rahul Mehta",
    email: "rahul.mehta@campus.edu",
    role: "faculty",
    department: "Computer Science",
    isActive: true,
    bookingCount: 12,
    lastActive: "Today"
  },
  {
    id: "user-003",
    name: "Priya Nair",
    email: "priya.admin@campus.edu",
    role: "admin",
    department: "Administration",
    isActive: true,
    bookingCount: 8,
    lastActive: "Yesterday"
  },
  {
    id: "user-004",
    name: "Kabir Singh",
    email: "kabir@campus.edu",
    role: "student",
    department: "Electronics",
    isActive: false,
    bookingCount: 2,
    lastActive: "Jul 28"
  }
];

export const bookings: Booking[] = [
  {
    id: "bk-2041",
    resourceId: "eq-proj-04",
    requester: "Ananya Sharma",
    role: "student",
    department: "Computer Science",
    date: "2026-08-01",
    startTime: "09:00",
    endTime: "11:00",
    purpose: "Project demo rehearsal",
    status: "approved"
  },
  {
    id: "bk-2042",
    resourceId: "lab-101",
    requester: "Dr. Rahul Mehta",
    role: "faculty",
    department: "Computer Science",
    date: "2026-08-01",
    startTime: "12:00",
    endTime: "14:00",
    purpose: "Machine learning practical",
    status: "pending"
  },
  {
    id: "bk-2043",
    resourceId: "room-b",
    requester: "Priya Nair",
    role: "admin",
    department: "Administration",
    date: "2026-08-01",
    startTime: "15:00",
    endTime: "16:00",
    purpose: "Department orientation",
    status: "completed"
  },
  {
    id: "bk-2044",
    resourceId: "lab-101",
    requester: "Kabir Singh",
    role: "student",
    department: "Computer Science",
    date: "2026-08-01",
    startTime: "13:00",
    endTime: "15:00",
    purpose: "Robotics prototype testing",
    status: "pending"
  }
];

export const activityLogs: ActivityLog[] = [
  {
    id: "act-001",
    actor: "Ananya Sharma",
    action: "booked",
    target: "Projector Kit 04",
    time: "10 min ago",
    tone: "success"
  },
  {
    id: "act-002",
    actor: "Dr. Rahul Mehta",
    action: "approved",
    target: "Science Lab 101",
    time: "24 min ago",
    tone: "info"
  },
  {
    id: "act-003",
    actor: "Priya Nair",
    action: "added",
    target: "Seminar Room B",
    time: "1 hr ago",
    tone: "success"
  },
  {
    id: "act-004",
    actor: "System",
    action: "flagged maintenance",
    target: "Indoor Court 02",
    time: "2 hrs ago",
    tone: "warning"
  },
  {
    id: "act-005",
    actor: "Admin",
    action: "cancelled",
    target: "Auditorium A booking",
    time: "Yesterday",
    tone: "danger"
  }
];

export const waitlist: WaitlistEntry[] = [
  {
    id: "wl-1001",
    resourceId: "aud-a",
    user: "Kabir Singh",
    date: "2026-08-01",
    slot: "10:00-12:00",
    position: 1,
    status: "offered"
  },
  {
    id: "wl-1002",
    resourceId: "aud-a",
    user: "Nisha Rao",
    date: "2026-08-01",
    slot: "10:00-12:00",
    position: 2,
    status: "waiting"
  }
];

export function getResource(resourceId: string) {
  return resources.find((resource) => resource.id === resourceId);
}

export function getBooking(bookingId: string) {
  return bookings.find((booking) => booking.id === bookingId);
}

export function getBookingResource(booking: Booking) {
  return getResource(booking.resourceId);
}
