import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useWorkflowSession = () => {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const handleSessionRefresh = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error("Session refresh failed:", error);
        toast.error("Failed to refresh session. Please try logging in again.");
        await signOut();
        return false;
      }

      // Retry queries after refresh
      await queryClient.invalidateQueries();
      return true;
    } catch (error) {
      console.error("Error refreshing session:", error);
      toast.error("Failed to refresh session. Please try logging in again.");
      return false;
    }
  };

  return { handleSessionRefresh };
};