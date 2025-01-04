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

  // Use the validated flow steps from the database
  const validatedFlowSteps = validation.flowSteps;
  if (!validatedFlowSteps || validatedFlowSteps.length === 0) {
    throw new Error("No valid flow steps found");
  }

  console.log("Processing workflow steps:", {
    briefId,
    stageId: stage.id,
    flowId: stage.flow_id,
    stepsCount: validatedFlowSteps.length,
    steps: validatedFlowSteps.map(step => ({
      id: step.id,
      agentId: step.agent_id,
      orderIndex: step.order_index
    }))
  });

  try {
    console.log("Invoking process-workflow-stage function with params:", {
      briefId,
      stageId: stage.id,
      flowId: stage.flow_id
    });

    const { data: workflowData, error: workflowError } = await supabase.functions.invoke(
      "process-workflow-stage",
      {
        body: { 
          briefId, 
          stageId: stage.id,
          flowId: stage.flow_id,
          flowSteps: validatedFlowSteps
        },
      }
    );

    if (workflowError) {
      console.error("Error in workflow processing:", workflowError);
      throw workflowError;
    }

    console.log("Workflow stage processed successfully:", workflowData);

    // Trigger stage summary generation
    try {
      console.log("Generating stage summary for:", {
        briefId,
        stageId: stage.id
      });

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
  } catch (error) {
    console.error("Error invoking workflow function:", error);
    throw new Error("Failed to process workflow stage. Please try again.");
  }
};