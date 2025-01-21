import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useWorkflowSession = () => {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const handleSessionRefresh = async () => {
    try {
      console.log("Attempting to refresh session...");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session refresh error:", error);
        toast.error("Failed to refresh session. Please try logging in again.");
        await signOut();
        return false;
      }

      if (!session) {
        console.warn("No active session found");
        // Don't immediately sign out - give time for normal initialization
        return false;
      }

      console.log("Session refresh successful:", session.user?.id);
      
      // Retry queries after successful refresh
      await queryClient.invalidateQueries();
      return true;
    } catch (error) {
      console.error("Unexpected error during session refresh:", error);
      toast.error("An unexpected error occurred. Please try logging in again.");
      return false;
    }
  };

  return { handleSessionRefresh };
};