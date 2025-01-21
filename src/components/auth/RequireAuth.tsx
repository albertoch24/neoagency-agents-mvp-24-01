import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth = ({ children, requireAdmin = false }: RequireAuthProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Fetch profile data to check admin status
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log("Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      console.log("Profile data:", data);
      return data;
    },
    enabled: !!user,
    retry: 1
  });

  useEffect(() => {
    console.log("RequireAuth effect running", { 
      authLoading, 
      user, 
      profileLoading,
      isAdmin: profile?.is_admin, 
      requireAdmin 
    });

    if (!authLoading && !profileLoading) {
      if (!user) {
        navigate("/auth");
      } else if (requireAdmin && !profile?.is_admin) {
        console.log("User is not admin, redirecting to /");
        navigate("/");
      }
    }
  }, [authLoading, profileLoading, user, profile, requireAdmin, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !profile?.is_admin) {
    return null;
  }

  return <>{children}</>;
};