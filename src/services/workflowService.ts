
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateHeaders } from "@/utils/headers/validateHeaders";

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
    // Explicitly validate authentication before making the request
    const headers = await validateHeaders();
    console.log("✅ Authentication validated, proceeding with Edge Function call");

    // Call the edge function to process the stage with proper URL formatting
    console.log("Invoking Edge Function with payload:", {
      briefId,
      stageId: stage.id,
      flowStepsCount: flowSteps?.length,
      functionName: "process-workflow-stage",
      timestamp: new Date().toISOString()
    });

    // Set explicit timeout for the function call
    const { data, error } = await supabase.functions.invoke("process-workflow-stage", {
      body: { 
        briefId,
        stageId: stage.id,
        flowSteps,
        feedbackId: null
      },
      headers: {
        Authorization: `Bearer ${headers.authorization}`
      }
    });

    if (error) {
      console.error("Error processing stage:", error);
      
      // Check for authentication errors specifically
      if (error.message && (
          error.message.includes("API key") || 
          error.message.includes("401") || 
          error.message.includes("authentication") ||
          error.message.includes("auth") ||
          error.message.includes("token")
        )) {
        console.error("Authentication error detected:", error.message);
        
        // Try to refresh the session
        const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Session refresh failed:", refreshError);
          toast.error("Authentication error. Please try logging in again.");
          throw new Error("Authentication failed. Please log in again.");
        } else {
          console.log("Session refreshed successfully");
          toast.warning("Session refreshed. Please try again.");
          throw new Error("Session refreshed. Please try the operation again.");
        }
      } else if (error.message && error.message.includes("OpenAI API key")) {
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
