import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMyRole } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { getPermissionsForRole, type RolePermissions, type UserRoleType } from "@/lib/roles";

export interface RoleContextValue {
  role: UserRoleType;
  permissions: RolePermissions;
  isAdmin: boolean;
  isManager: boolean;
  isRequestor: boolean;
  isLoading: boolean;
  refreshRole: () => void;
}

export const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRoleType>("requestor");
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) {
          setRole("requestor");
          setIsLoading(false);
        }
        return;
      }
      try {
        const res = await getMyRole();
        if (!cancelled) setRole((res.role as UserRoleType) ?? "requestor");
      } catch {
        if (!cancelled) setRole("requestor");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo<RoleContextValue>(() => {
    const permissions = getPermissionsForRole(role);
    return {
      role,
      permissions,
      isAdmin: role === "admin",
      isManager: role === "manager",
      isRequestor: role === "requestor",
      isLoading,
      refreshRole: () => setTick((t) => t + 1),
    };
  }, [role, isLoading]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
