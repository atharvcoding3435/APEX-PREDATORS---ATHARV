import { NextResponse } from "next/server";
import { z } from "zod";
import { resources } from "@/lib/mock-data";
import { requireAdmin } from "@/lib/auth";
import { getResourcesData } from "@/lib/data";
import { createServiceSupabaseClient, isSupabaseServiceConfigured } from "@/lib/supabase";
import type { Resource } from "@/lib/types";

const resourceSchema = z.object({
  name: z.string().trim().min(2),
  type: z.enum(["classroom", "lab", "auditorium", "equipment", "sports"]),
  location: z.string().trim().min(2),
  building: z.string().trim().min(2),
  floor: z.string().trim().min(1),
  capacity: z.number().int().positive(),
  availableQuantity: z.number().int().nonnegative(),
  department: z.string().trim().min(2),
  status: z.enum(["available", "pending", "booked"]).default("available"),
  schedule: z.string().trim().min(2).default("Mon-Fri, 08:00-17:00"),
  isActive: z.boolean().default(true),
  approvalRequired: z.boolean().default(false),
  maintenanceStatus: z.enum(["available", "maintenance", "unavailable"]).default("available")
});

const resourceUpdateSchema = resourceSchema.partial().extend({
  id: z.string().trim().min(1)
});

function colorForStatus(status: Resource["status"]) {
  if (status === "available") {
    return "#00FF88";
  }

  if (status === "pending") {
    return "#FFAA00";
  }

  return "#FF4444";
}

function mapResourcePayload(row: Record<string, unknown>, fallback: Partial<Resource>): Resource {
  const location = String(row.location ?? fallback.location ?? "Campus");
  const [buildingPart, floorPart] = location.split(",").map((part) => part.trim());
  const schedule =
    row.schedule && typeof row.schedule === "object" && "label" in row.schedule
      ? String((row.schedule as Record<string, unknown>).label)
      : typeof row.schedule === "string"
        ? row.schedule
        : fallback.schedule ?? "Mon-Fri, 08:00-17:00";
  const isActive = Boolean(row.is_active ?? fallback.isActive ?? true);

  return {
    id: String(row.id ?? fallback.id ?? ""),
    name: String(row.name ?? fallback.name ?? "Unnamed Resource"),
    type: String(row.type ?? fallback.type ?? "classroom") as Resource["type"],
    location,
    building: String(fallback.building ?? buildingPart ?? "Campus"),
    floor: String(fallback.floor ?? floorPart?.replace(/floor/i, "").trim() ?? "Ground"),
    capacity: Number(row.capacity ?? fallback.capacity ?? 1),
    availableQuantity: Number(fallback.availableQuantity ?? 1),
    department: String(row.department ?? fallback.department ?? "Shared"),
    status: fallback.status ?? (isActive ? "available" : "booked"),
    isActive,
    approvalRequired: Boolean(fallback.approvalRequired ?? false),
    maintenanceStatus: fallback.maintenanceStatus ?? (isActive ? "available" : "unavailable"),
    color: String(row.color ?? fallback.color ?? "#00FF88"),
    schedule,
    utilization: Number(fallback.utilization ?? 0)
  };
}

function toSupabaseResourcePayload(input: z.infer<typeof resourceSchema> | Partial<z.infer<typeof resourceSchema>>) {
  const location = input.location || [input.building, input.floor].filter(Boolean).join(", ");

  return {
    name: input.name,
    type: input.type,
    location,
    capacity: input.capacity,
    schedule: input.schedule ? { label: input.schedule } : undefined,
    color: input.status ? colorForStatus(input.status) : undefined,
    is_active: typeof input.isActive === "boolean" ? input.isActive : input.maintenanceStatus ? input.maintenanceStatus === "available" : undefined
  };
}

export async function GET() {
  const data = await getResourcesData();

  return NextResponse.json({
    data,
    source: isSupabaseServiceConfigured() ? "supabase" : "mock"
  });
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin(request);

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

  if (isSupabaseServiceConfigured()) {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("resources")
      .insert(toSupabaseResourcePayload(payload.data))
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: "RESOURCE_CREATE_FAILED",
          message: error?.message ?? "Resource could not be saved."
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: mapResourcePayload(data as Record<string, unknown>, resource),
        source: "supabase"
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: resource,
      source: "mock"
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const forbidden = await requireAdmin(request);

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

  const liveResources = await getResourcesData();
  const existingResource = liveResources.find((resource) => resource.id === payload.data.id) ?? resources.find((resource) => resource.id === payload.data.id);

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

  if (isSupabaseServiceConfigured()) {
    const supabase = createServiceSupabaseClient();
    const updatePayload = Object.fromEntries(
      Object.entries(toSupabaseResourcePayload(payload.data)).filter(([, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .from("resources")
      .update(updatePayload)
      .eq("id", payload.data.id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: "RESOURCE_UPDATE_FAILED",
          message: error?.message ?? "Resource could not be updated."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapResourcePayload(data as Record<string, unknown>, updatedResource),
      source: "supabase"
    });
  }

  return NextResponse.json({
    success: true,
    data: updatedResource,
    source: "mock"
  });
}

export async function DELETE(request: Request) {
  const forbidden = await requireAdmin(request);

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

  const liveResources = await getResourcesData();
  const existingResource = liveResources.find((resource) => resource.id === resourceId) ?? resources.find((resource) => resource.id === resourceId);

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

  if (isSupabaseServiceConfigured()) {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("resources")
      .update({ is_active: false })
      .eq("id", resourceId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: "RESOURCE_DEACTIVATE_FAILED",
          message: error?.message ?? "Resource could not be deactivated."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapResourcePayload(data as Record<string, unknown>, { ...existingResource, isActive: false, maintenanceStatus: "unavailable" }),
      source: "supabase"
    });
  }

  return NextResponse.json({
    success: true,
    data: { ...existingResource, isActive: false },
    source: "mock"
  });
}
