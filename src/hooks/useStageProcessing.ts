import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStageDataFetching } from "./stage-processing/useStageDataFetching";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { fetchStageData } = useStageDataFetching();

  const processStage = async (feedbackId: string | null, targetStageId?: string) => {
    const stageToProcess = targetStageId || stageId;
    
    if (!briefId || !stageToProcess) {
      console.error("❌ Missing required parameters:", { briefId, stageToProcess });
      return;
    }

    setIsProcessing(true);
    console.log("🚀 Starting stage processing:", {
      briefId,
      stageId: stageToProcess,
      hasFeedback: !!feedbackId,
      targetStageId,
      timestamp: new Date().toISOString()
    });

    try {
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

      // Invoke the edge function with proper error handling
      const { data, error } = await supabase.functions.invoke('process-workflow-stage', {
        body: {
          briefId,
          stageId: stageToProcess,
          flowSteps,
          feedbackId: feedbackId || null
        }
      });

      if (error) {
        console.error("❌ Edge function error:", {
          error,
          briefId,
          stageId: stageToProcess,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      console.log("✅ Edge function response:", {
        success: true,
        briefId,
        stageId: stageToProcess,
        data,
        timestamp: new Date().toISOString()
      });

      toast.success("Stage processed successfully!");
    } catch (error) {
      console.error("❌ Error in processStage:", {
        error,
        briefId,
        stageId: stageToProcess,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to process stage");
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