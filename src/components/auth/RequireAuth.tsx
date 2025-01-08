import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth = ({ children, requireAdmin = false }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
    retry: 3,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (loading || profileLoading) {
      return;
    }

    if (!user) {
      console.log("No user found, redirecting to /auth");
      navigate("/auth", { state: { from: location }, replace: true });
      return;
    }

    if (requireAdmin && !profile?.is_admin) {
      console.log("User is not admin, redirecting to /");
      navigate("/", { replace: true });
    }
  }, [user, loading, profileLoading, profile, navigate, location, requireAdmin]);

  if (loading || profileLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    </div>;
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !profile?.is_admin) {
    return null;
  }

  return <>{children}</>;
};