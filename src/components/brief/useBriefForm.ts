import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BriefFormData } from "@/types/brief";
import { 
  cleanupExistingBriefData,
  createOrUpdateBrief,
  fetchFirstStage
} from "@/services/briefService";
import { processWorkflowStage } from "@/services/workflowService";

export const useBriefForm = (initialData?: any, onSubmitSuccess?: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: BriefFormData) => {
    if (!user) {
      toast.error("You must be logged in to submit a brief");
      return;
    }

    console.log("Submitting brief with values:", values);
    console.log("Current user:", user);

    try {
      setIsProcessing(true);
      toast.info(initialData ? "Updating your brief..." : "Creating your brief...");

      // Clean up existing data if updating
      if (initialData?.id) {
        await cleanupExistingBriefData(initialData.id);
      }

      // Create/update the brief
      const brief = await createOrUpdateBrief(values, user.id, initialData?.id);
      console.log("Brief created/updated successfully:", brief);

      // Get the first stage and its flow
      const stage = await fetchFirstStage(user.id);
      if (!stage) {
        toast.error("No stages found. Please create stages first.");
        setIsProcessing(false);
        return;
      }

      console.log("Retrieved stage with flow:", stage);

      // Sort flow steps by order_index
      const flowSteps = stage.flows?.flow_steps || [];
      console.log("Retrieved flow steps before sorting:", flowSteps);
      flowSteps.sort((a, b) => a.order_index - b.order_index);
      console.log("Flow steps after sorting:", flowSteps);

      // Start workflow processing
      const toastId = toast.loading(
        "Starting workflow process... This may take around 2 minutes. Rome wasn't built in a day 😃",
        { duration: Infinity }
      );

      try {
        await processWorkflowStage(brief.id, stage, flowSteps);
        toast.dismiss(toastId);
        toast.success(initialData ? "Brief updated and workflow restarted!" : "Brief submitted and workflow started successfully!");

        // Invalidate queries before navigation
        await queryClient.invalidateQueries({ queryKey: ["briefs"] });
        await queryClient.invalidateQueries({ queryKey: ["brief"] });
        await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
        await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });

        setIsProcessing(false);
        onSubmitSuccess?.();
        
        // Add a small delay to ensure data is refreshed before navigation
        setTimeout(() => {
          navigate(`/?stage=${stage.name}&briefId=${brief.id}&showOutputs=true`, {
            replace: true // Use replace to avoid back button issues
          });
        }, 500);
      } catch (error) {
        console.error("Error starting workflow:", error);
        toast.dismiss(toastId);
        toast.error("Brief saved but workflow failed to start. Please try again or contact support.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error("Error submitting brief. Please try again.");
      setIsProcessing(false);
    }
  };

  return { handleSubmit, isProcessing };
};