import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth = ({ children, requireAdmin = false }: RequireAuthProps) => {
  console.log("RequireAuth rendering", { requireAdmin });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("RequireAuth effect running", {
      loading,
      user: user?.id,
      isAdmin: user?.user_metadata?.is_admin,
      requireAdmin
    });

    if (!loading) {
      if (!user) {
        console.log("No user found, redirecting to /auth");
        navigate("/auth", { state: { from: location }, replace: true });
      } else if (requireAdmin && !user.user_metadata?.is_admin) {
        console.log("User is not admin, redirecting to /");
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate, location, requireAdmin]);

  if (loading) {
    console.log("Auth loading...");
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("No user, not rendering protected content");
    return null;
  }

  if (requireAdmin && !user.user_metadata?.is_admin) {
    console.log("User is not admin, not rendering admin content");
    return null;
  }

  console.log("Rendering protected content for user:", user.id);
  return <>{children}</>;
};