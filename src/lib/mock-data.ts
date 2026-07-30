import type { Booking, Resource, WaitlistEntry } from "@/lib/types";

export const resources: Resource[] = [
  {
    id: "lab-101",
    name: "Science Lab 101",
    type: "lab",
    location: "Science Block, Floor 1",
    capacity: 40,
    department: "Computer Science",
    status: "pending",
    isActive: true,
    color: "#FFAA00",
    schedule: "Mon-Fri, 08:00-18:00",
    utilization: 74
  },
  {
    id: "aud-a",
    name: "Auditorium A",
    type: "auditorium",
    location: "Main Campus",
    capacity: 220,
    department: "Administration",
    status: "booked",
    isActive: true,
    color: "#FF4444",
    schedule: "Mon-Sat, 09:00-20:00",
    utilization: 86
  },
  {
    id: "eq-proj-04",
    name: "Projector Kit 04",
    type: "equipment",
    location: "Admin Desk",
    capacity: 1,
    department: "Shared",
    status: "available",
    isActive: true,
    color: "#00FF88",
    schedule: "Mon-Fri, 08:00-17:00",
    utilization: 43
  },
  {
    id: "room-b",
    name: "Seminar Room B",
    type: "classroom",
    location: "Library Wing",
    capacity: 32,
    department: "Humanities",
    status: "available",
    isActive: true,
    color: "#0088FF",
    schedule: "Mon-Fri, 10:00-19:00",
    utilization: 51
  },
  {
    id: "court-02",
    name: "Indoor Court 02",
    type: "sports",
    location: "Sports Complex",
    capacity: 24,
    department: "Physical Education",
    status: "available",
    isActive: true,
    color: "#00FF88",
    schedule: "Mon-Sat, 06:00-21:00",
    utilization: 39
  },
  {
    id: "room-305",
    name: "Lecture Room 305",
    type: "classroom",
    location: "Academic Block, Floor 3",
    capacity: 60,
    department: "Electronics",
    status: "booked",
    isActive: false,
    color: "#FF4444",
    schedule: "Mon-Fri, 08:00-17:00",
    utilization: 68
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
