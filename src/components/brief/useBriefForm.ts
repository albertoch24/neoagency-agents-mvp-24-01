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
        // Invalidate queries immediately after cleanup
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

      // Automatically start processing for the first stage only
      const toastId = toast.loading(
        "Starting initial workflow process... This may take a few minutes. We're analyzing your brief and generating insights. Please don't close this window.",
        { duration: 120000 } // 2 minutes
      );

      try {
        // Get flow steps from the stage's flow
        const flowSteps = stage.flows?.flow_steps || [];
        if (!flowSteps.length) {
          throw new Error("No flow steps found for the first stage");
        }

        // Process each flow step and create workflow conversations
        await processWorkflowStage(brief.id, stage, flowSteps);
        
        toast.dismiss(toastId);
        toast.success(
          initialData 
            ? "Brief updated and initial workflow started successfully! You can now view the results."
            : "Brief submitted and initial workflow completed successfully! You can now view the results.",
          { duration: 8000 }
        );

        // Invalidate all relevant queries to refresh data
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
        
        // Update URL parameters and navigate with state
        const searchParams = new URLSearchParams();
        searchParams.set("briefId", brief.id);
        searchParams.set("stage", stage.id);
        searchParams.set("showOutputs", "true");
        
        // Navigate with state to ensure the outputs are shown
        navigate(`/?${searchParams.toString()}`, {
          replace: true,
          state: { 
            briefId: brief.id,
            stage: stage.id,
            showOutputs: true,
            forceShowOutputs: true
          }
        });

      } catch (error) {
        console.error("Error starting workflow:", error);
        toast.dismiss(toastId);
        toast.error(
          "Brief saved but workflow failed to start. Please try again or contact support if the issue persists.",
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