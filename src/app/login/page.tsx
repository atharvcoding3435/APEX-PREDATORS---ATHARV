"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, UserPlus } from "lucide-react";
import { publicSignupRoles } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

type AuthMode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [department, setDepartment] = useState("Computer Science");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nextPath = searchParams.get("next") || "/dashboard";
  const isSignup = mode === "signup";

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(isSignup ? "/api/v1/auth/signup" : "/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { name, email, password, role, department } : { email, password }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "Unable to sign in with these credentials.");
        return;
      }

      router.push(isSignup && nextPath.startsWith("/admin") ? "/dashboard" : nextPath);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof DOMException && loginError.name === "AbortError" ? "Sign in timed out. Please try again." : "Sign in failed. Please try again.");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-ink-950 px-4 py-8 text-white">
      <section className="m-auto grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-ink-900 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <p className="text-sm font-bold uppercase text-signal-success">Resourcify</p>
          <h1 className="mt-2 text-3xl font-black">{isSignup ? "Create your account" : "Sign in to continue"}</h1>
          <p className="mt-3 text-sm leading-6 text-[#A0A0B8]">
            {isSignup
              ? "Create a Supabase email/password account, or finish setup for an email already added in Supabase."
              : "Use your Supabase email and password account. Magic links are intentionally disabled for this MVP sprint."}
          </p>
          <div className="mt-8 rounded border border-signal-info/30 bg-signal-info/10 p-4">
            <LockKeyhole className="mb-3 text-signal-info" size={22} aria-hidden="true" />
            <h2 className="font-bold">Role-based routing</h2>
            <p className="mt-2 text-sm text-[#C9C9DA]">
              Admin users are created manually. Students, faculty, clubs, and guests can create booking workspace accounts here.
            </p>
          </div>
        </div>

        <form className="grid gap-4 p-6" onSubmit={submitLogin}>
          <div className="grid grid-cols-2 gap-2 rounded border border-white/10 bg-ink-850 p-1">
            {(["signin", "signup"] as AuthMode[]).map((item) => (
              <button
                className={cn(
                  "min-h-10 rounded text-sm font-bold transition",
                  mode === item ? "bg-signal-success text-ink-950" : "text-[#C9C9DA] hover:bg-white/5 hover:text-white"
                )}
                key={item}
                onClick={() => {
                  setMode(item);
                  setError("");
                }}
                type="button"
              >
                {item === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {isSignup ? (
            <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
              Full name
              <input
                className="min-h-12 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none focus:border-signal-success"
                onChange={(event) => setName(event.target.value)}
                required
                type="text"
                value={name}
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
            Email
            <input
              className="min-h-12 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none focus:border-signal-success"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
            Password
            <input
              className="min-h-12 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none focus:border-signal-success"
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={isSignup ? 6 : undefined}
              type="password"
              value={password}
            />
          </label>

          {isSignup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
                Role
                <select
                  className="min-h-12 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none focus:border-signal-success"
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  value={role}
                >
                  {publicSignupRoles.map((item) => (
                    <option key={item} value={item}>
                      {titleCase(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#C9C9DA]">
                Department or group
                <input
                  className="min-h-12 rounded border border-white/10 bg-ink-850 px-3 text-white outline-none focus:border-signal-success"
                  onChange={(event) => setDepartment(event.target.value)}
                  required
                  type="text"
                  value={department}
                />
              </label>
            </div>
          ) : null}

          {error ? (
            <div className="rounded border border-signal-danger/30 bg-signal-danger/10 p-3 text-sm font-bold text-signal-danger" role="alert">
              {error}
            </div>
          ) : null}

          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded bg-signal-success px-5 font-bold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? (isSignup ? "Creating account" : "Signing in") : isSignup ? "Create Account" : "Sign In"}
            {isSignup ? <UserPlus size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
          </button>
          <Link className="text-sm font-bold text-signal-info hover:text-white" href="/">
            Back to project overview
          </Link>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-ink-950 px-4 text-white">
          <div className="rounded-lg border border-white/10 bg-ink-900 p-6 text-sm font-bold text-[#C9C9DA]">
            Loading sign in
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
