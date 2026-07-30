"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { publicSignupRoles } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { titleCase } from "@/lib/utils";

const storageKey = "resourcify-demo-role";

type DemoRoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const DemoRoleContext = createContext<DemoRoleContextValue>({
  role: "student",
  setRole: () => undefined
});

export function DemoRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("student");

  useEffect(() => {
    const savedRole = window.localStorage.getItem(storageKey) as UserRole | null;

    if (savedRole && publicSignupRoles.includes(savedRole)) {
      setRoleState(savedRole);
    }
  }, []);

  function setRole(nextRole: UserRole) {
    setRoleState(nextRole);
    window.localStorage.setItem(storageKey, nextRole);
  }

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
}

export function useDemoRole() {
  return useContext(DemoRoleContext);
}

export function DemoRoleSwitcher() {
  const { role, setRole } = useDemoRole();

  return (
    <label className="flex min-h-10 items-center gap-2 rounded border border-white/10 bg-ink-850 px-3 text-xs font-bold text-[#C9C9DA]">
      Demo role
      <select
        className="bg-transparent text-white outline-none"
        onChange={(event) => setRole(event.target.value as UserRole)}
        value={role}
      >
        {publicSignupRoles.map((item) => (
          <option className="bg-ink-900 text-white" key={item} value={item}>
            {titleCase(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
