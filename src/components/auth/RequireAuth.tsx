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

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    retry: 3,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    console.log("RequireAuth effect running", {
      loading,
      profileLoading,
      user: user?.id,
      isAdmin: profile?.is_admin,
      requireAdmin
    });

    if (!loading && !profileLoading) {
      if (!user) {
        console.log("No user found, redirecting to /auth");
        navigate("/auth", { state: { from: location }, replace: true });
      } else if (requireAdmin && !profile?.is_admin) {
        console.log("User is not admin, redirecting to /");
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, profileLoading, profile, navigate, location, requireAdmin]);

  if (loading || profileLoading) {
    console.log("Auth or profile loading...");
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("No user, not rendering protected content");
    return null;
  }

  if (requireAdmin && !profile?.is_admin) {
    console.log("User is not admin, not rendering admin content");
    return null;
  }

  console.log("Rendering protected content for user:", user.id);
  return <>{children}</>;
};