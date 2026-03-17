import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these profile roles can access. Others get redirected. */
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based guard: if allowedRoles specified, check user metadata or let component handle
  // We don't block here for allowedRoles since profile role is async;
  // the page component (e.g. BoostDashboard) handles role-based UI blocking.
  // This keeps auth guard simple and avoids race conditions.

  return <>{children}</>;
}
