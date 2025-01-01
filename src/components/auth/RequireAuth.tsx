import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth = ({ children, requireAdmin = false }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log("RequireAuth rendering", { user, loading, requireAdmin });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      console.log("Fetching profile for user:", user?.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      console.log("Fetched profile:", data);
      return data;
    },
    enabled: !!user,
  });

  if (loading || (user && isLoadingProfile)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log("No user found, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !profile?.is_admin) {
    console.log("User is not admin, redirecting to /");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};