
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStageDataFetching } from "./stage-processing/useStageDataFetching";
import { processWorkflowStage } from "@/services/workflowService";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { fetchStageData } = useStageDataFetching();

  const processStage = async (feedbackId: string | null, targetStageId?: string) => {
    const stageToProcess = targetStageId || stageId;
    
    if (!briefId || !stageToProcess) {
      console.error("❌ Missing required parameters:", { briefId, stageToProcess });
      throw new Error("Missing required parameters");
    }

    setIsProcessing(true);
    const toastId = toast.loading(
      "Processing stage... This may take a few moments.",
      { duration: 60000 }
    );

    try {
      // Update brief status
      const { error: briefError } = await supabase
        .from("briefs")
        .update({
          current_stage: stageToProcess,
          status: "in_progress"
        })
        .eq("id", briefId);

      if (briefError) {
        throw new Error(`Error updating brief: ${briefError.message}`);
      }

      // Fetch stage data including flow steps
      console.log("📥 Fetching stage data for:", stageToProcess);
      const stage = await fetchStageData(stageToProcess);
      
      if (!stage?.flow_id) {
        console.error("❌ No flow_id found for stage:", {
          stageId: stageToProcess,
          stageName: stage?.name
        });
        throw new Error("No flow_id found for this stage");
      }

      console.log("✅ Stage data retrieved:", {
        stageId: stageToProcess,
        flowId: stage.flow_id,
        stageName: stage.name
      });

      // Fetch flow steps using the correct flow_id
      const { data: flowSteps, error: flowStepsError } = await supabase
        .from("flow_steps")
        .select(`
          id,
          agent_id,
          requirements,
          order_index,
          outputs,
          description,
          agents (
            id,
            name,
            description
          )
        `)
        .eq("flow_id", stage.flow_id)
        .order("order_index", { ascending: true });

      if (flowStepsError || !flowSteps?.length) {
        console.error("❌ Error fetching flow steps:", {
          error: flowStepsError,
          stageId: stageToProcess,
          flowId: stage.flow_id
        });
        throw new Error("Failed to fetch flow steps");
      }

      console.log("📋 Flow steps retrieved:", {
        stageId: stageToProcess,
        flowStepsCount: flowSteps.length,
        flowSteps: flowSteps.map(step => ({
          id: step.id,
          agentId: step.agent_id,
          orderIndex: step.order_index
        }))
      });

      // Now use the service to call the Edge Function and process the workflow stage
      try {
        const data = await processWorkflowStage(briefId, stage, flowSteps);

        console.log("✅ Workflow stage processing completed:", {
          briefId,
          stageId: stageToProcess,
          data,
          timestamp: new Date().toISOString()
        });

        toast.dismiss(toastId);
        toast.success("Stage processed successfully!");
        
        return data;
      } catch (apiError) {
        console.error("❌ API processing error:", apiError);
        
        // Handle API key specific errors
        if (apiError.message && apiError.message.includes("API key")) {
          toast.dismiss(toastId);
          toast.error("OpenAI API key is invalid. Please update your API key in Supabase Edge Function Secrets.");
          throw new Error("Invalid OpenAI API key configuration");
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error("❌ Error in processStage:", {
        error,
        briefId,
        stageId: stageToProcess,
        timestamp: new Date().toISOString()
      });
      toast.dismiss(toastId);
      toast.error("Failed to process stage: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processStage
  };
};
