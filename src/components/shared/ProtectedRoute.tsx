import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these profile roles can access. Others get redirected. */
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [roleLoading, setRoleLoading] = useState(!!allowedRoles);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!allowedRoles || !user) {
      setRoleLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUserRole(data?.role || null);
        setRoleLoading(false);
      });
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

  // Role-based guard
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    const roleRoutes: Record<string, string> = {
      player: "/dashboard/jogador",
      gm: "/dashboard/mestre",
      store: "/dashboard/loja",
      brand: "/feed",
    };
    return <Navigate to={roleRoutes[userRole] || "/"} replace />;
  }

  return <>{children}</>;
}
