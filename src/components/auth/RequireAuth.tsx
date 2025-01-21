import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth = ({ children, requireAdmin = false }: RequireAuthProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Fetch profile data to check admin status
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
    enabled: !!user,
  });

  useEffect(() => {
    console.log("RequireAuth effect running", { loading, user, isAdmin: profile?.is_admin, requireAdmin });

    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (requireAdmin && !profile?.is_admin) {
        console.log("User is not admin, redirecting to /");
        navigate("/");
      }
    }
  }, [loading, user, profile, requireAdmin, navigate]);

  if (loading || profileLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !profile?.is_admin) {
    console.log("User is not admin, not rendering admin content");
    return null;
  }

  console.log("Rendering protected content for user:", user.id);
  return <>{children}</>;
};