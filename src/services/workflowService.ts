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

  if (workflowError) throw workflowError;
  return workflowData;
};