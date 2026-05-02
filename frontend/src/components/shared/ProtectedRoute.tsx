import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { usePrivileges } from "@/hooks/use-privileges";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these profile roles can access. Admin/Advisor always bypass. */
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { loading: privLoading, hasAccess, profileRole, isSuperUser } = usePrivileges();

  useEffect(() => {
    if (authLoading || privLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !hasAccess(allowedRoles)) {
      const roleRoutes: Record<string, string> = {
        player: "/dashboard/jogador",
        gm: "/dashboard/mestre",
        store: "/dashboard/loja",
        brand: "/feed",
      };
      router.replace(roleRoutes[profileRole || ""] || "/");
    }
  }, [user, authLoading, privLoading, allowedRoles, hasAccess, profileRole, router]);

  if (authLoading || privLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (allowedRoles && !hasAccess(allowedRoles)) return null;

  return <>{children}</>;
}
