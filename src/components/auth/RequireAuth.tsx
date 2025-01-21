import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth = ({ children, requireAdmin = false }: RequireAuthProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("RequireAuth effect running", {
      loading,
      user,
      isAdmin,
      requireAdmin
    });
  }, [loading, user, isAdmin, requireAdmin]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log("Access denied - Admin required", {
      userId: user.id,
      isAdmin,
      path: location.pathname
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};