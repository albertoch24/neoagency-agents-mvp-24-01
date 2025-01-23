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
import { validateBrief } from "@/utils/briefValidation";

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

    console.log("📝 Submitting brief with values:", {
      values,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

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
      
      // Validate the created/updated brief
      const briefValidation = await validateBrief(brief.id);
      if (!briefValidation.isValid) {
        throw new Error(`Brief validation failed: ${briefValidation.error}`);
      }

      console.log("✅ Brief created/updated successfully:", {
        briefId: brief.id,
        timestamp: new Date().toISOString()
      });

      // Get the first stage and its flow
      const stage = await fetchFirstStage(user.id) as Stage;
      if (!stage) {
        toast.error("No stages found. Please create stages first.", {
          duration: 8000
        });
        setIsProcessing(false);
        return;
      }

      console.log("📋 Retrieved first stage:", {
        stageId: stage.id,
        stageName: stage.name,
        timestamp: new Date().toISOString()
      });

      const toastId = toast.loading(
        "Starting initial workflow process... This may take a few minutes.",
        { duration: 120000 }
      );

      try {
        const flowSteps = stage.flows?.flow_steps || [];
        if (!flowSteps.length) {
          throw new Error("No flow steps found for the first stage");
        }

        await processWorkflowStage(brief.id, stage, flowSteps);
        
        toast.dismiss(toastId);
        toast.success(
          initialData 
            ? "Brief updated and initial workflow started successfully!"
            : "Brief submitted and initial workflow completed successfully!",
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
        
        // Always navigate to the first stage with the correct parameters
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

      } catch (error: any) {
        console.error("❌ Error starting workflow:", {
          error,
          briefId: brief.id,
          stageId: stage.id,
          timestamp: new Date().toISOString()
        });
        toast.dismiss(toastId);
        toast.error(
          "Brief saved but workflow failed to start. Please try again or contact support.",
          { duration: 8000 }
        );
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("❌ Error submitting brief:", {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error(
        `Error submitting brief: ${error.message}`,
        { duration: 8000 }
      );
      setIsProcessing(false);
    }
  };

  return { handleSubmit, isProcessing };
};