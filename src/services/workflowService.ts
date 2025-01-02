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

  // Ensure steps are sorted by order_index
  flowSteps.sort((a, b) => a.order_index - b.order_index);

  console.log("Processing workflow steps:", {
    briefId,
    stageId: stage.id,
    flowId: stage.flow_id,
    stepsCount: flowSteps.length
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
    }
  );

  if (workflowError) {
    console.error("Error in workflow processing:", workflowError);
    throw workflowError;
  }

  // Trigger stage summary generation
  try {
    await supabase.functions.invoke('generate-stage-summary', {
      body: { 
        briefId,
        stageId: stage.id
      },
    });
  } catch (error) {
    console.error("Error generating stage summary:", error);
    // Don't throw here to avoid blocking the workflow
  }

  return workflowData;
};