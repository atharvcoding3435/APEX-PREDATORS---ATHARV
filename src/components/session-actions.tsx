"use client";

import { LogOut, ShieldCheck, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { titleCase } from "@/lib/utils";

export function SessionActions() {
  const router = useRouter();
  const { user, loading } = useAuth();

  async function signOut() {
    if (isSupabaseConfigured()) {
      await createBrowserSupabaseClient().auth.signOut();
    }

    await fetch("/api/v1/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <span className="rounded border border-white/10 bg-ink-850 px-3 py-2 text-xs font-bold text-[#A0A0B8]">Loading user</span>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex min-h-10 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-xs font-bold text-[#C9C9DA]">
        {user.role === "admin" ? <ShieldCheck size={16} aria-hidden="true" /> : <UserCircle size={16} aria-hidden="true" />}
        {user.name} · {titleCase(user.role)}
      </span>
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded border border-white/10 px-3 text-xs font-bold text-[#C9C9DA] transition hover:bg-white/5 hover:text-white"
        onClick={signOut}
        type="button"
      >
        <LogOut size={16} aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}
