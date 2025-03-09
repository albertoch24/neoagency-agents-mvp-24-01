
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const processWorkflowStage = async (
  briefId: string,
  stage: any,
  flowSteps: any[]
) => {
  console.log("Starting workflow stage processing:", {
    briefId,
    stageId: stage.id,
    flowStepsCount: flowSteps?.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Call the edge function to process the stage with proper URL formatting
    console.log("Invoking Edge Function with payload:", {
      briefId,
      stageId: stage.id,
      flowStepsCount: flowSteps?.length,
      functionName: "process-workflow-stage",
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase.functions.invoke("process-workflow-stage", {
      body: { 
        briefId,
        stageId: stage.id,
        flowSteps,
        feedbackId: null
      }
    });

    if (error) {
      console.error("Error processing stage:", error);
      
      // Check for API key related errors
      if (error.message && error.message.includes("API key")) {
        toast.error("OpenAI API key is invalid or missing. Please check your API key configuration.");
        throw new Error("Invalid OpenAI API key. Please update your API key in Supabase Edge Function Secrets.");
      } else {
        toast.error("Failed to process stage. Please try again.");
        throw error;
      }
    }

    console.log("Stage processing completed:", {
      briefId,
      stageId: stage.id,
      outputs: data?.outputs,
      timestamp: new Date().toISOString()
    });

    return data;
  } catch (error) {
    console.error("Error in processWorkflowStage:", error);
    throw error;
  }
};
