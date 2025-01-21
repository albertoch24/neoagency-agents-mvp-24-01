import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";

export const useEdgeFunctionCall = () => {
  const callEdgeFunction = async (
    briefId: string,
    stage: Stage,
    flowSteps: any[],
    feedbackId: string | null
  ) => {
    console.log("🚀 Invoking edge function:", {
      briefId,
      stageId: stage.id,
      flowStepsCount: flowSteps.length,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    const { data, error: functionError } = await supabase.functions.invoke("process-workflow-stage", {
      body: { 
        briefId,
        stageId: stage.id,
        flowSteps,
        feedbackId: feedbackId || null
      }
    });

    if (functionError) {
      console.error("❌ Edge function error:", {
        error: functionError,
        stageId: stage.id,
        timestamp: new Date().toISOString()
      });
      throw functionError;
    }

    console.log("✅ Edge function completed successfully:", {
      stageId: stage.id,
      stageName: stage.name,
      response: data,
      timestamp: new Date().toISOString()
    });

    return data;
  };

  return { callEdgeFunction };
};