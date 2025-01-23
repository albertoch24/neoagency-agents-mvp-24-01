import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BriefFormData } from "@/types/brief";
import { Stage } from "@/types/workflow";
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
      const actionType = initialData ? "Updating" : "Creating";
      toast.info(`${actionType} your brief... Please wait while we process your request.`, {
        duration: 5000
      });

      // Clean up existing data if updating
      if (initialData?.id) {
        await cleanupExistingBriefData(initialData.id);
        await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
        await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      }

      // Create/update the brief
      const brief = await createOrUpdateBrief(values, user.id, initialData?.id);
      console.log("Brief created/updated successfully:", brief);

      // Get the first stage and its flow
      const stage = await fetchFirstStage(user.id) as Stage;
      if (!stage) {
        toast.error("No stages found. Please create stages first.", {
          duration: 8000
        });
        setIsProcessing(false);
        return;
      }

      console.log("Retrieved first stage:", stage);

      // Process the first stage automatically
      const toastId = toast.loading(
        "Processing Kick Off stage... Please wait while we analyze your brief.",
        { duration: 120000 }
      );

      try {
        const flowSteps = stage.flows?.flow_steps || [];
        if (!flowSteps.length) {
          throw new Error("No flow steps found for the first stage");
        }

        // Process the first stage
        await processWorkflowStage(brief.id, stage, flowSteps);
        
        toast.dismiss(toastId);
        toast.success(
          initialData 
            ? "Brief updated and Kick Off stage processed successfully!"
            : "Brief created and Kick Off stage processed successfully!",
          { duration: 8000 }
        );

        // Invalidate all relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["briefs"] }),
          queryClient.invalidateQueries({ queryKey: ["brief"] }),
          queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] }),
          queryClient.invalidateQueries({ queryKey: ["brief-outputs"] }),
          queryClient.invalidateQueries({ queryKey: ["stage-flow-steps"] })
        ]);

        setIsProcessing(false);
        onSubmitSuccess?.();
        
        // Force a small delay to ensure queries are invalidated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate to first stage with outputs visible
        const searchParams = new URLSearchParams();
        searchParams.set("briefId", brief.id);
        searchParams.set("stage", stage.id);
        searchParams.set("showOutputs", "true");
        
        navigate(`/?${searchParams.toString()}`, {
          replace: true,
          state: { 
            briefId: brief.id,
            stage: stage.id,
            showOutputs: true,
            forceShowOutputs: true,
            isFirstStage: true
          }
        });

      } catch (error) {
        console.error("Error processing Kick Off stage:", error);
        toast.dismiss(toastId);
        toast.error(
          "Brief saved but Kick Off stage processing failed. Please try again.",
          { duration: 8000 }
        );
        setIsProcessing(false);
      }

    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error(
        "Error submitting brief. Please check your input and try again.",
        { duration: 8000 }
      );
      setIsProcessing(false);
    }
  };

  return { handleSubmit, isProcessing };
};