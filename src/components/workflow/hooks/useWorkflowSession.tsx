import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useWorkflowSession = () => {
  const { refreshSession } = useAuth();
  const queryClient = useQueryClient();

  const handleSessionRefresh = async () => {
    try {
      await refreshSession();
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