import { NextResponse } from "next/server";
import { z } from "zod";
import { resources } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Resource, UserRole } from "@/lib/types";

const activeRoles: UserRole[] = ["student", "faculty", "admin"];

const resourceSchema = z.object({
  name: z.string().trim().min(2),
  type: z.enum(["classroom", "lab", "auditorium", "equipment", "sports"]),
  location: z.string().trim().min(2),
  capacity: z.number().int().positive(),
  department: z.string().trim().min(2),
  status: z.enum(["available", "pending", "booked"]).default("available"),
  schedule: z.string().trim().min(2).default("Mon-Fri, 08:00-17:00"),
  isActive: z.boolean().default(true)
});

const resourceUpdateSchema = resourceSchema.partial().extend({
  id: z.string().trim().min(1)
});

function getRequestRole(request: Request): UserRole {
  const role = request.headers.get("x-user-role")?.toLowerCase();

  return activeRoles.includes(role as UserRole) ? (role as UserRole) : "student";
}

function requireAdmin(request: Request) {
  if (getRequestRole(request) === "admin") {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: "FORBIDDEN",
      message: "Only administrators can modify resources."
    },
    { status: 403 }
  );
}

function colorForStatus(status: Resource["status"]) {
  if (status === "available") {
    return "#00FF88";
  }

  if (status === "pending") {
    return "#FFAA00";
  }

  return "#FF4444";
}

export function GET() {
  return NextResponse.json({
    data: resources,
    source: isSupabaseConfigured() ? "mock-until-supabase-rpc-is-enabled" : "mock"
  });
}

export async function POST(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  const payload = resourceSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_RESOURCE_PAYLOAD",
        message: "Resource details are incomplete or invalid.",
        issues: payload.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const resource: Resource = {
    id: payload.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    ...payload.data,
    color: colorForStatus(payload.data.status),
    utilization: 0
  };

  return NextResponse.json(
    {
      success: true,
      data: resource,
      source: isSupabaseConfigured() ? "validated-mock-until-supabase-rpc-is-enabled" : "validated-mock"
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  const payload = resourceUpdateSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_RESOURCE_UPDATE",
        message: "Resource update details are incomplete or invalid.",
        issues: payload.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const existingResource = resources.find((resource) => resource.id === payload.data.id);

  if (!existingResource) {
    return NextResponse.json(
      {
        success: false,
        error: "RESOURCE_NOT_FOUND",
        message: "The requested resource could not be found."
      },
      { status: 404 }
    );
  }

  const updatedResource: Resource = {
    ...existingResource,
    ...payload.data,
    color: colorForStatus(payload.data.status ?? existingResource.status)
  };

  return NextResponse.json({
    success: true,
    data: updatedResource,
    source: isSupabaseConfigured() ? "validated-mock-until-supabase-rpc-is-enabled" : "validated-mock"
  });
}

export async function DELETE(request: Request) {
  const forbidden = requireAdmin(request);

  if (forbidden) {
    return forbidden;
  }

  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get("id");

  if (!resourceId) {
    return NextResponse.json(
      {
        success: false,
        error: "RESOURCE_ID_REQUIRED",
        message: "A resource id is required to deactivate a resource."
      },
      { status: 400 }
    );
  }

  const existingResource = resources.find((resource) => resource.id === resourceId);

  if (!existingResource) {
    return NextResponse.json(
      {
        success: false,
        error: "RESOURCE_NOT_FOUND",
        message: "The requested resource could not be found."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { ...existingResource, isActive: false },
    source: isSupabaseConfigured() ? "validated-mock-until-supabase-rpc-is-enabled" : "validated-mock"
  });
}
