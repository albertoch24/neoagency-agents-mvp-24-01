import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/brief";

export const processWorkflowStage = async (
  briefId: string,
  stage: Stage,
  flowSteps: any[]
) => {
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