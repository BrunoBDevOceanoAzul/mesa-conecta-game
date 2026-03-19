import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePrivileges } from "@/hooks/use-privileges";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these profile roles can access. Admin/Advisor always bypass. */
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { loading: privLoading, hasAccess, profileRole, isSuperUser } = usePrivileges();

  if (authLoading || privLoading) {
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
  if (allowedRoles && !hasAccess(allowedRoles)) {
    const roleRoutes: Record<string, string> = {
      player: "/dashboard/jogador",
      gm: "/dashboard/mestre",
      store: "/dashboard/loja",
      brand: "/feed",
    };
    return <Navigate to={roleRoutes[profileRole || ""] || "/"} replace />;
  }

  return <>{children}</>;
}
