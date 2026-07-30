import type { Resource, ResourceType, UserRole } from "@/lib/types";

type AccessDecision = {
  canView: boolean;
  canBook: boolean;
  reason: string;
};

const roleCopy: Record<UserRole, string> = {
  student: "Students can request equipment such as projector kits. Classrooms and auditoriums require faculty or club access.",
  faculty: "Faculty can request classrooms, labs, auditoriums, and equipment for academic work.",
  club: "Clubs can request event spaces, sports facilities, and equipment for campus activities.",
  guest: "Guests can browse shared availability but cannot create allocation requests.",
  admin: "Admins can request and manage every resource."
};

const bookableTypesByRole: Record<UserRole, ResourceType[]> = {
  student: ["equipment"],
  faculty: ["classroom", "lab", "auditorium", "equipment"],
  club: ["auditorium", "sports", "equipment"],
  guest: [],
  admin: ["classroom", "lab", "auditorium", "equipment", "sports"]
};

export function getRoleDescription(role: UserRole) {
  return roleCopy[role];
}

export function getBookableTypes(role: UserRole) {
  return bookableTypesByRole[role];
}

export function getResourceAccess(role: UserRole, resource: Resource): AccessDecision {
  if (!resource.isActive || resource.maintenanceStatus !== "available") {
    return {
      canView: true,
      canBook: false,
      reason: "This resource is not currently available for allocation."
    };
  }

  const canBook = bookableTypesByRole[role].includes(resource.type);

  if (canBook) {
    return {
      canView: true,
      canBook: true,
      reason: "Booking is available for this role."
    };
  }

  return {
    canView: true,
    canBook: false,
    reason: roleCopy[role]
  };
}
