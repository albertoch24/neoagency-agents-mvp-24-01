import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/brief";
import { validateWorkflowEntities } from "./validationService";
import { toast } from "sonner";

export const processWorkflowStage = async (
  briefId: string,
  stage: Stage,
  flowSteps: any[]
) => {
  console.log("Starting workflow stage processing");
  
  // Validate all required entities exist
  const validation = await validateWorkflowEntities(briefId, stage.id);
  if (!validation.isValid) {
    toast.error(validation.message || "Workflow validation failed");
    throw new Error(validation.message);
  }

  if (!stage.flow_id) {
    throw new Error(`Stage "${stage.name}" has no associated flow`);
  }

  if (flowSteps.length === 0) {
    throw new Error("No flow steps found");
  }

  try {
    console.log("Calling process-workflow-stage function with:", {
      briefId,
      stageId: stage.id,
      flowId: stage.flow_id,
      flowStepsCount: flowSteps.length
    });

    const { data: workflowData, error: workflowError } = await supabase.functions.invoke(
      "process-workflow-stage",
      {
        body: { 
          briefId, 
          stageId: stage.id,
          flowId: stage.flow_id,
          flowSteps: flowSteps
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        }
      }
    );

    if (workflowError) {
      console.error("Workflow processing error:", workflowError);
      throw workflowError;
    }

    if (!workflowData) {
      throw new Error("No data returned from workflow processing");
    }

    console.log("Workflow processing completed successfully:", workflowData);
    return workflowData;
  } catch (error) {
    console.error("Error in processWorkflowStage:", error);
    throw error;
  }
};