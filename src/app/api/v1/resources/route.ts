import { NextResponse } from "next/server";
import { resources } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export function GET() {
  return NextResponse.json({
    data: resources,
    source: isSupabaseConfigured() ? "mock-until-supabase-rpc-is-enabled" : "mock"
  });
}
