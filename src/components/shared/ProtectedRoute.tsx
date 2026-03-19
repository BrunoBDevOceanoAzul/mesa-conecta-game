import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these profile roles can access. "admin" is checked via user_roles table. */
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [roleLoading, setRoleLoading] = useState(!!allowedRoles);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!allowedRoles || !user) {
      setRoleLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const [profileRes, adminRes] = await Promise.all([
          supabase.from("profiles").select("role, can_play, can_gm").eq("user_id", user.id).maybeSingle(),
          allowedRoles.includes("admin")
            ? supabase.rpc("is_admin", { _user_id: user.id })
            : Promise.resolve({ data: false }),
        ]);

        const profile = profileRes.data;
        // Effective roles: primary role + hybrid capabilities
        const effectiveRoles: string[] = [];
        if (profile?.role) effectiveRoles.push(profile.role);
        if (profile?.can_play && !effectiveRoles.includes("player")) effectiveRoles.push("player");
        if (profile?.can_gm && !effectiveRoles.includes("gm")) effectiveRoles.push("gm");

        setUserRole(profile?.role || null);
        setIsAdmin(!!adminRes.data);

        // Store effective roles for access check
        (window as any).__hiviumEffectiveRoles = effectiveRoles;
      } catch (err) {
        console.warn("[ProtectedRoute] Error checking access:", err);
        setError(true);
      } finally {
        setRoleLoading(false);
      }
    };

    checkAccess();
  }, [user, allowedRoles]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If there was an error checking roles, redirect to a safe page
  if (error && allowedRoles) {
    return <Navigate to="/" replace />;
  }

  // Role-based guard
  if (allowedRoles) {
    const effectiveRoles: string[] = (window as any).__hiviumEffectiveRoles || (userRole ? [userRole] : []);
    const hasAccess =
      (allowedRoles.includes("admin") && isAdmin) ||
      effectiveRoles.some(r => allowedRoles.includes(r));

    if (!hasAccess) {
      const roleRoutes: Record<string, string> = {
        player: "/dashboard/jogador",
        gm: "/dashboard/mestre",
        store: "/dashboard/loja",
        brand: "/feed",
      };
      return <Navigate to={roleRoutes[userRole || ""] || "/"} replace />;
    }
  }

  return <>{children}</>;
}
